import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ExternalLink, 
  ShieldAlert, 
  Check, 
  X, 
  UserCheck, 
  Mail, 
  Phone, 
  Key, 
  FileBadge, 
  Calendar 
} from 'lucide-react';
import { supabase } from '../config/supabase';
import type { OrgMember } from '../types';

interface OrganizationDisplayProps {
  currentMember?: OrgMember | null;
  currentWallet?: string | null;
  onMemberUpdated?: () => void;
}

export const OrganizationDisplay: React.FC<OrganizationDisplayProps> = ({ currentMember, currentWallet, onMemberUpdated }) => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

  const orgName = currentMember?.org_name;

  const fetchOrganizationData = useCallback(async () => {
    setIsLoading(true);
    try {
      let targetOrg = orgName;

      if (!targetOrg && currentWallet) {
        const { data: memberLookup } = await supabase
          .from('organization_members')
          .select('org_name')
          .ilike('wallet_address', currentWallet.trim())
          .maybeSingle();

        if (memberLookup) {
          targetOrg = memberLookup.org_name;
        }
      }

      if (!targetOrg) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .ilike('org_name', targetOrg.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers((data as OrgMember[]) || []);
    } catch (err) {
      console.error('Failed to load organization members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgName, currentWallet]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  const handleUpdateStatus = async (memberId: string, newStatus: 'active' | 'rejected') => {
    try {
      setActionLoading(memberId);
      const { error } = await supabase
        .from('organization_members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      alert(`Member request successfully ${newStatus === 'active' ? 'approved' : 'rejected'}.`);
      await fetchOrganizationData();
      if (onMemberUpdated) onMemberUpdated();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update member status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return 'None';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const isUserActiveTreasurer = Boolean(
    currentMember?.role === 'Treasurer' && currentMember?.status === 'active'
  );

  const treasurerMember = members.find((m) => m.role === 'Treasurer' && m.status !== 'rejected');
  const guardianMember = members.find((m) => m.role === 'Guardian' && m.status !== 'rejected');
  const signerMember = members.find((m) => m.role === 'Signer' && m.status !== 'rejected');

  const pendingRequests = members.filter((m) => m.status === 'pending');
  const verifiedOrg = members.some((m) => m.is_verified);
  const gstVal = members.find((m) => m.gst_number)?.gst_number;
  const activeOrgName = orgName || members[0]?.org_name || 'Connected Organization';

  return (
    <div className="space-y-6 font-mono text-xs max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <Building2 className="w-5 h-5 text-stellar-yellow" />
          {activeOrgName.toUpperCase()} — TREASURY MANAGEMENT
        </h1>
        <p className="text-stellar-muted text-[11px] mt-1">
          Direct overview of organizational structure, role capacities, and incoming join approvals[cite: 18]. Click any assigned role to view full member profile.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-[#121620] border border-[#232938] p-12 text-center text-stellar-yellow card-polygon">
          <span className="animate-spin inline-block text-base mr-2">⟳</span>
          Synchronizing organizational ledger...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-[#121620] border border-[#232938] p-12 text-center text-stellar-muted card-polygon">
          No organization mapping found for your connected wallet[cite: 18].
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#121620] border border-[#232938] p-5 card-polygon grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0B0D13] border border-[#232938] p-3">
              <span className="text-stellar-muted text-[10px] block">GST Registration</span>
              <span className="text-stellar-yellow font-bold text-sm">{gstVal || 'N/A'}</span>
            </div>
            <div className="bg-[#0B0D13] border border-[#232938] p-3 flex items-center justify-between">
              <div>
                <span className="text-stellar-muted text-[10px] block">Verification Status</span>
                <span className={verifiedOrg ? "text-emerald-400 font-bold text-sm" : "text-amber-400 font-bold text-sm"}>
                  {verifiedOrg ? 'VERIFIED CORPORATE ENTITY' : 'PENDING COMPLIANCE'}
                </span>
              </div>
              {verifiedOrg ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              )}
            </div>
          </div>

          {/* Assigned Roles Section (Clickable Cards) */}
          <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
            <h3 className="text-white font-bold uppercase tracking-wider text-xs border-b border-[#232938] pb-2 flex items-center justify-between">
              <span>Assigned Vault Roles (Max 3)</span>
              <span className="text-stellar-muted text-[10px]">Click role for member details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Treasurer Slot */}
              <div 
                onClick={() => treasurerMember && setSelectedMember(treasurerMember)}
                className={`bg-[#0B0D13] border p-4 space-y-2 card-polygon transition-all ${
                  treasurerMember 
                    ? 'border-[#232938] hover:border-stellar-yellow cursor-pointer hover:bg-[#121620]' 
                    : 'border-[#1b212f] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-stellar-yellow font-bold uppercase flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Treasurer
                  </span>
                  {treasurerMember ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold">
                      {treasurerMember.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">SLOT EMPTY</span>
                  )}
                </div>
                {treasurerMember ? (
                  <div className="text-[11px] space-y-1 text-stellar-muted pt-2 border-t border-[#181d28]">
                    <div className="text-white font-bold">{treasurerMember.full_name}</div>
                    <div className="truncate text-stellar-muted">{treasurerMember.email}</div>
                    <div className="text-stellar-yellow font-mono">{formatAddress(treasurerMember.wallet_address)}</div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 italic pt-2">No treasurer assigned[cite: 18].</p>
                )}
              </div>

              {/* Guardian Slot */}
              <div 
                onClick={() => guardianMember && setSelectedMember(guardianMember)}
                className={`bg-[#0B0D13] border p-4 space-y-2 card-polygon transition-all ${
                  guardianMember 
                    ? 'border-[#232938] hover:border-stellar-yellow cursor-pointer hover:bg-[#121620]' 
                    : 'border-[#1b212f] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-stellar-yellow font-bold uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Guardian
                  </span>
                  {guardianMember ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      guardianMember.status === 'active' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}>
                      {guardianMember.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">SLOT EMPTY</span>
                  )}
                </div>
                {guardianMember ? (
                  <div className="text-[11px] space-y-1 text-stellar-muted pt-2 border-t border-[#181d28]">
                    <div className="text-white font-bold">{guardianMember.full_name}</div>
                    <div className="truncate text-stellar-muted">{guardianMember.email}</div>
                    <div className="text-stellar-yellow font-mono">{formatAddress(guardianMember.wallet_address)}</div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 italic pt-2">No guardian assigned[cite: 18].</p>
                )}
              </div>

              {/* Signer Slot */}
              <div 
                onClick={() => signerMember && setSelectedMember(signerMember)}
                className={`bg-[#0B0D13] border p-4 space-y-2 card-polygon transition-all ${
                  signerMember 
                    ? 'border-[#232938] hover:border-stellar-yellow cursor-pointer hover:bg-[#121620]' 
                    : 'border-[#1b212f] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-stellar-yellow font-bold uppercase flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Signer
                  </span>
                  {signerMember ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      signerMember.status === 'active' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                    }`}>
                      {signerMember.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">SLOT EMPTY</span>
                  )}
                </div>
                {signerMember ? (
                  <div className="text-[11px] space-y-1 text-stellar-muted pt-2 border-t border-[#181d28]">
                    <div className="text-white font-bold">{signerMember.full_name}</div>
                    <div className="truncate text-stellar-muted">{signerMember.email}</div>
                    <div className="text-stellar-yellow font-mono">{formatAddress(signerMember.wallet_address)}</div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 italic pt-2">No signer assigned[cite: 18].</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-[#232938] my-6" />

          {/* Request Logs & Approval Section */}
          <div className="bg-[#121620] border border-[#232938] p-6 card-polygon space-y-4">
            <h3 className="text-white font-bold uppercase tracking-wider text-xs border-b border-[#232938] pb-2 flex items-center justify-between">
              <span>Membership Request Logs & Approvals</span>
              <span className="text-stellar-yellow font-mono text-[10px]">{pendingRequests.length} Pending</span>
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="bg-[#0B0D13] border border-[#232938] p-6 text-center text-stellar-muted">
                No pending join requests require your attention at this time[cite: 18].
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-[#0B0D13] border border-amber-500/30 p-4 card-polygon flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-500/40 text-[9px] uppercase font-bold">
                          {req.role} Request
                        </span>
                        <span className="text-white font-bold">{req.full_name}</span>
                      </div>
                      <p className="text-stellar-muted text-[11px]">{req.email}</p>
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${req.wallet_address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stellar-yellow hover:underline text-[10px] flex items-center gap-1 font-mono"
                      >
                        <span>Wallet: {req.wallet_address}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {isUserActiveTreasurer ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          className="px-4 py-2 bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 rounded text-xs inline-flex items-center gap-1 disabled:opacity-50 font-bold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> REJECT
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'active')}
                          className="px-4 py-2 bg-emerald-500 text-black font-bold rounded text-xs inline-flex items-center gap-1 hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> APPROVE
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5">
                        Awaiting Treasurer Authorization
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {selectedMember && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-[#121620] border border-[#232938] max-w-lg w-full p-6 card-polygon space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#232938] pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-stellar-yellow/10 border border-stellar-yellow/40 text-stellar-yellow font-bold uppercase text-[10px]">
                  {selectedMember.role}
                </span>
                <span className="text-white font-bold text-sm">
                  {selectedMember.full_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-stellar-muted hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Attributes */}
            <div className="space-y-3 bg-[#0B0D13] p-4 border border-[#232938]">
              <div>
                <span className="text-stellar-muted text-[10px] block uppercase">Stellar Wallet Binding</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-stellar-yellow font-mono break-all select-all">
                    {selectedMember.wallet_address}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${selectedMember.wallet_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stellar-muted hover:text-white shrink-0"
                    title="View Account on Stellar Expert"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1b212f]">
                <div>
                  <span className="text-stellar-muted text-[10px] block uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stellar-yellow" /> Corporate Email
                  </span>
                  <span className="text-white font-mono break-all">{selectedMember.email}</span>
                </div>
                <div>
                  <span className="text-stellar-muted text-[10px] block uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stellar-yellow" /> Contact Phone
                  </span>
                  <span className="text-white font-mono">{selectedMember.phone || 'Not Specified'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1b212f]">
                <div>
                  <span className="text-stellar-muted text-[10px] block uppercase flex items-center gap-1">
                    <FileBadge className="w-3 h-3 text-stellar-yellow" /> GST Registration
                  </span>
                  <span className="text-white font-mono">{selectedMember.gst_number || gstVal || 'None'}</span>
                </div>
                <div>
                  <span className="text-stellar-muted text-[10px] block uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Account Status
                  </span>
                  <span className={`font-bold ${selectedMember.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedMember.status.toUpperCase()} {selectedMember.is_verified ? '(VERIFIED)' : ''}
                  </span>
                </div>
              </div>

              {selectedMember.created_at && (
                <div className="pt-2 border-t border-[#1b212f]">
                  <span className="text-stellar-muted text-[10px] block uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" /> Joined Organization
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {new Date(selectedMember.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-[#0B0D13] border border-[#232938] hover:border-stellar-yellow text-white font-bold text-xs btn-polygon cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};