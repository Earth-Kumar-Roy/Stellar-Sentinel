import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Send, 
  Mail, 
  RefreshCw, 
  FileBadge, 
  X, 
  Users 
} from 'lucide-react';
import { supabase } from '../config/supabase';

interface OrgEntity {
  org_name: string;
  gst_number?: string | null;
  is_verified: boolean;
  wallet_address?: string;
  members: Array<{
    id: string;
    full_name: string;
    role: string;
    wallet_address: string;
    email: string;
  }>;
}

interface OrganizationSearchProps {
  userRole?: string;
  currentWallet?: string | null;
  currentOrgName?: string | null;
  onSelectPayee: (walletAddress: string, orgName?: string) => void;
}

export const OrganizationSearch: React.FC<OrganizationSearchProps> = ({ 
  userRole, 
  currentWallet, 
  currentOrgName, 
  onSelectPayee 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<OrgEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgEntity | null>(null);

  const isTreasurer = userRole?.toLowerCase() === 'treasurer';

  const fetchDirectory = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      let orgQuery = supabase.from('organizations').select('*');
      if (query.trim()) {
        orgQuery = orgQuery.or(`name.ilike.%${query.trim()}%,wallet_address.ilike.%${query.trim()}%,gst_number.ilike.%${query.trim()}%`);
      }
      const { data: orgData } = await orgQuery.order('name', { ascending: true });

      let memQuery = supabase
        .from('organization_members')
        .select('id, org_name, full_name, role, wallet_address, email, gst_number, is_verified')
        .neq('status', 'rejected');

      if (query.trim()) {
        memQuery = memQuery.or(`org_name.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%,wallet_address.ilike.%${query.trim()}%`);
      }
      const { data: memData } = await memQuery.order('org_name', { ascending: true });

      const orgMap: Record<string, OrgEntity> = {};

      (orgData || []).forEach((item: any) => {
        const key = (item.name || '').trim().toUpperCase();
        if (!key) return;
        orgMap[key] = {
          org_name: item.name,
          gst_number: item.gst_number || item.gstin || null,
          is_verified: Boolean(item.is_verified ?? true),
          wallet_address: item.wallet_address || '',
          members: []
        };
      });

      (memData || []).forEach((mem: any) => {
        const key = (mem.org_name || '').trim().toUpperCase();
        if (!key) return;

        if (!orgMap[key]) {
          orgMap[key] = {
            org_name: mem.org_name,
            gst_number: mem.gst_number || null,
            is_verified: Boolean(mem.is_verified),
            wallet_address: mem.wallet_address,
            members: []
          };
        }

        if (mem.gst_number && !orgMap[key].gst_number) {
          orgMap[key].gst_number = mem.gst_number;
        }
        if (mem.is_verified) {
          orgMap[key].is_verified = true;
        }

        orgMap[key].members.push({
          id: mem.id,
          full_name: mem.full_name || 'Designated Member',
          role: mem.role || 'Member',
          wallet_address: mem.wallet_address,
          email: mem.email || ''
        });
      });

      setOrganizations(Object.values(orgMap));
    } catch (err) {
      console.error('Failed to load organization directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDirectory(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, fetchDirectory]);

  const isSameOrg = (orgName: string) => {
    if (!currentOrgName) return false;
    return orgName.trim().toUpperCase() === currentOrgName.trim().toUpperCase();
  };

  const isSelfWallet = (targetWallet: string) => {
    if (!currentWallet) return false;
    return targetWallet.trim().toUpperCase() === currentWallet.trim().toUpperCase();
  };

  return (
    <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5 text-stellar-yellow" />
            ORGANIZATION DIRECTORY & DISBURSEMENT SEARCH
          </h1>
          <p className="text-stellar-muted text-[11px] mt-1">
            Search external verified corporate registries and inspect designated vault rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDirectory(searchTerm)}
          className="px-4 py-2 border border-[#232938] hover:border-stellar-yellow text-stellar-muted hover:text-white bg-[#0B0D13] btn-polygon flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH DIRECTORY
        </button>
      </div>

      <div className="bg-[#121620] border border-[#232938] p-4 card-polygon">
        <div className="relative">
          <Search className="w-4 h-4 text-stellar-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by company name, designated officer, GST, or Stellar address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0D13] border border-[#232938] pl-10 pr-4 py-2.5 text-white text-xs outline-none focus:border-stellar-yellow placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
        <div className="flex items-center justify-between border-b border-[#232938] pb-2">
          <span className="text-white font-bold uppercase tracking-wider text-xs">
            Corporate Entities
          </span>
          <span className="text-stellar-muted text-[10px]">
            {organizations.length} Organizations Found
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-stellar-yellow">
            <span className="animate-spin inline-block text-base mr-2">⟳</span>
            Querying corporate registries and member rosters...
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center text-stellar-muted">
            No registered organizations match your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => {
              const belongsToCurrentOrg = isSameOrg(org.org_name);

              return (
                <div
                  key={org.org_name}
                  onClick={() => setSelectedOrg(org)}
                  className={`bg-[#0B0D13] border p-5 card-polygon flex flex-col justify-between gap-3 cursor-pointer transition-all hover:bg-[#121620] ${
                    belongsToCurrentOrg 
                      ? 'border-stellar-yellow/40 hover:border-stellar-yellow' 
                      : 'border-[#232938] hover:border-[#384257]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-base tracking-wide flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-stellar-yellow" />
                          {org.org_name}
                        </span>
                        {belongsToCurrentOrg && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-stellar-yellow/15 border border-stellar-yellow/40 text-stellar-yellow font-bold uppercase rounded">
                            YOUR ORG
                          </span>
                        )}
                      </div>
                      {org.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40 rounded">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded">
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-stellar-muted text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <FileBadge className="w-3.5 h-3.5 text-zinc-500" />
                        <span>GSTIN: <strong className="text-zinc-300 font-mono">{org.gst_number || 'REGISTERED_CORP'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Officers Enrolled: <strong className="text-zinc-300">{org.members.length}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#181d28] flex items-center justify-between text-[11px]">
                    <span className="text-stellar-muted">Click to view personnel</span>
                    <span className="text-stellar-yellow font-bold group-hover:underline">VIEW ORG &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrg && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs"
          onClick={() => setSelectedOrg(null)}
        >
          <div 
            className="bg-[#121620] border border-[#232938] max-w-2xl w-full p-6 card-polygon space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#232938] pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="w-5 h-5 text-stellar-yellow" />
                <span className="text-white font-bold text-base">{selectedOrg.org_name}</span>
                {isSameOrg(selectedOrg.org_name) && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-stellar-yellow/15 border border-stellar-yellow/40 text-stellar-yellow font-bold uppercase rounded">
                    YOUR ORG
                  </span>
                )}
                {selectedOrg.is_verified ? (
                  <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 text-[10px] px-2 py-0.5 rounded">
                    PENDING
                  </span>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOrg(null)}
                className="text-stellar-muted hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0B0D13] p-3 border border-[#232938] space-y-2">
              <div>
                <span className="text-[10px] text-stellar-muted uppercase block">GST Registration</span>
                <span className="text-white font-bold font-mono text-sm">{selectedOrg.gst_number || 'REGISTERED_CORP'}</span>
              </div>
              {selectedOrg.wallet_address && (
                <div className="pt-2 border-t border-[#1b212f]">
                  <span className="text-[10px] text-stellar-muted uppercase block">Primary Vault Address</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-stellar-yellow font-mono text-[11px] break-all select-all">
                      {selectedOrg.wallet_address}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${selectedOrg.wallet_address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stellar-muted hover:text-white shrink-0"
                      title="Inspect address on Stellar Expert"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                Authorized Officers & Receiving Endpoints ({selectedOrg.members.length})
              </span>

              {selectedOrg.members.length === 0 ? (
                <div className="bg-[#0B0D13] p-4 text-center text-stellar-muted border border-[#232938]">
                  No individual officer profiles bound yet.
                  {selectedOrg.wallet_address && isTreasurer && !isSameOrg(selectedOrg.org_name) && !isSelfWallet(selectedOrg.wallet_address) && (
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPayee(selectedOrg.wallet_address!, selectedOrg.org_name);
                          setSelectedOrg(null);
                        }}
                        className="px-4 py-2 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        DISBURSE TO PRIMARY VAULT
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrg.members.map((mem) => {
                    const isSelf = isSelfWallet(mem.wallet_address);
                    const isOwnOrgMember = isSameOrg(selectedOrg.org_name);
                    const canDisburse = isTreasurer && !isSelf && !isOwnOrgMember;

                    return (
                      <div 
                        key={mem.id} 
                        className="bg-[#0B0D13] border border-[#232938] p-3.5 card-polygon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.2 bg-stellar-yellow/10 border border-stellar-yellow/30 text-stellar-yellow text-[9px] uppercase font-bold">
                              {mem.role}
                            </span>
                            <span className="text-white font-bold">{mem.full_name}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          {mem.email && (
                            <div className="text-stellar-muted text-[10px] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-zinc-500" />
                              <span>{mem.email}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] text-zinc-500 block uppercase">Officer Public Key</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-stellar-yellow font-mono text-[11px] break-all select-all">
                                {mem.wallet_address}
                              </span>
                              <a
                                href={`https://stellar.expert/explorer/testnet/account/${mem.wallet_address}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stellar-muted hover:text-white shrink-0"
                                title="Inspect address on Stellar Expert"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {canDisburse && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPayee(mem.wallet_address, selectedOrg.org_name);
                              setSelectedOrg(null);
                            }}
                            className="px-4 py-2 bg-stellar-yellow text-black font-bold text-xs btn-polygon hover:bg-stellar-gold flex items-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
                          >
                            <Send className="w-3.5 h-3.5" />
                            DISBURSE INTENT
                          </button>
                        )}

                        {isTreasurer && (isSelf || isOwnOrgMember) && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-2.5 py-1 rounded shrink-0">
                            {isSelf ? 'Self-Disbursement Forbidden' : 'Internal Entity Member'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSearch;