import {
  Contract,
  Address,
  scValToNative,
  rpc,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
  xdr,
  Horizon,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { STELLAR_CONFIG, SUPPORTED_TOKENS } from '../config/constants';
import { supabase } from '../config/supabase';

// Dedicated Keeper Bot Credentials from Environment
const BOT_SECRET_KEY: string = (import.meta as any).env?.VITE_BOT_SECRET_KEY || '';
const botKeypair: Keypair = BOT_SECRET_KEY 
  ? Keypair.fromSecret(BOT_SECRET_KEY) 
  : Keypair.random();

// Custom Epoch: Jan 1, 2024 00:00:00 UTC[cite: 27]
const PROJECT_EPOCH_OFFSET = 1704067200;

export interface CreateIntentParams {
  caller: string;
  recipient: string;
  cosigner1?: string | null;
  cosigner2?: string | null;
  guardian?: string | null;
  asset?: string;
  amountStroops: bigint;
  purposeNote: string;
  observationDelaySeconds?: number;
  orgName?: string;
  senderName?: string;
  senderRole?: string;
}

export class ContractClient {
  private static server = new rpc.Server(STELLAR_CONFIG.RPC_URL, {
    allowHttp: STELLAR_CONFIG.RPC_URL.startsWith('http://'),
  });

  private static horizon = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

  public static encodeDbIntentId(onChainId: number): number {
    const nowSec = Math.floor(Date.now() / 1000);
    const deltaT = Math.max(nowSec - PROJECT_EPOCH_OFFSET, 1);
    return deltaT * 100000 + (onChainId % 100000);
  }

  public static decodeOnChainId(dbIntentId: number): number {
    if (dbIntentId < 100000) return dbIntentId;
    return dbIntentId % 100000;
  }

  public static decodeTimestamp(dbIntentId: number): number {
    if (dbIntentId < 100000) return Math.floor(Date.now() / 1000);
    const deltaT = Math.floor(dbIntentId / 100000);
    return deltaT + PROJECT_EPOCH_OFFSET;
  }

  /**
   * Pre-flight balance check: ensures the caller actually holds enough of the token
   * before sending a transaction that would otherwise fail simulation.
   */
  private static async verifySufficientBalance(
    caller: string,
    assetContractId: string,
    requiredStroops: bigint
  ): Promise<void> {
    try {
      const account = await this.horizon.loadAccount(caller);
      const isNative = assetContractId === STELLAR_CONFIG.NATIVE_TOKEN;

      const tokenMeta = Object.values(SUPPORTED_TOKENS).find(
        (t) => t.contractId.toUpperCase() === assetContractId.toUpperCase()
      );
      const symbol = tokenMeta?.symbol || (isNative ? 'XLM' : 'TOKEN');

      if (isNative) {
        const nativeBal = account.balances.find((b: any) => b.asset_type === 'native');
        const availableStroops = BigInt(Math.floor(parseFloat(nativeBal?.balance || '0') * 10_000_000));
        if (availableStroops < requiredStroops) {
          throw new Error(
            `Insufficient XLM balance. Available: ${nativeBal?.balance || '0'} XLM, Needed: ${(Number(requiredStroops) / 10_000_000).toFixed(2)} XLM`
          );
        }
      } else {
        const matchingLine = account.balances.find((b: any) => {
          if (b.asset_type === 'native') return false;
          return b.asset_code?.toUpperCase() === symbol.toUpperCase();
        });

        if (!matchingLine) {
          throw new Error(
            `No trustline or active balance found for ${symbol} in your wallet (${caller.slice(0, 6)}...${caller.slice(-4)}).`
          );
        }

        const tokenBalanceStroops = BigInt(Math.floor(parseFloat(matchingLine.balance || '0') * 10_000_000));
        if (tokenBalanceStroops < requiredStroops) {
          throw new Error(
            `Insufficient ${symbol} balance. Available: ${matchingLine.balance} ${symbol}, Required: ${(Number(requiredStroops) / 10_000_000).toFixed(2)} ${symbol}`
          );
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Insufficient') || err.message.includes('No trustline'))) {
        throw err;
      }
      // If Horizon lookup fails due to network, let Soroban simulation proceed
    }
  }

  private static async waitForConfirmation(hash: string): Promise<any> {
    const maxAttempts = 30;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const rpcRes = await fetch(STELLAR_CONFIG.RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: attempt,
            method: 'getTransaction',
            params: { hash },
          }),
        });

        const rpcData = await rpcRes.json();
        const txStatus = rpcData?.result?.status;

        if (txStatus === 'SUCCESS') {
          return rpcData.result;
        }

        if (txStatus === 'FAILED') {
          throw new Error(`Transaction reverted on-chain (RPC status: FAILED).`);
        }
      } catch (err: any) {
        if (err.message?.includes('reverted on-chain')) {
          throw err;
        }
      }
    }

    throw new Error(`Transaction submission timed out awaiting consensus. Hash: ${hash}`);
  }

  private static async submitTx(tx: any, callerAddress: string): Promise<{ hash: string; txResult: any }> {
    const simRes = await this.server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simRes)) {
      const errStr = String(simRes.error);
      if (errStr.includes('#13') || errStr.includes('trustline entry is missing')) {
        throw new Error(
          'Token contract error: Your connected wallet does not hold this asset or the issuer balance is 0.'
        );
      }
      throw new Error(`Simulation failed: ${simRes.error}`);
    }

    const assembledTx = rpc.assembleTransaction(tx, simRes).build();

    const signedResult: any = await signTransaction(assembledTx.toXDR(), {
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
      address: callerAddress,
    });

    if (typeof signedResult === 'object' && signedResult !== null && 'error' in signedResult) {
      throw new Error(String(signedResult.error));
    }

    const rawSignedXdr: string =
      typeof signedResult === 'string' ? signedResult : signedResult?.signedTxXdr;

    if (!rawSignedXdr) {
      throw new Error('Freighter did not return a valid signed transaction envelope.');
    }

    const finalTx = TransactionBuilder.fromXDR(
      rawSignedXdr,
      STELLAR_CONFIG.NETWORK_PASSPHRASE
    );

    const sendRes = await this.server.sendTransaction(finalTx);

    if (sendRes.status === 'ERROR') {
      throw new Error(`RPC submission error: ${JSON.stringify(sendRes)}`);
    }

    const txResult = await this.waitForConfirmation(sendRes.hash);

    return { hash: sendRes.hash, txResult };
  }

  static async computePurposeHash(note: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(note.trim() || 'General Organizational Transfer');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  static async createIntent(params: CreateIntentParams): Promise<{ intentId: number; onChainId: number; txHash: string }> {
    const {
      caller,
      recipient,
      cosigner1,
      cosigner2,
      guardian,
      amountStroops,
      purposeNote,
      observationDelaySeconds = 180,
      orgName = 'none',
      senderName = 'none',
      senderRole = 'none',
    } = params;

    const assetAddress = params.asset || STELLAR_CONFIG.NATIVE_TOKEN;

    // Check balance before simulating so user gets a clear message instead of HostError
    await this.verifySufficientBalance(caller, assetAddress, amountStroops);

    const account = await this.server.getAccount(caller);
    const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);
    const purposeHashBytes = await this.computePurposeHash(purposeNote);

    const callerScVal = new Address(caller).toScVal();
    const recipientScVal = new Address(recipient).toScVal();
    const assetScVal = new Address(assetAddress).toScVal();

    const cosignersScVals: xdr.ScVal[] = [];
    if (cosigner1 && cosigner1.trim() !== '') {
      cosignersScVals.push(new Address(cosigner1.trim()).toScVal());
    }
    if (cosigner2 && cosigner2.trim() !== '') {
      cosignersScVals.push(new Address(cosigner2.trim()).toScVal());
    }
    const cosignersVecScVal = xdr.ScVal.scvVec(cosignersScVals);

    const guardianScVals: xdr.ScVal[] = [];
    if (guardian && guardian.trim() !== '') {
      guardianScVals.push(new Address(guardian.trim()).toScVal());
    }
    const guardianVecScVal = xdr.ScVal.scvVec(guardianScVals);

    const amountScVal = xdr.ScVal.scvI64(xdr.Int64.fromString(amountStroops.toString()));
    const purposeScVal = xdr.ScVal.scvBytes(purposeHashBytes);
    const delayScVal = xdr.ScVal.scvU64(xdr.Uint64.fromString(observationDelaySeconds.toString()));

    const callOp = contract.call(
      'create_intent',
      callerScVal,
      recipientScVal,
      cosignersVecScVal,
      guardianVecScVal,
      assetScVal,
      amountScVal,
      purposeScVal,
      delayScVal
    );

    const tx = new TransactionBuilder(account, {
      fee: (parseInt(BASE_FEE, 10) * 10).toString(),
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(180)
      .build();

    const { hash, txResult } = await this.submitTx(tx, caller);

    let rawOnChainId = 0;
    try {
      if (txResult.returnValue) {
        rawOnChainId = Number(scValToNative(txResult.returnValue));
      } else if (txResult.resultMetaXdr) {
        const meta: any = xdr.TransactionMeta.fromXDR(txResult.resultMetaXdr, 'base64');
        const v3 = typeof meta.v3 === 'function' ? meta.v3() : (typeof meta.value === 'function' ? meta.value() : meta);

        if (v3 && typeof v3.sorobanMeta === 'function' && v3.sorobanMeta()) {
          const retVal = v3.sorobanMeta()?.returnValue();
          if (retVal) {
            rawOnChainId = Number(scValToNative(retVal));
          }
        }
      }
    } catch {
      // Fallback
    }

    if (!rawOnChainId || rawOnChainId <= 0) {
      rawOnChainId = await this.getTotalIntents();
    }

    const dbUniqueIntentId = this.encodeDbIntentId(rawOnChainId);
    const descriptionWithMeta = `[DELAY:${observationDelaySeconds}] ${purposeNote.trim()}`;

    const { error: dbError } = await supabase.from('transactions_testnet').insert([
      {
        intent_id: dbUniqueIntentId,
        from_wallet: caller,
        to_wallet: recipient,
        org_name: orgName,
        sender_name: senderName,
        sender_role: senderRole,
        cosigner_1_name: cosigner1 && cosigner1.trim() !== '' ? cosigner1.trim() : 'none',
        cosigner_2_name: cosigner2 && cosigner2.trim() !== '' ? cosigner2.trim() : 'none',
        total_amount: Number((Number(amountStroops) / 10_000_000).toFixed(7)),
        asset_address: assetAddress,
        status: 'observing',
        description: descriptionWithMeta,
        note: purposeNote,
        tx_hash: hash,
      },
    ]);

    if (dbError) {
      console.error('[Supabase Insert Error]:', dbError);
    }

    return { intentId: dbUniqueIntentId, onChainId: rawOnChainId, txHash: hash };
  } 

  static async approveIntent(caller: string, rawIntentId: number, isGuardian = false): Promise<string> {
    const onChainId = this.decodeOnChainId(rawIntentId);
    const account = await this.server.getAccount(caller);
    const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);
    const functionName = isGuardian ? 'approve_guardian' : 'approve_intent';

    const callOp = contract.call(
      functionName,
      new Address(caller).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(onChainId.toString()))
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(180)
      .build();

    const { hash } = await this.submitTx(tx, caller);

    const { data: existing } = await supabase
      .from('transactions_testnet')
      .select('note')
      .eq('intent_id', rawIntentId)
      .maybeSingle();

    const priorNote = existing?.note || '';
    const signedTag = `[SIGNED:${caller}]`;
    const updatedNote = priorNote.includes(signedTag)
      ? priorNote
      : `${priorNote} ${signedTag}`.trim();

    await supabase
      .from('transactions_testnet')
      .update({ 
        status: 'observing',
        note: updatedNote
      })
      .eq('intent_id', rawIntentId);

    return hash;
  }

  static async cancelIntent(caller: string, rawIntentId: number): Promise<string> {
    const onChainId = this.decodeOnChainId(rawIntentId);
    const account = await this.server.getAccount(caller);
    const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);

    const callOp = contract.call(
      'cancel_intent',
      new Address(caller).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(onChainId.toString()))
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(180)
      .build();

    const { hash } = await this.submitTx(tx, caller);

    await supabase
      .from('transactions_testnet')
      .update({ status: 'cancelled' })
      .eq('intent_id', rawIntentId);

    return hash;
  }

  static async executeIntent(caller: string, rawIntentId: number): Promise<string> {
    const onChainId = this.decodeOnChainId(rawIntentId);
    const account = await this.server.getAccount(caller);
    const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);

    const callOp = contract.call(
      'execute_intent',
      new Address(caller).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(onChainId.toString()))
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(180)
      .build();

    const { hash } = await this.submitTx(tx, caller);

    await supabase
      .from('transactions_testnet')
      .update({ status: 'executed', tx_hash: hash })
      .eq('intent_id', rawIntentId);

    return hash;
  }

  static async getTotalIntents(): Promise<number> {
    try {
      const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);
      const botAccount = await this.server.getAccount(botKeypair.publicKey());
      const tx = new TransactionBuilder(botAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_total_intents'))
        .setTimeout(60)
        .build();

      const simRes: any = await this.server.simulateTransaction(tx);
      if (simRes.result?.retval) {
        return Number(scValToNative(simRes.result.retval));
      }
      return 0;
    } catch {
      return 0;
    }
  }

  static async resolveChallenge(caller: string, rawIntentId: number, dismiss: boolean): Promise<string> {
    const onChainId = this.decodeOnChainId(rawIntentId);
    const account = await this.server.getAccount(caller);
    const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);

    const functionName = dismiss ? 'resolve_challenge' : 'cancel_intent';

    const callOp = contract.call(
      functionName,
      new Address(caller).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64.fromString(onChainId.toString()))
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
    })
      .addOperation(callOp)
      .setTimeout(180)
      .build();

    const { hash } = await this.submitTx(tx, caller);
    return hash;
  }

  static async settleWithBot(rawIntentId: number): Promise<{ success: boolean; txHash?: string }> {
    try {
      const onChainId = this.decodeOnChainId(rawIntentId);
      const contract = new Contract(STELLAR_CONFIG.CONTRACT_ID);
      const botAccount = await this.server.getAccount(botKeypair.publicKey());

      const callOp = contract.call(
        'execute_intent',
        new Address(botKeypair.publicKey()).toScVal(),
        xdr.ScVal.scvU64(xdr.Uint64.fromString(onChainId.toString()))
      );

      const tx = new TransactionBuilder(botAccount, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
      })
        .addOperation(callOp)
        .setTimeout(60)
        .build();

      const simRes = await this.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simRes)) {
        throw new Error(`Simulation failed: ${simRes.error}`);
      }

      const assembledTx = rpc.assembleTransaction(tx, simRes).build();
      assembledTx.sign(botKeypair);

      const sendRes = await this.server.sendTransaction(assembledTx);
      if (sendRes.status === 'ERROR') {
        throw new Error(`Bot submission error: ${JSON.stringify(sendRes)}`);
      }

      await this.waitForConfirmation(sendRes.hash);

      await supabase
        .from('transactions_testnet')
        .update({ status: 'executed', tx_hash: sendRes.hash })
        .eq('intent_id', rawIntentId);

      return { success: true, txHash: sendRes.hash };
    } catch (err: any) {
      console.warn(`[Bot Settlement Notice] Intent #${rawIntentId}:`, err.message);
      return { success: false };
    }
  }
}