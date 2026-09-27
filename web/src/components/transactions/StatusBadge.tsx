import React from 'react';
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileCheck,
  Ban,
  Play,
  Users
} from 'lucide-react';
import type { PaymentIntentRecord } from '../../types';

interface StatusBadgeProps {
  status: PaymentIntentRecord['status'] | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = (status || '').toString().trim().toLowerCase();

  switch (normalized) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-stellar-yellow bg-stellar-yellow/10 border border-stellar-yellow/40 btn-polygon">
          <FileCheck className="w-3 h-3" /> PENDING
        </span>
      );

    case 'observing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-amber-400 bg-amber-950/40 border border-amber-500/40 btn-polygon">
          <Clock className="w-3 h-3 animate-pulse" /> OBSERVING
        </span>
      );

    case 'awaiting_approval':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-amber-300 bg-amber-950/30 border border-amber-400/40 btn-polygon">
          <Users className="w-3 h-3" /> AWAITING APPROVAL
        </span>
      );

    case 'executable':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-emerald-400 bg-emerald-950/40 border border-emerald-500/50 btn-polygon">
          <Play className="w-3 h-3" /> EXECUTABLE
        </span>
      );

    case 'quarantined':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-red-400 bg-red-950/40 border border-red-500/50 btn-polygon animate-pulse">
          <ShieldAlert className="w-3 h-3" /> QUARANTINED
        </span>
      );

    case 'executed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-emerald-300 bg-emerald-900/30 border border-emerald-400/40 btn-polygon">
          <CheckCircle2 className="w-3 h-3" /> EXECUTED
        </span>
      );

    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-zinc-400 bg-zinc-900/40 border border-zinc-700 btn-polygon">
          <XCircle className="w-3 h-3" /> CANCELLED
        </span>
      );

    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-rose-400 bg-rose-950/40 border border-rose-600 btn-polygon">
          <Ban className="w-3 h-3" /> REJECTED
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wide text-stellar-muted bg-[#121620] border border-[#232938] btn-polygon">
          {String(status || 'UNKNOWN').toUpperCase()}
        </span>
      );
  }
};