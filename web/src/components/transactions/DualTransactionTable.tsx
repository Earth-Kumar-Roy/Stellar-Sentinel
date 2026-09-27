import React, { useState } from 'react';
import { ExternalLink, Check, ShieldAlert, Play, Clock, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ContractClient } from '../../services/contractClient';
import { resolveTokenByAddress } from '../../config/constants';
import type { PaymentIntentRecord } from '../../types';

interface DualTransactionTableProps {
  intents: PaymentIntentRecord[];
  currentWallet: string;
  userRole?: string;
  onIntentUpdated: () => void;
}

export const DualTransactionTable: React.FC<DualTransactionTableProps> = ({
  intents,
  currentWallet,
  userRole,
  onIntentUpdated,
}) => {
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);

  const formatAddress = (addr?: string) => {
    if (!addr || addr === 'none') return 'None';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const getDelayLabel = (rawText?: string) => {
    if (!rawText) return '3M OBS TIMELOCK';
    const match = rawText.match(/\[DELAY:(\d+)\]/);
    if (match) {
      const minutes = Math.round(parseInt(match[1], 10) / 60);
      return `${minutes}M OBS TIMELOCK`;
    }
    return '3M OBS TIMELOCK';
  };

  const handleApprove = async (intentId: number) => {
    try {
      setApprovingId(intentId);
      const isGuardianRole = userRole?.toLowerCase() === 'owner' || userRole?.toLowerCase() === 'admin';
      await ContractClient.approveIntent(currentWallet, intentId, isGuardianRole);
      alert(`Intent #${intentId} successfully approved on-chain.`);
      onIntentUpdated();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Approval failed';
      alert(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const handleExecute = async (intentId: number) => {
    try {
      setExecutingId(intentId);
      await ContractClient.executeIntent(currentWallet, intentId);
      alert(`Intent #${intentId} settled and disbursed successfully on-chain.`);
      onIntentUpdated();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Execution failed';
      alert(msg);
    } finally {
      setExecutingId(null);
    }
  };

  if (intents.length === 0) {
    return (
      <div className="bg-[#121620] border border-[#232938] p-10 card-polygon text-center font-mono">
        <p className="text-xs text-stellar-muted uppercase tracking-wider">
          No Intent Records Recorded
        </p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Initiate a disbursement above to generate on-chain intents.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#232938] bg-[#0B0D13] card-polygon">
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-[#232938] bg-[#121620] text-stellar-muted uppercase text-[10px] tracking-wider">
          <tr>
            <th className="py-3 px-4">Intent ID</th>
            <th className="py-3 px-4">Sender</th>
            <th className="py-3 px-4">Recipient</th>
            <th className="py-3 px-4">Amount & Currency</th>
            <th className="py-3 px-4">Status / Notes</th>
            <th className="py-3 px-4 text-right">Actions / Explorer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232938]">
          {intents.map((item: any) => {
            const statusStr = (item.status || '').toLowerCase();
            const isQuarantined = statusStr === 'quarantined';
            const isExecutable = statusStr === 'executable';
            const isObserving = statusStr === 'observing' || statusStr === 'pending' || statusStr === 'awaiting_approval';
            
            const recipientWallet = item.to_wallet || item.recipient || 'none';
            const senderWallet = item.from_wallet || item.sender || 'none';

            const cosigner1 = item.cosigner_1_name || 'none';
            const cosigner2 = item.cosigner_2_name || 'none';
            const isAssignedCosigner = 
              cosigner1.trim().toUpperCase() === currentWallet.trim().toUpperCase() || 
              cosigner2.trim().toUpperCase() === currentWallet.trim().toUpperCase();

            const fullMemo = `${item.note || ''} ${item.description || ''}`;
            const isSignedByCurrent = fullMemo.toUpperCase().includes(`[SIGNED:${currentWallet.trim().toUpperCase()}]`);
            const canApprove = isObserving && isAssignedCosigner && !isSignedByCurrent;
            const delayLabel = getDelayLabel(fullMemo);

            const token = resolveTokenByAddress(item.asset_address);
            const amountFormatted = parseFloat(item.total_amount || 0).toFixed(2);

            return (
              <tr 
                key={item.id || item.intent_id} 
                className={`hover:bg-[#121620]/80 transition-colors group ${
                  isQuarantined ? 'bg-red-950/10' : ''
                }`}
              >
                <td className="py-3 px-4 text-stellar-yellow font-bold group-hover:underline">
                  #{item.intent_id}
                </td>
                <td className="py-3 px-4 text-zinc-300 font-mono" title={senderWallet}>
                  {formatAddress(senderWallet)}
                </td>
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-mono">{formatAddress(recipientWallet)}</span>
                    {recipientWallet !== 'none' && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${recipientWallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stellar-muted hover:text-stellar-yellow"
                        title={`View on Stellar Expert: ${recipientWallet}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-white font-bold">
                  <span>{amountFormatted}</span>{' '}
                  <span className="text-[10px] text-stellar-yellow ml-0.5">{token.symbol}</span>
                </td>
                <td className="py-3 px-4 max-w-sm">
                  <div className="space-y-1">
                    <StatusBadge status={item.status} />
                    <div className="text-[10px] text-stellar-muted truncate" title={fullMemo}>
                      {item.note || item.description || 'Routine transfer'}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  {canApprove && (
                    <button
                      type="button"
                      disabled={approvingId === item.intent_id}
                      onClick={() => handleApprove(item.intent_id)}
                      className="px-3 py-1 bg-stellar-yellow text-black font-bold text-[10px] btn-polygon hover:bg-stellar-gold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {approvingId === item.intent_id ? (
                        'SIGNING...'
                      ) : (
                        <>
                          <Check className="w-3 h-3" /> APPROVE
                        </>
                      )}
                    </button>
                  )}

                  {isSignedByCurrent && (
                    <span className="text-[10px] text-emerald-400 font-bold inline-flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40 rounded">
                      <CheckCircle2 className="w-3 h-3" /> SIGNED
                    </span>
                  )}

                  {isExecutable && (
                    <button
                      type="button"
                      disabled={executingId === item.intent_id}
                      onClick={() => handleExecute(item.intent_id)}
                      className="px-3 py-1 bg-emerald-500 text-black font-bold text-[10px] btn-polygon hover:bg-emerald-400 inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {executingId === item.intent_id ? (
                        'EXECUTING...'
                      ) : (
                        <>
                          <Play className="w-3 h-3" /> SETTLE
                        </>
                      )}
                    </button>
                  )}

                  {isObserving && !canApprove && !isSignedByCurrent && (
                    <span className="text-[10px] text-stellar-muted font-bold inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stellar-yellow" /> {delayLabel}
                    </span>
                  )}

                  {isQuarantined && !canApprove && (
                    <span className="text-[10px] text-red-400 font-bold inline-flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> QUARANTINED
                    </span>
                  )}

                  {item.tx_hash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${item.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stellar-muted hover:text-white inline-flex items-center gap-1 text-[10px] ml-1"
                      title="View Tx Hash"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DualTransactionTable;