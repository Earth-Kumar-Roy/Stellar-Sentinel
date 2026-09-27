import React from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Clock, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { resolveTokenByAddress } from '../../config/constants';
import type { PaymentIntentRecord } from '../../types';

export interface IntentDetailModalProps {
  intent: PaymentIntentRecord | null;
  onClose: () => void;
}

export const IntentDetailModal: React.FC<IntentDetailModalProps> = ({ intent, onClose }) => {
  if (!intent) return null;

  const token = resolveTokenByAddress((intent as any).asset_address);
  const statusStr = (intent.status || '').toLowerCase();
  const isQuarantined = statusStr === 'quarantined';
  const isCancelled = statusStr === 'cancelled';
  const isExecuted = statusStr === 'executed';

  const formatFullAddress = (addr?: string) => {
    if (!addr || addr === 'none') return 'None Assigned';
    return addr;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
      <div className="bg-[#0e121a] border border-[#232938] w-full max-w-2xl max-h-[90vh] flex flex-col card-polygon shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232938] px-6 py-4 bg-[#121620]">
          <div className="flex items-center gap-2">
            <span className="text-stellar-yellow font-bold text-base">
              INTENT #{intent.intent_id}
            </span>
            <StatusBadge status={intent.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stellar-muted hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isCancelled && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Intent Cancelled & Escrow Refunded</div>
                <div className="text-[10px] text-red-400 mt-0.5">
                  The timelock matured without required co-signer quorum approval (or was cancelled)[cite: 7]. Funds auto-refunded to sender[cite: 7].
                </div>
              </div>
            </div>
          )}

          {isExecuted && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Settled & Disbursed</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  Observation delay satisfied and quorum authorizations confirmed on-chain[cite: 7]. Capital transferred to recipient[cite: 7].
                </div>
              </div>
            </div>
          )}

          {isQuarantined && (
            <div className="p-3 bg-red-950/60 border border-red-600 rounded text-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <div className="font-bold uppercase tracking-wider text-[11px]">Quarantined by ML Sentinel</div>
                <div className="text-[10px] text-red-300 mt-0.5">
                  Autonomous anomaly challenge submitted on-chain[cite: 7, 28]. Settlement paused pending guardian review[cite: 7, 28].
                </div>
              </div>
            </div>
          )}

          {/* Metric Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded">
              <div className="text-stellar-muted text-[10px] uppercase">Amount & Asset</div>
              <div className="text-white font-bold text-sm mt-1">
                {parseFloat(intent.total_amount).toFixed(2)}{' '}
                <span className="text-stellar-yellow text-xs">{token.symbol}</span>
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{token.name}</div>
            </div>

            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded">
              <div className="text-stellar-muted text-[10px] uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Registered
              </div>
              <div className="text-white font-bold text-xs mt-1">
                {intent.created_at ? new Date(intent.created_at).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">
                {intent.created_at ? new Date(intent.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded col-span-2 sm:col-span-1">
              <div className="text-stellar-muted text-[10px] uppercase">Organization</div>
              <div className="text-white font-bold text-xs mt-1 truncate">
                {intent.org_name || 'Individual'}
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">
                {intent.sender_role || 'Treasurer'}
              </div>
            </div>
          </div>

          {/* Identity & Routing */}
          <div className="bg-[#07090E] border border-[#1b212f] p-4 rounded space-y-3">
            <div className="text-[10px] uppercase text-stellar-muted font-bold tracking-wider">
              Participant Routing
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-zinc-500 text-[10px] block">Sender (Treasurer):</span>
                <div className="flex items-center justify-between text-white font-mono text-[11px] bg-[#0d1017] p-2 border border-[#1e2536] rounded">
                  <span className="break-all">{intent.from_wallet}</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${intent.from_wallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-stellar-yellow hover:text-white shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] block">Recipient (Counterparty):</span>
                <div className="flex items-center justify-between text-white font-mono text-[11px] bg-[#0d1017] p-2 border border-[#1e2536] rounded">
                  <span className="break-all">{intent.to_wallet}</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${intent.to_wallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-stellar-yellow hover:text-white shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] block">Asset Contract Address:</span>
                <div className="flex items-center justify-between text-stellar-yellow font-mono text-[11px] bg-[#0d1017] p-2 border border-[#1e2536] rounded">
                  <span className="break-all">{(intent as any).asset_address || token.contractId}</span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${(intent as any).asset_address || token.contractId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-stellar-yellow hover:text-white shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quorum Signers */}
          <div className="bg-[#07090E] border border-[#1b212f] p-4 rounded space-y-2">
            <div className="text-[10px] uppercase text-stellar-muted font-bold tracking-wider">
              Assigned Quorum Signers
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center bg-[#0d1017] p-2 border border-[#1e2536] rounded">
                <span className="text-zinc-400">Co-Signer 1:</span>
                <span className="text-white font-mono">{formatFullAddress(intent.cosigner_1_name)}</span>
              </div>
              <div className="flex justify-between items-center bg-[#0d1017] p-2 border border-[#1e2536] rounded">
                <span className="text-zinc-400">Co-Signer 2:</span>
                <span className="text-white font-mono">{formatFullAddress(intent.cosigner_2_name)}</span>
              </div>
            </div>
          </div>

          {/* Audit Memo */}
          <div className="bg-[#07090E] border border-[#1b212f] p-4 rounded space-y-1.5">
            <div className="text-[10px] uppercase text-stellar-muted font-bold tracking-wider">
              Memo & Settlement Log
            </div>
            <div className="p-2.5 bg-[#0d1017] border border-[#1e2536] text-zinc-300 text-[11px] leading-relaxed rounded break-words whitespace-pre-wrap">
              {intent.note || intent.description || 'No memo registered.'}
            </div>
          </div>

          {/* Stellar Transaction Hash */}
          {intent.tx_hash && (
            <div className="bg-[#07090E] border border-emerald-900/40 p-3 rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stellar-muted block">Transaction Hash</span>
                <span className="text-emerald-400 font-mono text-[11px] break-all">{intent.tx_hash}</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${intent.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="ml-3 px-3 py-1.5 bg-emerald-950 border border-emerald-700 text-emerald-400 hover:bg-emerald-900 rounded inline-flex items-center gap-1 text-[10px] shrink-0"
              >
                <span>Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#232938] px-6 py-3 bg-[#121620] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntentDetailModal;