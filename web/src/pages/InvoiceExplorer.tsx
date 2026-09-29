import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Building2, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { resolveTokenByAddress } from '../config/constants';
import { StatusBadge } from '../components/transactions/StatusBadge';
import { InvoiceReceiptModal, type InvoiceData } from '../components/invoice/InvoiceReceiptModal';

interface InvoiceExplorerProps {
  currentWallet?: string | null;
  orgName?: string | null;
}

const PAGE_SIZE = 20;

export const InvoiceExplorer: React.FC<InvoiceExplorerProps> = ({ currentWallet, orgName }) => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchInvoices = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      let req = supabase
        .from('transactions_testnet')
        .select('*')
        .order('created_at', { ascending: false });

      const cleanQuery = query.trim();
      if (cleanQuery) {
        if (!isNaN(Number(cleanQuery))) {
          req = req.or(`intent_id.eq.${Number(cleanQuery)},tx_hash.ilike.%${cleanQuery}%,to_wallet.ilike.%${cleanQuery}%,from_wallet.ilike.%${cleanQuery}%`);
        } else {
          req = req.or(`tx_hash.ilike.%${cleanQuery}%,to_wallet.ilike.%${cleanQuery}%,from_wallet.ilike.%${cleanQuery}%,note.ilike.%${cleanQuery}%`);
        }
      } else if (currentWallet) {
        req = req.or(`from_wallet.ilike.%${currentWallet.trim()}%,to_wallet.ilike.%${currentWallet.trim()}%`);
      }

      const { data, error } = await req;
      if (error) throw error;

      const formatted: InvoiceData[] = (data || []).map((item: any) => {
        const token = resolveTokenByAddress(item.asset_address);
        return {
          id: item.id,
          intent_id: item.intent_id,
          tx_hash: item.tx_hash,
          created_at: item.created_at,
          executed_at: item.created_at,
          from_wallet: item.from_wallet,
          to_wallet: item.to_wallet,
          total_amount: item.total_amount,
          asset_address: item.asset_address,
          asset_symbol: token.symbol,
          status: item.status || 'pending',
          note: item.note || item.description,
          org_name: item.org_name || orgName || 'Enterprise Entity',
          gst_number: item.gst_number,
          cosigner_1_name: item.cosigner_1_name,
          cosigner_1_role: item.cosigner_1_role,
          cosigner_2_name: item.cosigner_2_name,
          cosigner_2_role: item.cosigner_2_role,
          ml_score: item.risk_score || item.ml_score || '35.0',
        };
      });

      setInvoices(formatted);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgName, currentWallet]);

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchInvoices(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchInvoices]);

  const totalPages = Math.ceil(invoices.length / PAGE_SIZE) || 1;

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return invoices.slice(startIndex, startIndex + PAGE_SIZE);
  }, [invoices, currentPage]);

  return (
    <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-stellar-yellow" />
            TREASURY INVOICE & RECEIPT EXPLORER
          </h1>
          <p className="text-stellar-muted text-[11px] mt-1">
            Audit on-chain settlements, auto-generate tax receipts, and inspect compliance proofs by Intent ID[cite: 5].
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchInvoices(searchTerm)}
          className="px-4 py-2 border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white bg-[#0B0D13] btn-polygon flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH INVOICES
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-[#121620] border border-[#232938] p-4 card-polygon">
        <div className="relative">
          <Search className="w-4 h-4 text-stellar-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice by Intent ID (e.g. 50), Tx Hash, recipient address, or note memo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0D13] border border-[#232938] pl-10 pr-4 py-2.5 text-white text-xs outline-none focus:border-stellar-yellow placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Invoice Grid */}
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
        <div className="flex items-center justify-between border-b border-[#232938] pb-2">
          <span className="text-white font-bold uppercase tracking-wider text-xs">
            Disbursement Invoices & Settlement Receipts
          </span>
          <span className="text-stellar-muted text-[10px]">
            Showing {invoices.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-
            {Math.min(currentPage * PAGE_SIZE, invoices.length)} of {invoices.length} Invoices Available
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-stellar-yellow">
            <span className="animate-spin inline-block text-base mr-2">⟳</span>
            Querying corporate invoice records...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-stellar-muted">
            No invoices found matching your query criteria.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedInvoices.map((inv) => (
                <div
                  key={inv.id || inv.intent_id}
                  className="bg-[#0B0D13] border border-[#232938] hover:border-stellar-yellow/60 p-4 card-polygon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-stellar-yellow font-bold text-sm">
                        INVOICE #{inv.intent_id}
                      </span>
                      <StatusBadge status={inv.status} />
                      <span className="text-white font-semibold text-xs truncate max-w-xs">
                        {inv.note ? `"${inv.note}"` : 'Direct Treasury Disbursement'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-stellar-muted text-[11px] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(inv.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-zinc-500" />
                        <span>Entity: <strong className="text-zinc-300">{inv.org_name || 'Treasury'}</strong></span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 flex-wrap pt-0.5">
                      <span>TO: {inv.to_wallet.slice(0, 8)}...{inv.to_wallet.slice(-8)}</span>
                      {inv.tx_hash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${inv.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stellar-muted hover:text-white inline-flex items-center gap-0.5"
                        >
                          <span>Tx</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {parseFloat(String(inv.total_amount)).toFixed(2)} <span className="text-xs text-stellar-yellow">{inv.asset_symbol}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-4 py-2 bg-stellar-yellow text-black font-bold text-xs btn-polygon hover:bg-stellar-gold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      VIEW INVOICE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (20 Invoices per Page) */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#232938]">
                <div className="text-[11px] text-stellar-muted">
                  Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white bg-[#0B0D13] disabled:opacity-40 disabled:hover:border-[#232938] disabled:cursor-not-allowed btn-polygon flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> PREVIOUS
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, idx, arr) => {
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="px-1 text-zinc-600">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 flex items-center justify-center border text-[11px] cursor-pointer ${
                                currentPage === page
                                  ? 'border-stellar-yellow bg-stellar-yellow/15 text-stellar-yellow font-bold'
                                  : 'border-[#232938] bg-[#0B0D13] text-stellar-muted hover:text-white hover:border-zinc-500'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white bg-[#0B0D13] disabled:opacity-40 disabled:hover:border-[#232938] disabled:cursor-not-allowed btn-polygon flex items-center gap-1 cursor-pointer"
                  >
                    NEXT <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reusable Receipt / Tax Invoice Modal */}
      <InvoiceReceiptModal 
        invoice={selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
      />
    </div>
  );
};

export default InvoiceExplorer;