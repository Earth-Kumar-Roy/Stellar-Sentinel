import React, { useState } from 'react';
import { Send, Wallet, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { WalletService } from '../services/wallet';

interface DirectTransferProps {
  currentWallet: string;
}

export const DirectTransfer: React.FC<DirectTransferProps> = ({ currentWallet }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDirectSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxResult(null);

    const cleanRecipient = recipient.trim();
    if (!cleanRecipient || cleanRecipient.length !== 56 || !cleanRecipient.startsWith('G')) {
      setErrorMsg('Please enter a valid 56-character Stellar public key (G...).');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Direct Freighter transaction signing & submission without contract/Supabase overhead
      const txHash = await WalletService.signAndSubmitDirectPayment(
        currentWallet,
        cleanRecipient,
        parsedAmount.toFixed(7),
        memo.trim()
      );

      setTxResult(txHash);
      setRecipient('');
      setAmount('');
      setMemo('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Direct transfer failed via Freighter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Wallet className="w-5 h-5 text-stellar-yellow" />
          DIRECT WALLET TRANSFER (P2P)
        </h1>
        <p className="text-stellar-muted text-[11px] mt-1">
          Perform un-sequenced, direct Stellar network transfers from your personal role wallet without corporate database logging or multi-sig lock.
        </p>
      </div>

      <form onSubmit={handleDirectSend} className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
        <div>
          <label className="block text-stellar-muted uppercase mb-1">Your Connected Wallet</label>
          <input
            type="text"
            disabled
            value={currentWallet}
            className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-stellar-yellow opacity-80 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-stellar-muted uppercase mb-1">Recipient Public Key (G...)</label>
          <input
            type="text"
            required
            maxLength={56}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim())}
            placeholder="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
            className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-stellar-muted uppercase mb-1">Amount (XLM)</label>
            <input
              type="number"
              step="0.0000001"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
            />
          </div>

          <div>
            <label className="block text-stellar-muted uppercase mb-1">Memo (Optional)</label>
            <input
              type="text"
              maxLength={28}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Direct settlement"
              className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {txResult && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transfer Submitted Successfully!</span>
            </div>
            <div className="text-[10px] break-all">
              Tx Hash:{' '}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txResult}`}
                target="_blank"
                rel="noreferrer"
                className="text-stellar-yellow underline inline-flex items-center gap-1"
              >
                {txResult} <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-stellar-yellow text-black font-bold flex items-center gap-2 btn-polygon hover:bg-stellar-gold disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'SIGNING VIA FREIGHTER...' : 'SEND DIRECT TRANSFER'}
          </button>
        </div>
      </form>
    </div>
  );
};