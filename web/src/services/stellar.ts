import { Horizon, rpc } from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/constants';

export interface AccountBalance {
  asset: string;
  balance: string;
}

export class StellarService {
  private static horizonServer = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
  private static rpcServer = new rpc.Server(STELLAR_CONFIG.RPC_URL);

  /**
   * Retrieves native XLM and trustline balances for a Stellar account.
   */
  static async getAccountBalances(walletAddress: string): Promise<AccountBalance[]> {
    try {
      const account = await this.horizonServer.loadAccount(walletAddress);
      return account.balances.map((b) => {
        if (b.asset_type === 'native') {
          return { asset: 'XLM', balance: b.balance };
        }
        const credit = b as Horizon.HorizonApi.BalanceLineAsset;
        return { asset: credit.asset_code, balance: credit.balance };
      });
    } catch (err) {
      console.warn(`Could not load Horizon balances for ${walletAddress}:`, err);
      return [{ asset: 'XLM', balance: '0.0000000' }];
    }
  }

  /**
   * Fetches the latest confirmed ledger sequence from Soroban RPC.
   */
  static async getLatestLedger(): Promise<number> {
    const res = await this.rpcServer.getLatestLedger();
    return res.sequence;
  }

  /**
   * Checks whether an account exists and is funded on Testnet.
   */
  static async isAccountFunded(walletAddress: string): Promise<boolean> {
    try {
      await this.horizonServer.loadAccount(walletAddress);
      return true;
    } catch {
      return false;
    }
  }
}