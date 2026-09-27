import { Horizon, TransactionBuilder, Networks, Asset, Operation, Memo } from '@stellar/stellar-sdk';
import * as Freighter from '@stellar/freighter-api';

export class WalletService {
  /**
   * Check whether the Freighter extension is installed in the browser.
   */
  static async hasFreighter(): Promise<boolean> {
    try {
      const res: any = typeof Freighter.isConnected === 'function' ? await Freighter.isConnected() : false;
      if (typeof res === 'boolean') {
        return res;
      }
      return Boolean(res?.isConnected ?? res);
    } catch {
      return false;
    }
  }

  /**
   * Silently retrieve active public key if already authorized.
   */
  static async getActiveAddress(): Promise<string | null> {
    try {
      // 1. Modern API method
      if (typeof (Freighter as any).getAddress === 'function') {
        const addrRes: any = await (Freighter as any).getAddress();
        if (typeof addrRes === 'string' && addrRes.startsWith('G')) {
          return addrRes.trim();
        }
        if (addrRes?.address && typeof addrRes.address === 'string' && addrRes.address.startsWith('G')) {
          return addrRes.address.trim();
        }
      }

      // 2. Legacy API method fallback
      if (typeof (Freighter as any).getPublicKey === 'function') {
        const keyRes: any = await (Freighter as any).getPublicKey();
        if (typeof keyRes === 'string' && keyRes.startsWith('G')) {
          return keyRes.trim();
        }
        if (keyRes?.address && typeof keyRes.address === 'string' && keyRes.address.startsWith('G')) {
          return keyRes.address.trim();
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Explicitly prompts user authorization and returns the active public key.
   */
  static async requestConnection(): Promise<string> {
    const installed = await this.hasFreighter();
    if (!installed) {
      throw new Error('Freighter wallet extension is not installed. Please install it from freighter.app');
    }

    if (typeof Freighter.requestAccess === 'function') {
      const accessRes: any = await Freighter.requestAccess();
      if (accessRes?.error) {
        throw new Error(String(accessRes.error));
      }

      // Modern API returns the address directly from requestAccess
      if (typeof accessRes === 'string' && accessRes.startsWith('G')) {
        return accessRes.trim();
      }
      if (accessRes?.address && typeof accessRes.address === 'string' && accessRes.address.startsWith('G')) {
        return accessRes.address.trim();
      }
    }

    // Query active address if not directly returned by requestAccess
    const active = await this.getActiveAddress();
    if (active && active.startsWith('G')) {
      return active;
    }

    throw new Error('Failed to retrieve active public key from Freighter. Ensure your wallet is unlocked.');
  }

  /**
   * Horizon direct payment disbursement helper
   */
  static async signAndSubmitDirectPayment(
    senderPublicKey: string,
    destinationPublicKey: string,
    amountXlm: string,
    memoText: string
  ): Promise<string> {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(senderPublicKey);
    
    let builder = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }).addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amountXlm,
      })
    );

    if (memoText) {
      builder = builder.addMemo(Memo.text(memoText));
    }

    const transaction = builder.setTimeout(30).build();

    const signedResult: any = await Freighter.signTransaction(transaction.toXDR(), {
      networkPassphrase: Networks.TESTNET,
      address: senderPublicKey,
    });

    if (signedResult?.error) {
      throw new Error(String(signedResult.error));
    }

    const rawSignedXdr = typeof signedResult === 'string' 
      ? signedResult 
      : signedResult?.signedTxXdr || signedResult?.xdr;

    if (!rawSignedXdr) {
      throw new Error('Freighter did not return a signed transaction envelope.');
    }

    const signedTx = TransactionBuilder.fromXDR(rawSignedXdr, Networks.TESTNET);
    const response = await server.submitTransaction(signedTx);
    return response.hash;
  }
}