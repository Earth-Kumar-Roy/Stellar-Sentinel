import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  ExternalLink,
} from 'lucide-react';
import { Horizon } from '@stellar/stellar-sdk';
import { supabase } from '../config/supabase';
import { resolveTokenByAddress } from '../config/constants';
import { StatusBadge } from '../components/transactions/StatusBadge';
import { ContractClient } from '../services/contractClient';
import type { PaymentIntentRecord } from '../types';

interface WalletActivityFeedProps {
  walletAddress: string;
}

interface ActivityItem {
  id: string;
  source: 'horizon' | 'treasury_contract';
  type: string;
  created_at: string;
  timestamp_epoch: number;
  amount: string;
  asset_symbol: string;
  isIncoming: boolean;
  counterparty: string;
  memo?: string;
  status?: PaymentIntentRecord['status'] | string;
  transaction_hash?: string;
  intent_id?: string;
}

interface AssetFlow {
  in: number;
  out: number;
}

export const WalletActivityFeed: React.FC<WalletActivityFeedProps> = ({ walletAddress }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);
  const [assetTotals, setAssetTotals] = useState<Record<string, AssetFlow>>({
    XLM: { in: 0, out: 0 },
    USDC: { in: 0, out: 0 },
    EURC: { in: 0, out: 0 },
  });

  const isFirstLoad = useRef(true);

  const parseExactEpoch = (created_at?: string, rawIntentId?: string | number): { iso: string; epoch: number } => {
    const intentBigInt = rawIntentId ? BigInt(rawIntentId.toString()) : 0n;

    if (intentBigInt > 100000000n) {
      try {
        const decodedSec = ContractClient.decodeTimestamp(Number(intentBigInt));
        if (decodedSec && decodedSec > 1600000000) {
          const d = new Date(decodedSec * 1000);
          return { iso: d.toISOString(), epoch: d.getTime() };
        }
      } catch {
        // Fallback
      }
    }

    if (created_at) {
      const parsed = Date.parse(created_at);
      if (!isNaN(parsed) && parsed > 0) {
        return { iso: new Date(parsed).toISOString(), epoch: parsed };
      }
    }

    const legacyBase = 1726653600000;
    const offset = Number(intentBigInt) * 1000;
    const computedDate = new Date(legacyBase + offset);
    return { iso: computedDate.toISOString(), epoch: computedDate.getTime() };
  };

  const fetchUnifiedWalletHistory = useCallback(async (isSilentRefresh = false) => {
    if (!walletAddress) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    if (!isSilentRefresh) {
      setIsLoading(true);
    } else {
      setIsAutoRefreshing(true);
    }

    try {
      const currentAddr = walletAddress.trim().toUpperCase();
      const server = new Horizon.Server('https://horizon-testnet.stellar.org');

      // 1. Fetch Supabase Treasury / Soroban Contract Records
      let dbActivities: ActivityItem[] = [];
      const knownTxHashes = new Set<string>();

      try {
        const { data: dbTxData, error: dbError } = await supabase
          .from('transactions_testnet')
          .select('*')
          .or(`from_wallet.ilike.${currentAddr},to_wallet.ilike.${currentAddr}`)
          .order('created_at', { ascending: false })
          .limit(250);

        if (!dbError && dbTxData) {
          dbTxData.forEach((item: any) => {
            const token = resolveTokenByAddress(item.asset_address);
            const amountNum = parseFloat(item.total_amount || 0);
            const statusStr = (item.status || '').toLowerCase();
            const fromAddr = (item.from_wallet || '').trim().toUpperCase();
            const toAddr = (item.to_wallet || '').trim().toUpperCase();
            const isFromCurrentWallet = fromAddr === currentAddr;
            const isCancelledRefunded = statusStr === 'cancelled';
            const rawIntent = item.intent_id !== undefined && item.intent_id !== null ? String(item.intent_id) : undefined;
            const timeMeta = parseExactEpoch(item.created_at, rawIntent);

            if (item.tx_hash) {
              knownTxHashes.add(item.tx_hash.toLowerCase());
            }

            if (isFromCurrentWallet) {
              // Outgoing payment initiated by wallet
              dbActivities.push({
                id: `db-out-${rawIntent || item.id}`,
                source: 'treasury_contract',
                type: `Treasury Intent #${rawIntent || item.id}`,
                created_at: timeMeta.iso,
                timestamp_epoch: timeMeta.epoch,
                amount: amountNum.toFixed(2),
                asset_symbol: token.symbol,
                isIncoming: false,
                counterparty: item.to_wallet || 'Treasury Escrow',
                memo: item.note || item.description || '',
                status: item.status,
                transaction_hash: item.tx_hash,
                intent_id: rawIntent,
              });
            } else if (toAddr === currentAddr) {
              // Incoming payment received by wallet
              dbActivities.push({
                id: `db-in-${rawIntent || item.id}`,
                source: 'treasury_contract',
                type: `Inbound Intent #${rawIntent || item.id}`,
                created_at: timeMeta.iso,
                timestamp_epoch: timeMeta.epoch,
                amount: amountNum.toFixed(2),
                asset_symbol: token.symbol,
                isIncoming: true,
                counterparty: item.from_wallet || 'Settlement Contract',
                memo: item.note || item.description || '',
                status: item.status,
                transaction_hash: item.tx_hash,
                intent_id: rawIntent,
              });
            }

            // If cancelled, credit refund leg to sender
            if (isFromCurrentWallet && isCancelledRefunded) {
              dbActivities.push({
                id: `db-refund-${rawIntent || item.id}`,
                source: 'treasury_contract',
                type: `Refund Leg #${rawIntent || item.id}`,
                created_at: timeMeta.iso,
                timestamp_epoch: timeMeta.epoch + 10,
                amount: amountNum.toFixed(2),
                asset_symbol: token.symbol,
                isIncoming: true,
                counterparty: 'Treasury Settlement Contract',
                memo: item.note ? `Refunded: ${item.note}` : 'Escrow auto-refunded to sender.',
                status: 'cancelled',
                transaction_hash: item.tx_hash,
                intent_id: rawIntent,
              });
            }
          });
        }
      } catch (dbErr) {
        console.warn('Supabase activity helper skipped:', dbErr);
      }

      // 2. Query Horizon Payments directly for true on-chain ledger transfers
      let horizonActivities: ActivityItem[] = [];
      try {
        const paymentRecords = await server.payments()
          .forAccount(walletAddress.trim())
          .order('desc')
          .limit(200)
          .call();

        for (const op of (paymentRecords.records as any[])) {
          const txHashLower = (op.transaction_hash || '').toLowerCase();
          
          // Prevent double-counting transfers recorded by contract intents
          if (txHashLower && knownTxHashes.has(txHashLower)) {
            continue;
          }

          let amount = '0.00';
          let asset_symbol = 'XLM';
          let isIncoming = false;
          let counterparty = '';
          let isValid = false;

          const toAccount = (op.to || op.account || op.into || '').toUpperCase();
          const fromAccount = (op.from || op.funder || op.source_account || '').toUpperCase();

          if (op.type === 'payment') {
            isValid = true;
            amount = parseFloat(op.amount || 0).toFixed(2);
            asset_symbol = op.asset_type === 'native' ? 'XLM' : (op.asset_code || 'CUSTOM');
            
            if (toAccount === currentAddr) {
              isIncoming = true;
              counterparty = op.from || op.source_account || 'Network';
            } else {
              isIncoming = false;
              counterparty = op.to || 'Counterparty';
            }
          } else if (op.type === 'create_account') {
            isValid = true;
            amount = parseFloat(op.starting_balance || 0).toFixed(2);
            asset_symbol = 'XLM';

            if (toAccount === currentAddr) {
              isIncoming = true;
              counterparty = op.funder || op.source_account || 'Genesis / Network';
            } else {
              isIncoming = false;
              counterparty = op.account || 'New Account';
            }
          } else if (op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
            isValid = true;
            if (toAccount === currentAddr) {
              isIncoming = true;
              amount = parseFloat(op.amount || 0).toFixed(2);
              asset_symbol = op.asset_type === 'native' ? 'XLM' : (op.asset_code || 'CUSTOM');
              counterparty = op.from || op.source_account || 'Network';
            } else {
              isIncoming = false;
              amount = parseFloat(op.source_amount || op.amount || 0).toFixed(2);
              asset_symbol = op.source_asset_type === 'native' ? 'XLM' : (op.source_asset_code || 'CUSTOM');
              counterparty = op.to || 'Counterparty';
            }
          } else if (op.type === 'account_merge') {
            isValid = true;
            isIncoming = toAccount === currentAddr;
            counterparty = isIncoming ? fromAccount : toAccount;
            amount = '0.00';
            asset_symbol = 'XLM';
          }

          if (isValid) {
            const hEpoch = Date.parse(op.created_at) || Date.now();
            horizonActivities.push({
              id: `hz-${op.id}`,
              source: 'horizon',
              type: isIncoming ? 'Payment Received' : 'Payment Sent',
              created_at: op.created_at,
              timestamp_epoch: hEpoch,
              amount,
              asset_symbol: asset_symbol.toUpperCase(),
              isIncoming,
              counterparty: counterparty || (isIncoming ? 'Network' : 'Destination'),
              transaction_hash: op.transaction_hash,
            });
          }
        }
      } catch (hErr) {
        console.warn('Horizon lookup bypassed:', hErr);
      }

      // 3. Merge and Deterministically Sort (Newest first)
      const combined = [...dbActivities, ...horizonActivities].sort((a, b) => {
        if (b.timestamp_epoch !== a.timestamp_epoch) {
          return b.timestamp_epoch - a.timestamp_epoch;
        }
        return b.id.localeCompare(a.id);
      });

      // 4. Calculate Net Inflows & Outflows
      const tallies: Record<string, AssetFlow> = {
        XLM: { in: 0, out: 0 },
        USDC: { in: 0, out: 0 },
        EURC: { in: 0, out: 0 },
      };

      combined.forEach((item) => {
        const symbol = (item.asset_symbol || 'XLM').toUpperCase();
        const val = parseFloat(item.amount) || 0;
        if (!tallies[symbol]) {
          tallies[symbol] = { in: 0, out: 0 };
        }
        if (item.isIncoming) {
          tallies[symbol].in += val;
        } else {
          tallies[symbol].out += val;
        }
      });

      setActivities(combined);
      setAssetTotals(tallies);
    } catch (err) {
      console.error('Failed to load wallet activity feed:', err);
    } finally {
      setIsLoading(false);
      setIsAutoRefreshing(false);
    }
  }, [walletAddress]);

  // Initial load
  useEffect(() => {
    isFirstLoad.current = true;
    fetchUnifiedWalletHistory(false);
  }, [fetchUnifiedWalletHistory]);

  // Automatic 10-second polling interval
  useEffect(() => {
    if (!walletAddress) return;

    const intervalId = setInterval(() => {
      fetchUnifiedWalletHistory(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchUnifiedWalletHistory, walletAddress]);

  const renderAddressWithLink = (addr?: string) => {
    if (!addr || addr === 'none') return <span className="text-zinc-500">None</span>;
    
    const isStellarKey = addr.startsWith('G') && addr.length === 56;
    
    if (isStellarKey) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-stellar-yellow">
          <span>{addr.slice(0, 8)}...{addr.slice(-8)}</span>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${addr}`}
            target="_blank"
            rel="noreferrer"
            className="text-stellar-muted hover:text-white"
            title={`View full account on Stellar Expert: ${addr}`}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </span>
      );
    }

    return <span className="text-stellar-yellow font-mono">{addr}</span>;
  };

  return (
    <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <History className="w-5 h-5 text-stellar-yellow" />
              WALLET COMPLETE ACTIVITY FEED (+ / -)
            </h1>
            <span className="text-[10px] px-2 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-950/40 rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Auto-sync: 10s
            </span>
          </div>
          <div className="text-stellar-muted text-[11px] mt-1 flex items-center gap-2 flex-wrap">
            <span>Complete inbound and outbound ledger for connected key</span>
            {renderAddressWithLink(walletAddress)}
            <span>covering XLM, USDC & EURC.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-2">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase font-bold">
            <span>Stellar Lumens (XLM)</span>
            <span className="text-stellar-yellow">NATIVE</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-emerald-400 font-bold">+{assetTotals.XLM?.in.toFixed(2) || '0.00'} IN</span>
            <span className="text-red-400 font-bold">-{assetTotals.XLM?.out.toFixed(2) || '0.00'} OUT</span>
          </div>
        </div>

        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-2">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase font-bold">
            <span>USD Coin (USDC)</span>
            <span className="text-emerald-400">STABLE</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-emerald-400 font-bold">+{assetTotals.USDC?.in.toFixed(2) || '0.00'} IN</span>
            <span className="text-red-400 font-bold">-{assetTotals.USDC?.out.toFixed(2) || '0.00'} OUT</span>
          </div>
        </div>

        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-2">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase font-bold">
            <span>Euro Coin (EURC)</span>
            <span className="text-blue-400">STABLE</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-emerald-400 font-bold">+{assetTotals.EURC?.in.toFixed(2) || '0.00'} IN</span>
            <span className="text-red-400 font-bold">-{assetTotals.EURC?.out.toFixed(2) || '0.00'} OUT</span>
          </div>
        </div>
      </div>

      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
        <h2 className="text-white font-bold uppercase tracking-wider text-xs border-b border-[#232938] pb-2 flex items-center justify-between">
          <span>Unified Transaction Stream</span>
          <div className="flex items-center gap-2">
            {isAutoRefreshing && (
              <span className="text-[10px] text-stellar-yellow animate-pulse">Syncing...</span>
            )}
            <span className="text-stellar-muted font-mono text-[10px]">{activities.length} Recorded</span>
          </div>
        </h2>

        {isLoading ? (
          <div className="p-12 text-center text-stellar-yellow">
            <span className="animate-spin inline-block text-base mr-2">⟳</span>
            Querying all network transfers and ledger history...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-stellar-muted">
            No transactions found for this connected wallet address.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => {
              const isRefundLeg = item.type.includes('Refund Leg');

              return (
                <div
                  key={item.id}
                  className={`p-4 border card-polygon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    item.isIncoming 
                      ? 'bg-emerald-950/10 border-emerald-500/30' 
                      : 'bg-[#0B0D13] border-[#232938]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 flex items-center justify-center shrink-0 border btn-polygon ${
                      item.isIncoming 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500 text-red-400'
                    }`}>
                      {item.isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold uppercase text-xs">
                          {item.type}
                        </span>

                        {item.status && <StatusBadge status={item.status} />}

                        <span className={`text-[9px] px-1.5 py-0.2 font-bold rounded ${
                          item.isIncoming ? 'text-emerald-400 bg-emerald-950/50' : 'text-zinc-400 bg-zinc-800/60'
                        }`}>
                          {item.isIncoming ? 'INCOMING (+)' : 'OUTGOING (-)'}
                        </span>

                        {isRefundLeg && (
                          <span className="text-[9px] text-stellar-yellow bg-stellar-yellow/10 border border-stellar-yellow/30 px-1 rounded font-bold">
                            ESCROW REFUND
                          </span>
                        )}
                      </div>

                      <div className="text-stellar-muted text-[11px] flex items-center gap-1.5 flex-wrap">
                        <span>{item.isIncoming ? 'Received From:' : 'Disbursed To:'}</span>
                        {renderAddressWithLink(item.counterparty)}
                      </div>

                      {item.memo && (
                        <div className="text-[10px] text-zinc-400 italic max-w-lg truncate" title={item.memo}>
                          "{item.memo}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2">
                    <div className={`text-base font-bold font-mono ${item.isIncoming ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.isIncoming ? '+' : '-'}{item.amount} <span className="text-xs text-stellar-yellow">{item.asset_symbol}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stellar-muted">
                        {new Date(item.created_at).toLocaleString()}
                      </span>

                      {item.transaction_hash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${item.transaction_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stellar-yellow hover:underline inline-flex items-center gap-1 font-mono text-[10px]"
                        >
                          <span>Tx</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletActivityFeed;