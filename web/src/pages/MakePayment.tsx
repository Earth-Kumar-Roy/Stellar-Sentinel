import React, { useState } from 'react';
import { Send, CheckCircle2, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import { PaymentForm } from '../components/payment/PaymentForm';

interface MakePaymentProps {
  currentWallet: string;
  initialRecipient?: string;
  onPaymentSuccess: () => void;
  onNavigateHome: () => void;
  senderName?: string;
  senderRole?: string;
  orgName?: string;
}

export const MakePayment: React.FC<MakePaymentProps> = ({
  currentWallet,
  initialRecipient,
  onPaymentSuccess,
  onNavigateHome,
  senderName,
  senderRole,
  orgName,
}) => {
  const [lastReceipt, setLastReceipt] = useState<{ 
    intentId: number; 
    txHash: string;
    symbol: string;
  } | null>(null);

  const handleSuccess = (intentId: number, txHash: string, symbol: string) => {
    setLastReceipt({ intentId, txHash, symbol });
    if (typeof onPaymentSuccess === 'function') {
      onPaymentSuccess();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-[#232938] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Send className="w-5 h-5 text-stellar-yellow" />
            DISBURSE TREASURY INTENT
          </h1>
          <p className="text-stellar-muted text-[11px] mt-1">
            Publish on-chain payment parameters. Automatically bound to policy limits and observation windows[cite: 5].
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 px-3 py-2 border border-[#232938] text-stellar-muted hover:text-white btn-polygon transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>
      </div>

      {lastReceipt ? (
        <div className="bg-[#121620] border border-emerald-500/50 p-6 card-polygon space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 btn-polygon">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">
                PAYMENT INTENT COMMITTED ON-CHAIN
              </h3>
              <p className="text-stellar-muted text-[11px]">
                Intent ID <span className="text-stellar-yellow font-bold">#{lastReceipt.intentId}</span> registered on Soroban Testnet ({lastReceipt.symbol})[cite: 5].
              </p>
            </div>
          </div>

          <div className="bg-[#0B0D13] border border-[#232938] p-3 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
              <span className="text-stellar-muted text-[10px]">Stellar Transaction Hash:</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${lastReceipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-stellar-yellow hover:underline flex items-center gap-1 break-all"
              >
                <span>{lastReceipt.txHash}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-stellar-yellow/5 border border-stellar-yellow/30 text-[11px] text-stellar-yellow">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>The ML Sentinel Daemon is now monitoring this intent over the observation window[cite: 5].</span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="px-5 py-2.5 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold cursor-pointer"
            >
              CREATE ANOTHER INTENT
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#121620] border border-[#232938] p-6 card-polygon">
          <PaymentForm 
            senderWallet={currentWallet} 
            senderName={senderName}
            senderRole={senderRole}
            orgName={orgName}
            initialRecipient={initialRecipient}
            onSuccess={handleSuccess} 
          />
        </div>
      )}
    </div>
  );
};

export default MakePayment;