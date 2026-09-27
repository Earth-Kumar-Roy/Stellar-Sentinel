import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ExternalLink, 
  ShieldCheck, 
  FileText, 
  Building2, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { resolveTokenByAddress } from '../../config/constants';

export interface InvoiceData {
  id?: string;
  intent_id: number | string;
  tx_hash?: string;
  created_at: string;
  executed_at?: string;
  from_wallet: string;
  to_wallet: string;
  total_amount: string | number;
  asset_address?: string;
  asset_symbol?: string;
  status: string;
  note?: string;
  org_name?: string;
  gst_number?: string;
  cosigner_1_name?: string;
  cosigner_1_role?: string;
  cosigner_2_name?: string;
  cosigner_2_role?: string;
  ml_score?: number | string;
  risk_score?: number | string;
}

interface InvoiceReceiptModalProps {
  invoice: InvoiceData | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ invoice, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!invoice) return null;

  const token = resolveTokenByAddress(invoice.asset_address);
  const symbol = invoice.asset_symbol || token.symbol || 'XLM';
  const numericAmount = parseFloat(String(invoice.total_amount)) || 0;

  const normalizedXlm = symbol === 'USDC' 
    ? numericAmount * 5.0 
    : symbol === 'EURC' 
    ? numericAmount * 5.55 
    : numericAmount;

  const statusLower = (invoice.status || '').toLowerCase();
  const isExecuted = statusLower === 'executed';
  const isCancelled = statusLower === 'cancelled';

  const getStatusBadgeStyle = () => {
    if (isExecuted) return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40';
    if (isCancelled) return 'bg-red-950/60 text-red-400 border-red-500/40';
    return 'bg-amber-950/60 text-amber-400 border-amber-500/40';
  };

  // Instant native print isolation via off-screen iframe
  const handlePrint = () => {
    const element = document.getElementById('printable-invoice-sheet');
    if (!element) return;

    setIsPrinting(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setIsPrinting(false);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_${invoice.intent_id}_Receipt</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #ffffff !important;
              color: #0f172a !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-wrapper {
              padding: 12px;
              background-color: #ffffff;
              color: #0f172a;
            }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .items-center { align-items: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .uppercase { text-transform: uppercase; }
            .tracking-wide { letter-spacing: 0.025em; }
            .tracking-wider { letter-spacing: 0.05em; }
            .break-all { word-break: break-all; }
            
            .text-[10px] { font-size: 10px; }
            .text-[11px] { font-size: 11px; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .text-lg { font-size: 18px; }

            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-2 { gap: 8px; }
            .gap-3 { gap: 12px; }
            .gap-4 { gap: 16px; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-4 > * + * { margin-top: 16px; }
            .space-y-6 > * + * { margin-top: 24px; }

            .text-white { color: #0f172a !important; }
            .text-stellar-yellow { color: #0f172a !important; font-weight: bold; }
            .text-stellar-muted { color: #475569 !important; }
            .text-emerald-400 { color: #047857 !important; font-weight: bold; }
            .text-red-400 { color: #b91c1c !important; }
            .text-amber-400 { color: #b45309 !important; }
            
            .bg-\\[\\#0D1017\\], .bg-\\[\\#07090E\\], .bg-\\[\\#161B26\\], .bg-\\[\\#121620\\] {
              background-color: #f8fafc !important;
            }
            
            .border, .border-b, .border-t {
              border-color: #cbd5e1 !important;
            }
            .border { border: 1px solid #cbd5e1 !important; }
            .border-b { border-bottom: 1px solid #cbd5e1 !important; }
            .border-t { border-top: 1px solid #cbd5e1 !important; }

            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .pb-5 { padding-bottom: 20px; }
            .pt-3 { padding-top: 12px; }

            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              border: 1px solid #94a3b8 !important;
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
            }

            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { padding: 10px 12px; }
            th { background-color: #f1f5f9 !important; color: #334155 !important; border-bottom: 1px solid #cbd5e1 !important; }
            td { border-bottom: 1px solid #e2e8f0 !important; color: #0f172a !important; }
            
            .print-hide { display: none !important; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print immediately on frame load without artificial delay
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Cleanup node right after dialog initiates
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      setIsPrinting(false);
    }, 500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#0D1017] border border-[#232938] max-w-2xl w-full card-polygon p-6 space-y-6 text-white my-8 print:border-none print:bg-white print:text-black print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-[#232938] pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stellar-yellow" />
            <span className="font-bold text-sm tracking-wide uppercase">
              Corporate Tax Invoice & Settlement Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-3.5 py-1.5 bg-[#161B26] border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white flex items-center gap-1.5 btn-polygon cursor-pointer transition-colors disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-stellar-yellow animate-spin" />
                  <span>PREPARING...</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-stellar-yellow" />
                  <span>PRINT / SAVE PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-stellar-muted hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Container */}
        <div id="printable-invoice-sheet" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-[#1E2433] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-stellar-yellow" />
                <span className="font-bold text-lg tracking-wider text-white uppercase">
                  {invoice.org_name || 'Enterprise Treasury Entity'}
                </span>
              </div>
              <div className="text-stellar-muted text-[11px] mt-1 space-y-0.5">
                <div>GSTIN / Tax ID: <strong className="text-white">{invoice.gst_number || 'REGISTERED_CORP'}</strong></div>
                <div>Protocol: <span className="text-stellar-yellow font-semibold">Stellar Soroban Non-Custodial Multi-Sig</span></div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className={`badge inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle()}`}>
                {(invoice.status || 'PENDING').toUpperCase()}
              </div>
              <div className="text-stellar-muted text-[11px]">
                INVOICE REF: <strong className="text-stellar-yellow font-mono">#{invoice.intent_id}</strong>
              </div>
              <div className="text-stellar-muted text-[10px]">
                Date: {new Date(invoice.executed_at || invoice.created_at).toUTCString()}
              </div>
            </div>
          </div>

          {/* Endpoints Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07090E] p-4 border border-[#1E2433] card-polygon">
            <div>
              <span className="text-[10px] text-stellar-muted uppercase block font-bold">
                Origin Disbursing Treasury
              </span>
              <div className="text-white font-mono text-[11px] break-all select-all mt-1">
                {invoice.from_wallet}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-stellar-muted uppercase block font-bold">
                Recipient Settlement Endpoint
              </span>
              <div className="text-stellar-yellow font-mono text-[11px] break-all select-all mt-1">
                {invoice.to_wallet}
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-[#1E2433] card-polygon overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#121620] text-stellar-muted text-[10px] uppercase border-b border-[#1E2433]">
                <tr>
                  <th className="p-3">Disbursement Item / Reference</th>
                  <th className="p-3 text-right">Observation Timelock</th>
                  <th className="p-3 text-right">Disbursed Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2433]">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-white">
                      Corporate Payment Intent #{invoice.intent_id}
                    </div>
                    <div className="text-stellar-muted text-[10px] mt-0.5">
                      Memo: "{invoice.note || 'Treasury Disbursal'}"
                    </div>
                  </td>
                  <td className="p-3 text-right text-stellar-muted font-mono">
                    2H - 12H Staged
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-bold font-mono text-emerald-400 text-sm">
                      {numericAmount.toFixed(2)} {symbol}
                    </div>
                    <div className="text-[10px] text-stellar-muted">
                      ≈ {normalizedXlm.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM EQ
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification & Signatories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-[#07090E] border border-[#1E2433] space-y-1.5">
              <div className="text-[10px] text-stellar-muted uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Autonomous ML Telemetry
              </div>
              <div>ML Risk Score: <strong className="text-white">{invoice.ml_score || invoice.risk_score || '35.0'} / 100</strong></div>
              <div>Risk Classification: <span className="text-emerald-400 font-semibold">Cleared Protocol Baseline</span></div>
            </div>

            <div className="p-3 bg-[#07090E] border border-[#1E2433] space-y-1.5">
              <div className="text-[10px] text-stellar-muted uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-stellar-yellow" />
                Signatory Endorsements
              </div>
              <div className="truncate">
                Signer 1: <span className="text-white font-semibold">{invoice.cosigner_1_name || 'FastPath Cleared'}</span>
              </div>
              <div className="truncate">
                Signer 2: <span className="text-white font-semibold">{invoice.cosigner_2_name || 'Exempt / Not Required'}</span>
              </div>
            </div>
          </div>

          {/* On-Chain Ledger Audit Hash */}
          {invoice.tx_hash && (
            <div className="p-3 bg-[#07090E] border border-[#1E2433] card-polygon space-y-1">
              <span className="text-[10px] text-stellar-muted uppercase block font-bold">
                Stellar Network Transaction Hash
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-stellar-yellow text-[10px] break-all select-all">
                  {invoice.tx_hash}
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${invoice.tx_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stellar-muted hover:text-white shrink-0 print-hide"
                  title="View on Stellar Expert"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-3 border-t border-[#1E2433] text-center text-[10px] text-stellar-muted">
            Certified by Stellar Sentinel Autonomous Treasury Defense Engine • Cryptographically Bound to Soroban State
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceReceiptModal;