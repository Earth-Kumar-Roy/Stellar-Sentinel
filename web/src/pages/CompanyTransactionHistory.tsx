import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  ExternalLink, 
  RefreshCcw, 
  ShieldCheck, 
  Coins, 
  X, 
  CheckCircle2, 
  Key,
  FileText
} from 'lucide-react';
import { StatusBadge } from '../components/transactions/StatusBadge';
import { resolveTokenByAddress } from '../config/constants';
import { supabase } from '../config/supabase';
import { ContractClient } from '../services/contractClient';
import type { OrgMember, PaymentIntentRecord } from '../types';

interface CompanyTransactionHistoryProps {
  currentMember: OrgMember;
}

export const CompanyTransactionHistory: React.FC<CompanyTransactionHistoryProps> = ({ currentMember }) => {
  const [transactions, setTransactions] = useState<PaymentIntentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orgWallets, setOrgWallets] = useState<string[]>([]);
  const [selectedTx, setSelectedTx] = useState<PaymentIntentRecord | null>(null);

  const fetchCompanyHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('wallet_address, full_name, role')
        .ilike('org_name', currentMember.org_name.trim());

      if (membersError) throw membersError;

      const wallets = (membersData || []).map((m) => m.wallet_address);
      setOrgWallets(wallets);

      if (wallets.length === 0) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      const walletFilterString = wallets.map((w) => `from_wallet.eq.${w},to_wallet.eq.${w}`).join(',');
      
      const { data: txData, error: txError } = await supabase
        .from('transactions_testnet')
        .select('*')
        .or(`org_name.ilike.${currentMember.org_name.trim()},${walletFilterString}`)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      setTransactions((txData as PaymentIntentRecord[]) || []);
    } catch (err) {
      console.error('Failed to load company transaction history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentMember.org_name]);

  useEffect(() => {
    fetchCompanyHistory();
  }, [fetchCompanyHistory]);

  const formatAddress = (addr?: string) => {
    if (!addr || addr === 'none') return 'None';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const totalVolume = transactions
    .filter((tx) => tx.status.toLowerCase() === 'executed')
    .reduce((sum, tx) => sum + (parseFloat(tx.total_amount) || 0), 0);

  return (
    <div className="space-y-6 font-mono text-xs max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <History className="w-5 h-5 text-stellar-yellow" />
            {currentMember.org_name.toUpperCase()} — AUDIT & SETTLEMENT LEDGER
          </h1>
          <p className="text-stellar-muted text-[11px] mt-1">
            Historical company disbursements, multi-sig proofs, and ML Sentinel diagnostics. Click any row for full audit inspection.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCompanyHistory}
          className="px-4 py-2 border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white bg-[#0B0D13] btn-polygon flex items-center gap-2 cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> REFRESH LEDGER
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-1">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase">
            <span>Total Settled Outflow</span>
            <Coins className="w-3.5 h-3.5 text-stellar-yellow" />
          </div>
          <div className="text-xl font-bold text-white">
            {totalVolume.toFixed(2)} <span className="text-xs text-stellar-yellow">Volume</span>
          </div>
          <div className="text-[10px] text-stellar-muted">Executed corporate transfers across assets</div>
        </div>

        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-1">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase">
            <span>Linked Entity Wallets</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{orgWallets.length} Keys</div>
          <div className="text-[10px] text-stellar-muted">Treasurer, Guardian & Signers</div>
        </div>

        <div className="bg-[#121620] border border-[#232938] p-4 card-polygon space-y-1">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase">
            <span>Total Intent Records</span>
            <History className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{transactions.length} Entries</div>
          <div className="text-[10px] text-stellar-muted">Observed, executed & refunded flows</div>
        </div>
      </div>

      {/* Ledger Feed */}
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
        <div className="flex items-center justify-between border-b border-[#232938] pb-2">
          <h2 className="text-white font-bold uppercase tracking-wider text-xs">
            Company Settlement Logs
          </h2>
          <span className="text-[10px] text-stellar-muted">Click row for full intent audit</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-stellar-yellow">
            <span className="animate-spin inline-block text-base mr-2">⟳</span>
            Querying company-wide settlement history from Supabase...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-stellar-muted">
            No transaction intents found for this company profile yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232938] text-stellar-muted text-[10px] uppercase">
                  <th className="py-3 px-3">Intent ID</th>
                  <th className="py-3 px-3">Recipient Counterparty</th>
                  <th className="py-3 px-3">Amount & Token</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 min-w-[280px]">Lifecycle / Notes</th>
                  <th className="py-3 px-3 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232938] text-[11px]">
                {transactions.map((tx) => {
                  const token = resolveTokenByAddress((tx as any).asset_address);
                  const recipient = tx.to_wallet || (tx as any).recipient || 'none';
                  const onChainDisplayId = ContractClient.decodeOnChainId(tx.intent_id);

                  return (
                    <tr 
                      key={tx.id || tx.intent_id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-[#0B0D13] transition-colors align-top group cursor-pointer"
                    >
                      <td className="py-3 px-3 font-bold text-stellar-yellow group-hover:underline">
                        <div>#{tx.intent_id}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">On-Chain #{onChainDisplayId}</div>
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-mono">{formatAddress(recipient)}</span>
                          {recipient !== 'none' && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/account/${recipient}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stellar-muted hover:text-stellar-yellow"
                              title={`Recipient Account: ${recipient}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {tx.receiver_email && <div className="text-[10px] text-stellar-muted">{tx.receiver_email}</div>}
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        <span>{parseFloat(tx.total_amount).toFixed(2)}</span>{' '}
                        <span className="text-stellar-yellow text-[10px] ml-0.5">{token.symbol}</span>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={tx.status} />
                      </td>

                      <td className="py-3 px-3 text-stellar-muted whitespace-normal break-words max-w-md">
                        <div className="text-zinc-300">
                          {tx.timestamp_ist || new Date(tx.created_at).toLocaleString()}
                        </div>
                        {tx.note && (
                          <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed line-clamp-2" title={tx.note}>
                            {tx.note}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {tx.tx_hash ? (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-stellar-yellow hover:underline inline-flex items-center gap-1 font-mono text-[10px]"
                          >
                            <span>Tx Hash</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">No Hash Recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Intent Audit Modal */}
      {selectedTx && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="bg-[#121620] border border-[#232938] max-w-2xl w-full p-6 card-polygon space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#232938] pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-white">INTENT AUDIT #{selectedTx.intent_id}</span>
                <span className="text-[10px] text-zinc-500">(On-Chain Index #{ContractClient.decodeOnChainId(selectedTx.intent_id)})</span>
                <StatusBadge status={selectedTx.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-stellar-muted hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0B0D13] p-3 border border-[#232938]">
              <div>
                <span className="text-stellar-muted text-[10px] block uppercase">Disbursed Amount</span>
                <span className="text-white font-bold text-base">
                  {parseFloat(selectedTx.total_amount).toFixed(2)}{' '}
                  <span className="text-stellar-yellow text-xs">
                    {resolveTokenByAddress((selectedTx as any).asset_address).symbol}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-stellar-muted text-[10px] block uppercase">Created At</span>
                <span className="text-zinc-300">
                  {selectedTx.timestamp_ist || new Date(selectedTx.created_at).toLocaleString()}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-stellar-muted text-[10px] block uppercase">Recipient Counterparty</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-stellar-yellow font-mono break-all">{selectedTx.to_wallet || (selectedTx as any).recipient}</span>
                  {(selectedTx.to_wallet || (selectedTx as any).recipient) !== 'none' && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${selectedTx.to_wallet || (selectedTx as any).recipient}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stellar-muted hover:text-white shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Co-Signer / Multi-Sig Consensus Info */}
            <div className="bg-[#0B0D13] p-3 border border-[#232938] space-y-2">
              <div className="text-stellar-muted text-[10px] uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Multi-Signature Roster & Approvals</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-[#121620] p-2 border border-[#1b212f]">
                  <span className="text-stellar-muted block text-[10px]">Co-Signer 1:</span>
                  <span className="text-white font-mono break-all">{formatAddress(selectedTx.cosigner_1_name)}</span>
                </div>
                <div className="bg-[#121620] p-2 border border-[#1b212f]">
                  <span className="text-stellar-muted block text-[10px]">Co-Signer 2:</span>
                  <span className="text-white font-mono break-all">{formatAddress(selectedTx.cosigner_2_name)}</span>
                </div>
              </div>
            </div>

            {/* Lifecycle / ML Sentinel Diagnostics Note */}
            <div className="bg-[#0B0D13] p-3 border border-[#232938] space-y-1.5">
              <div className="text-stellar-muted text-[10px] uppercase flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Lifecycle Memo & ML Diagnostics</span>
              </div>
              <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed bg-[#121620] p-3 border border-[#1b212f] text-[11px]">
                {selectedTx.note || selectedTx.description || 'Routine enterprise disbursement with standard policy parameters.'}
              </div>
            </div>

            {/* On-Chain Explorer Proof */}
            <div className="flex items-center justify-between pt-2 border-t border-[#232938]">
              <div className="text-[10px] text-stellar-muted">
                {selectedTx.tx_hash ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled on Stellar Testnet Ledger
                  </span>
                ) : (
                  <span className="text-zinc-500">Autonomous Settlement In Progress</span>
                )}
              </div>

              {selectedTx.tx_hash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold flex items-center gap-1.5"
                >
                  <span>VIEW ON STELLAR EXPERT</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTransactionHistory;