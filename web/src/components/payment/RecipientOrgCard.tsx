import React from 'react';
import { Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { OrgMember } from '../../types';

interface RecipientOrgCardProps {
  org: OrgMember | null;
  isSearching: boolean;
  isValidAddress: boolean;
  address: string;
}

export const RecipientOrgCard: React.FC<RecipientOrgCardProps> = ({
  org,
  isSearching,
  isValidAddress,
  address,
}) => {
  if (!isValidAddress) {
    return null;
  }

  if (isSearching) {
    return (
      <div className="bg-[#0B0D13] border border-[#232938] p-4 card-polygon font-mono text-xs text-stellar-muted flex items-center gap-2">
        <span className="animate-spin text-stellar-yellow text-sm">⟳</span>
        Querying counterparty registry & GST compliance database...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="bg-[#191113] border border-amber-500/40 p-4 card-polygon font-mono text-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-amber-300 font-bold tracking-wide">
              UNREGISTERED COUNTERPARTY ADDRESS
            </div>
            <p className="text-stellar-muted text-[11px] leading-relaxed">
              Target address <span className="text-white">{address.slice(0, 8)}...{address.slice(-6)}</span> has no verified corporate GST binding in the registry. 
              Per treasury policy, transactions to unverified accounts will be subjected to the mandatory 1-hour ML observation window and require multi-sig sign-off.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0D13] border border-emerald-500/40 p-4 card-polygon font-mono text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold text-sm tracking-wide">{org.org_name}</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5">
            <ShieldCheck className="w-3 h-3" /> VERIFIED GST ENTITY
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-stellar-muted">STATUS:</span>{' '}
          <span className="text-emerald-400 font-bold">
            {org.is_verified ? 'COMPLIANT (ACTIVE)' : 'PENDING'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#121620] p-2 border border-[#232938]">
        <div>
          <span className="text-stellar-muted">GSTIN:</span>{' '}
          <span className="text-stellar-yellow">{org.gst_number || 'REGISTERED_CORP'}</span>
        </div>
        <div>
          <span className="text-stellar-muted">Designated Officer:</span>{' '}
          <span className="text-white">{org.full_name}</span>
        </div>
      </div>
    </div>
  );
};