import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Check, 
  XOctagon, 
  ExternalLink, 
  Users, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Loader2, 
  Undo2 
} from 'lucide-react';
import { StatusBadge } from '../components/transactions/StatusBadge';
import { ContractClient } from '../services/contractClient';
import { AppsScriptService } from '../services/appsScript';
import { resolveTokenByAddress } from '../config/constants';
import { supabase } from '../config/supabase';
import type { PaymentIntentRecord } from '../types';

interface OngoingIntentsProps {
  intents: PaymentIntentRecord[];
  currentWallet: string;
  userRole?: string;
  userOrgName?: string;
  onRefresh: () => void;
}

export const OngoingIntents: React.FC<OngoingIntentsProps> = ({
  intents,
  currentWallet,
  userRole,
  userOrgName,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>({});
  const [memberDirectory, setMemberDirectory] = useState<Record<string, string>>({});
  const [orgMemberWallets, setOrgMemberWallets] = useState<Set<string>>(new Set());

  // 1. Fetch organization members to bind full names and identify all wallets belonging to this organization
  useEffect(() => {
    async function loadDirectoryAndOrgWallets() {
      try {
        const { data } = await supabase
          .from('organization_members')
          .select('full_name, wallet_address, org_name');

        if (data && Array.isArray(data)) {
          const mapping: Record<string, string> = {};
          const currentOrgWallets = new Set<string>();
          const cleanUserOrg = (userOrgName || '').trim().toLowerCase();

          data.forEach((m) => {
            const w = (m.wallet_address || '').trim().toUpperCase();
            const fn = (m.full_name || '').trim().toUpperCase();
            const org = (m.org_name || '').trim().toLowerCase();

            if (fn && w) {
              mapping[fn] = w;
              mapping[w] = m.full_name.trim();
            }

            // Group all member wallets belonging to the current user's organization
            if (cleanUserOrg && org === cleanUserOrg && w) {
              currentOrgWallets.add(w);
            }
          });

          setMemberDirectory(mapping);
          setOrgMemberWallets(currentOrgWallets);
        }
      } catch (err) {
        console.warn('Could not load member directory:', err);
      }
    }
    loadDirectoryAndOrgWallets();
  }, [userOrgName]);

  // 2. Multi-Tenant Scoping: Strictly isolate transactions to THIS company
  const activeItems = useMemo(() => {
    if (!intents || !Array.isArray(intents)) return [];

    const normUserOrg = (userOrgName || '').trim().toLowerCase();
    const normCurrentWallet = (currentWallet || '').trim().toUpperCase();

    return intents
      .filter((it: any) => {
        const s = (it.status || '').toString().trim().toLowerCase();
        const isActiveState = (
          s === 'observing' || 
          s === 'awaiting_approval' || 
          s === 'pending' || 
          s === 'quarantined'
        );

        if (!isActiveState) return false;

        const intentOrg = (it.org_name || '').toString().trim().toLowerCase();
        const fromWallet = (it.from_wallet || '').toString().trim().toUpperCase();
        const c1 = (it.cosigner_1_name || '').toString().trim().toUpperCase();
        const c2 = (it.cosigner_2_name || '').toString().trim().toUpperCase();
        const c1Resolved = memberDirectory[c1] || c1;
        const c2Resolved = memberDirectory[c2] || c2;

        const isMyOrgName = normUserOrg && intentOrg && intentOrg !== 'none' && intentOrg === normUserOrg;
        const isFromMyOrgWallet = orgMemberWallets.has(fromWallet) || fromWallet === normCurrentWallet;
        const isAssignedToMe = (
          (c1 !== 'NONE' && (c1 === normCurrentWallet || c1Resolved === normCurrentWallet)) ||
          (c2 !== 'NONE' && (c2 === normCurrentWallet || c2Resolved === normCurrentWallet))
        );

        if (normUserOrg && normUserOrg !== 'none') {
          return (isMyOrgName || isFromMyOrgWallet || isAssignedToMe);
        }

        return (fromWallet === normCurrentWallet || isAssignedToMe);
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || Date.now()).getTime();
        const timeB = new Date(b.created_at || Date.now()).getTime();
        return timeB - timeA;
      });
  }, [intents, userOrgName, currentWallet, orgMemberWallets, memberDirectory]);

  const parseDelaySeconds = (rawText?: string): number => {
    if (!rawText) return 180;
    const match = rawText.match(/\[DELAY:(\d+)\]/);
    return match ? parseInt(match[1], 10) : 180;
  };

  const calculateTargetTime = (createdAt: string, delaySecs: number, rawId: number): Date => {
    let baseTime = new Date(createdAt).getTime();
    if (isNaN(baseTime)) {
      baseTime = ContractClient.decodeTimestamp(rawId) * 1000;
    }
    return new Date(baseTime + delaySecs * 1000);
  };

  const isWalletSigned = (walletAddress?: string, note?: string, description?: string): boolean => {
    if (!walletAddress || walletAddress === 'none') return false;
    const combined = `${note || ''} ${description || ''}`.toUpperCase();
    const targetWallet = walletAddress.trim().toUpperCase();
    const resolvedWallet = memberDirectory[targetWallet] || targetWallet;

    return (
      combined.includes(`[SIGNED:${targetWallet}]`) || 
      combined.includes(`[SIGNED:${resolvedWallet}]`) || 
      combined.includes('CO-SIGNER APPROVED')
    );
  };

  const resolveIntentEmails = async (record: any) => {
    let treasurerEmail = record.sender_email && record.sender_email.includes('@') ? record.sender_email : '';
    let receiverEmail = record.receiver_email && record.receiver_email.includes('@') && record.receiver_email !== 'none' ? record.receiver_email : '';
    let cosigner1Email = record.cosigner_1_email && record.cosigner_1_email.includes('@') ? record.cosigner_1_email : '';
    let cosigner2Email = record.cosigner_2_email && record.cosigner_2_email.includes('@') ? record.cosigner_2_email : '';
    let orgName = record.org_name || '';
    let gstNumber = record.gst_number || '';

    const targetRecipientWallet = (record.to_wallet || record.recipient || '').trim();

    if (!receiverEmail && targetRecipientWallet && targetRecipientWallet !== 'none') {
      try {
        const { data: recMember } = await supabase
          .from('organization_members')
          .select('email')
          .ilike('wallet_address', targetRecipientWallet)
          .maybeSingle();

        if (recMember?.email && recMember.email.includes('@')) {
          receiverEmail = recMember.email.trim();
        } else {
          const { data: orgEntity } = await supabase
            .from('organizations')
            .select('email')
            .ilike('wallet_address', targetRecipientWallet)
            .maybeSingle();
          if (orgEntity?.email && orgEntity.email.includes('@')) {
            receiverEmail = orgEntity.email.trim();
          }
        }
      } catch (err) {
        console.warn('Could not query recipient entity email:', err);
      }
    }

    const walletsToLookup: string[] = [];
    if (!treasurerEmail && record.from_wallet) walletsToLookup.push(record.from_wallet.trim());
    if (!cosigner1Email && record.cosigner_1_name && record.cosigner_1_name !== 'none') walletsToLookup.push(record.cosigner_1_name.trim());
    if (!cosigner2Email && record.cosigner_2_name && record.cosigner_2_name !== 'none') walletsToLookup.push(record.cosigner_2_name.trim());

    if (walletsToLookup.length > 0) {
      try {
        const { data: members } = await supabase
          .from('organization_members')
          .select('wallet_address, full_name, email, org_name, gst_number')
          .or(`wallet_address.in.(${walletsToLookup.map(w => `"${w}"`).join(',')}),full_name.in.(${walletsToLookup.map(w => `"${w}"`).join(',')})`);

        if (members && members.length > 0) {
          members.forEach((m) => {
            const w = (m.wallet_address || '').trim().toUpperCase();
            const fn = (m.full_name || '').trim().toUpperCase();
            if (record.from_wallet && (w === record.from_wallet.trim().toUpperCase() || fn === record.from_wallet.trim().toUpperCase()) && m.email) {
              treasurerEmail = m.email.trim();
              if (!orgName && m.org_name) orgName = m.org_name;
              if (!gstNumber && m.gst_number) gstNumber = m.gst_number;
            }
            if (record.cosigner_1_name && (w === record.cosigner_1_name.trim().toUpperCase() || fn === record.cosigner_1_name.trim().toUpperCase()) && m.email) {
              cosigner1Email = m.email.trim();
            }
            if (record.cosigner_2_name && (w === record.cosigner_2_name.trim().toUpperCase() || fn === record.cosigner_2_name.trim().toUpperCase()) && m.email) {
              cosigner2Email = m.email.trim();
            }
          });
        }
      } catch (lookupErr) {
        console.warn('Could not query organization_members for emails:', lookupErr);
      }
    }

    return {
      treasurerEmail,
      receiverEmail,
      cosigner1Email,
      cosigner2Email,
      orgName: orgName || userOrgName || 'Stellar Sentinel Treasury',
      gstNumber: gstNumber || 'REGISTERED_CORP'
    };
  };

  const handleExecuteMatured = async (record: any, isDisbursementPath: boolean) => {
    try {
      setProcessingId(record.intent_id);
      const onChainId = ContractClient.decodeOnChainId(record.intent_id);
      const token = resolveTokenByAddress(record.asset_address);

      const txHash = await ContractClient.executeIntent(currentWallet, onChainId);
      const resolved = await resolveIntentEmails(record);

      if (isDisbursementPath) {
        await supabase
          .from('transactions_testnet')
          .update({
            status: 'executed',
            tx_hash: txHash,
            note: `Settled & Disbursed on-chain. Tx: ${txHash.slice(0, 12)}...`
          })
          .eq('intent_id', record.intent_id);

        await AppsScriptService.notifySettlementInvoice({
          intent_id: record.intent_id,
          total_amount: record.total_amount,
          asset_symbol: token.symbol,
          recipient: record.to_wallet || record.recipient,
          tx_hash: txHash,
          org_name: resolved.orgName,
          gst_number: resolved.gstNumber,
          sender_email: resolved.treasurerEmail,
          treasurer_email: resolved.treasurerEmail,
          receiver_email: resolved.receiverEmail,
          cosigner_1_email: resolved.cosigner1Email,
          cosigner_2_email: resolved.cosigner2Email,
          note: record.note || record.description
        });

        alert(`Intent #${record.intent_id} successfully settled and disbursed to ${record.to_wallet}!`);
      } else {
        const refundReason = 'Observation timelock expired without required co-signer approval';
        
        await supabase
          .from('transactions_testnet')
          .update({
            status: 'cancelled',
            tx_hash: txHash,
            note: `Auto-refunded to treasury: ${refundReason}. Tx: ${txHash.slice(0, 12)}...`
          })
          .eq('intent_id', record.intent_id);

        await AppsScriptService.notifyAnomalyRefund({
          intent_id: String(record.intent_id),
          total_amount: record.total_amount,
          asset_symbol: token.symbol,
          sender_email: resolved.treasurerEmail,
          treasurer_email: resolved.treasurerEmail,
          cosigner_1_email: resolved.cosigner1Email,
          reason: refundReason
        });

        alert(`Intent #${record.intent_id} expired without required signatures. Contract auto-refunded ${record.total_amount} ${token.symbol} back to treasury!`);
      }

      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Execution failed on-chain.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGuardianResolution = async (rawIntentId: number, dismissChallenge: boolean, record: any) => {
    try {
      setProcessingId(rawIntentId);
      const onChainId = ContractClient.decodeOnChainId(rawIntentId);

      if (!dismissChallenge) {
        await ContractClient.cancelIntent(currentWallet, onChainId);
      }

      const newStatus = dismissChallenge ? 'observing' : 'cancelled';
      const noteMsg = dismissChallenge 
        ? `Challenge dismissed (${currentWallet.slice(0, 6)}...). Returned to observation.` 
        : `Anomaly confirmed (${currentWallet.slice(0, 6)}...). Refunded to sender.`;

      const { error } = await supabase
        .from('transactions_testnet')
        .update({ 
          status: newStatus,
          note: noteMsg
        })
        .eq('intent_id', rawIntentId);

      if (error) throw error;

      if (!dismissChallenge) {
        const token = resolveTokenByAddress(record.asset_address);
        const resolved = await resolveIntentEmails(record);

        await AppsScriptService.notifyAnomalyRefund({
          intent_id: String(rawIntentId),
          total_amount: record.total_amount,
          asset_symbol: token.symbol,
          sender_email: resolved.treasurerEmail,
          treasurer_email: resolved.treasurerEmail,
          cosigner_1_email: resolved.cosigner1Email,
          reason: 'Anomaly confirmed by Guardian. Escrow funds refunded to treasury.'
        });
      }

      alert(`Intent #${rawIntentId} challenge resolved: ${dismissChallenge ? 'Dismissed & Resumed' : 'Confirmed & Cancelled'}.`);
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSignerVote = async (record: any, decision: 'approved' | 'rejected') => {
    try {
      setProcessingId(record.intent_id);
      const onChainId = ContractClient.decodeOnChainId(record.intent_id);

      if (decision === 'approved') {
        await ContractClient.approveIntent(currentWallet, onChainId, false);

        const signedTag = `[SIGNED:${currentWallet.trim()}]`;
        const existingNote = record.note || '';
        const updatedNote = existingNote.includes(signedTag)
          ? existingNote
          : `${existingNote} ${signedTag}`.trim();

        // When approved by co-signer, directly restore status to 'observing'
        await supabase
          .from('transactions_testnet')
          .update({
            status: 'observing',
            note: updatedNote
          })
          .eq('intent_id', record.intent_id);

        alert(`Intent #${record.intent_id} approved on-chain!`);
      } else {
        const reason = cancelReasons[record.intent_id]?.trim() || 'Declined by co-signer';
        await ContractClient.cancelIntent(currentWallet, onChainId);
        
        await supabase
          .from('transactions_testnet')
          .update({ 
            status: 'cancelled', 
            note: `Cancelled by signer (${currentWallet.slice(0, 6)}...): ${reason}` 
          })
          .eq('intent_id', record.intent_id);

        const token = resolveTokenByAddress(record.asset_address);
        const resolved = await resolveIntentEmails(record);

        await AppsScriptService.notifyAnomalyRefund({
          intent_id: String(record.intent_id),
          total_amount: record.total_amount,
          asset_symbol: token.symbol,
          sender_email: resolved.treasurerEmail,
          treasurer_email: resolved.treasurerEmail,
          cosigner_1_email: resolved.cosigner1Email,
          reason: `Rejected by co-signer: ${reason}`
        });

        alert(`Intent #${record.intent_id} cancelled and refunded on-chain.`);
      }
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Action failed';
      alert(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const formatAddress = (addr?: string) => {
    if (!addr || addr === 'none') return 'None';
    if (addr.startsWith('G') && addr.length >= 12) {
      return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
    }
    return addr;
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-[#232938] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-stellar-yellow" />
            LIVE ONGOING &amp; SECURITY QUEUE
          </h1>
          <p className="text-stellar-muted text-[11px] mt-1">
            Active observation timelocks, multisig consensus validation, and ML anomaly challenges for <span className="text-white font-bold">{userOrgName || 'Your Organization'}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 border border-[#232938] text-stellar-yellow hover:border-stellar-yellow btn-polygon flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> REFRESH QUEUE
        </button>
      </div>

      {activeItems.length === 0 ? (
        <div className="bg-[#121620] border border-[#232938] p-12 text-center text-stellar-muted card-polygon">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-white font-bold text-sm mb-1">Queue Empty</p>
          <p className="text-[11px]">No active disbursements found in observation or awaiting multi-sig consensus for {userOrgName || 'this organization'}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeItems.map((item: any) => {
            const statusStr = (item.status || '').toString().toLowerCase();
            const isQuarantined = statusStr === 'quarantined';
            const delaySecs = parseDelaySeconds(item.description || item.note);
            const targetDate = calculateTargetTime(item.created_at, delaySecs, item.intent_id);
            const isMatured = new Date().getTime() >= targetDate.getTime();

            const onChainDisplayId = ContractClient.decodeOnChainId(item.intent_id);
            const token = resolveTokenByAddress(item.asset_address);

            const recipientWallet = item.to_wallet || item.recipient || 'none';
            const cosigner1 = (item.cosigner_1_name || 'none').trim();
            const cosigner2 = (item.cosigner_2_name || 'none').trim();
            const numericAmount = parseFloat(item.total_amount || 0);

            const hasDesignatedCosigners = 
              (cosigner1 !== 'none' && cosigner1 !== '') || 
              (cosigner2 !== 'none' && cosigner2 !== '');

            const isNativeXlm = token.symbol === 'XLM';
            const isHighValueNative = isNativeXlm && numericAmount > 10000;

            const normalizedCurrentWallet = (currentWallet || '').trim().toUpperCase();

            // Bidirectional resolution: Full Name <-> Wallet
            const c1ResolvedWallet = memberDirectory[cosigner1.toUpperCase()] || cosigner1.toUpperCase();
            const c2ResolvedWallet = memberDirectory[cosigner2.toUpperCase()] || cosigner2.toUpperCase();

            // Explicit assignment match
            const isAssignedCosigner = 
              (cosigner1 !== 'none' && (cosigner1.toUpperCase() === normalizedCurrentWallet || c1ResolvedWallet === normalizedCurrentWallet)) ||
              (cosigner2 !== 'none' && (cosigner2.toUpperCase() === normalizedCurrentWallet || c2ResolvedWallet === normalizedCurrentWallet)) ||
              (item.cosigner_1_wallet && item.cosigner_1_wallet.trim().toUpperCase() === normalizedCurrentWallet) ||
              (item.cosigner_2_wallet && item.cosigner_2_wallet.trim().toUpperCase() === normalizedCurrentWallet);

            const hasCurrentWalletSigned = isWalletSigned(currentWallet, item.note, item.description);
            const hasCosigner1Signed = isWalletSigned(cosigner1, item.note, item.description) || isWalletSigned(c1ResolvedWallet, item.note, item.description);
            const hasCosigner2Signed = isWalletSigned(cosigner2, item.note, item.description) || isWalletSigned(c2ResolvedWallet, item.note, item.description);

            // Determine if quorum criteria for disbursement are satisfied
            const isCosignerRequirementMet = 
              (!hasDesignatedCosigners) ||
              ((cosigner1 === 'none' || hasCosigner1Signed) && (cosigner2 === 'none' || hasCosigner2Signed));

            const isCreator = (item.from_wallet || '').trim().toUpperCase() === normalizedCurrentWallet;
            const isOwnerOrAdmin = userRole?.toLowerCase() === 'owner' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'treasurer';
            
            // Available to execute if matured and caller is Creator, Admin, or Signer
            const canTriggerMaturedAction = isMatured && !isQuarantined && (isCreator || isOwnerOrAdmin || isAssignedCosigner);

            // Cancel action is ONLY allowed BEFORE maturity
            const canCancelBeforeMaturity = !isMatured && (isCreator || isAssignedCosigner || isOwnerOrAdmin);

            return (
              <div
                key={item.id || item.intent_id}
                className={`bg-[#121620] border p-5 card-polygon space-y-4 ${
                  isQuarantined 
                    ? 'border-red-800/80 bg-red-950/10' 
                    : isMatured 
                    ? isCosignerRequirementMet
                      ? 'border-emerald-600/50 bg-[#121a16]'
                      : 'border-amber-600/50 bg-[#1a1612]'
                    : 'border-[#232938]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232938] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-stellar-yellow font-bold text-sm">
                      INTENT #{item.intent_id}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      (On-Chain Index #{onChainDisplayId})
                    </span>
                    <StatusBadge status={item.status} />
                    {isHighValueNative && (
                      <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-amber-950/60 border border-amber-500/40 rounded">
                        MANDATORY 2-OF-2 MULTISIG (&gt;10k XLM)
                      </span>
                    )}
                    {isMatured && !isQuarantined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isCosignerRequirementMet 
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' 
                          : 'text-amber-400 bg-amber-950/60 border-amber-500/40'
                      }`}>
                        {isCosignerRequirementMet ? 'TIMELOCK MATURED • READY TO DISBURSE' : 'TIMELOCK MATURED • CO-SIGNER MISSING (AUTO-REFUND)'}
                      </span>
                    )}
                    {isQuarantined && (
                      <span className="text-[10px] text-red-400 font-bold px-2 py-0.5 bg-red-950/60 border border-red-800 rounded flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> QUARANTINED BY ML
                      </span>
                    )}
                  </div>
                  <div className="text-stellar-muted text-[11px]">
                    Created: <span className="text-white">{item.created_at ? new Date(item.created_at).toLocaleString() : new Date(ContractClient.decodeTimestamp(item.intent_id) * 1000).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0B0D13] p-3 border border-[#232938]">
                  <div>
                    <span className="text-stellar-muted text-[10px] block">Amount Escrowed</span>
                    <span className="text-white font-bold text-sm">
                      {numericAmount.toFixed(2)}{' '}
                      <span className="text-stellar-yellow text-xs">{token.symbol}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-stellar-muted text-[10px] block">Recipient Address</span>
                    <span className="text-stellar-yellow flex items-center gap-1">
                      {formatAddress(recipientWallet)}
                      {recipientWallet !== 'none' && recipientWallet.startsWith('G') && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${recipientWallet}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stellar-muted hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-stellar-muted text-[10px] block">Observation Delay</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(delaySecs / 60)} Minutes ({delaySecs}s)
                    </span>
                  </div>
                  <div>
                    <span className="text-stellar-muted text-[10px] block">Target Release / Refund</span>
                    <span className={`font-bold ${isMatured ? (isCosignerRequirementMet ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-300'}`}>
                      {targetDate.toLocaleTimeString()} {isMatured ? '(Matured)' : ''}
                    </span>
                  </div>
                </div>

                {hasDesignatedCosigners && (
                  <div className="bg-[#07090E] p-3 border border-[#232938] space-y-2">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-stellar-yellow" />
                      <span>Multi-Signature Quorum Status:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cosigner1 !== 'none' && cosigner1 !== '' && (
                        <div className="flex items-center justify-between bg-[#0B0D13] p-2 border border-[#1b212f]">
                          <span className="text-stellar-muted truncate">
                            Co-Signer 1: <strong className={c1ResolvedWallet === normalizedCurrentWallet ? 'text-stellar-yellow' : 'text-white'}>{memberDirectory[cosigner1.toUpperCase()] || formatAddress(cosigner1)} {c1ResolvedWallet === normalizedCurrentWallet ? '(YOU)' : ''}</strong>
                          </span>
                          {hasCosigner1Signed ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40 rounded shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> APPROVED
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 border border-amber-500/40 rounded shrink-0">
                              AWAITING SIGNATURE
                            </span>
                          )}
                        </div>
                      )}

                      {cosigner2 !== 'none' && cosigner2 !== '' && (
                        <div className="flex items-center justify-between bg-[#0B0D13] p-2 border border-[#1b212f]">
                          <span className="text-stellar-muted truncate">
                            Co-Signer 2: <strong className={c2ResolvedWallet === normalizedCurrentWallet ? 'text-stellar-yellow' : 'text-white'}>{memberDirectory[cosigner2.toUpperCase()] || formatAddress(cosigner2)} {c2ResolvedWallet === normalizedCurrentWallet ? '(YOU)' : ''}</strong>
                          </span>
                          {hasCosigner2Signed ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/40 rounded shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> APPROVED
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 border border-amber-500/40 rounded shrink-0">
                              AWAITING SIGNATURE
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-[#0B0D13]/60 border border-[#232938] p-3 text-[11px] space-y-1">
                  <div className="text-stellar-muted uppercase text-[10px]">Reference / Reason:</div>
                  <div className="text-zinc-300">{item.note || item.description || 'No additional memo.'}</div>
                </div>

                {canCancelBeforeMaturity && (
                  <div>
                    <input
                      type="text"
                      placeholder="Cancellation / rejection reason..."
                      value={cancelReasons[item.intent_id] || ''}
                      onChange={(e) => setCancelReasons({ ...cancelReasons, [item.intent_id]: e.target.value })}
                      className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-1.5 text-white text-xs outline-none focus:border-stellar-yellow"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {/* ONCE MATURED: ONLY show Settle/Disburse or Process Refund. CANCEL is suppressed. */}
                  {canTriggerMaturedAction && (
                    <button
                      type="button"
                      disabled={processingId === item.intent_id}
                      onClick={() => handleExecuteMatured(item, isCosignerRequirementMet)}
                      className={`px-5 py-2 font-bold btn-polygon flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg ${
                        isCosignerRequirementMet
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-600/20'
                      }`}
                    >
                      {processingId === item.intent_id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>PROCESSING ON-CHAIN...</span>
                        </>
                      ) : isCosignerRequirementMet ? (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>SETTLE &amp; DISBURSE NOW</span>
                        </>
                      ) : (
                        <>
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>PROCESS MATURED REFUND NOW</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* CANCEL BUTTON: Strictly visible BEFORE maturation */}
                  {canCancelBeforeMaturity && (
                    <button
                      type="button"
                      disabled={processingId === item.intent_id}
                      onClick={() => handleSignerVote(item, 'rejected')}
                      className="px-4 py-2 bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 btn-polygon flex items-center gap-1.5 font-bold disabled:opacity-50 cursor-pointer"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      {processingId === item.intent_id ? 'CANCELLING...' : isQuarantined ? 'CONFIRM ANOMALY & REFUND' : 'CANCEL & REFUND'}
                    </button>
                  )}

                  {/* Guardian Dismissal: Quarantined intents */}
                  {isQuarantined && (isCreator || isOwnerOrAdmin) && (
                    <button
                      type="button"
                      disabled={processingId === item.intent_id}
                      onClick={() => handleGuardianResolution(item.intent_id, true, item)}
                      className="px-4 py-2 border border-stellar-yellow text-stellar-yellow hover:bg-stellar-yellow/10 font-bold btn-polygon flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {processingId === item.intent_id ? 'RESUMING...' : 'DISMISS CHALLENGE & RESUME'}
                    </button>
                  )}

                  {/* Co-Signer Approval: Stays active whenever this signer is assigned and has not yet signed */}
                  {isAssignedCosigner && (
                    hasCurrentWalletSigned ? (
                      <div className="px-4 py-2 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 font-bold flex items-center gap-1.5 rounded">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>SIGNED ON-CHAIN BY YOU</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={processingId === item.intent_id}
                        onClick={() => handleSignerVote(item, 'approved')}
                        className="px-5 py-2 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {processingId === item.intent_id ? 'SIGNING...' : isQuarantined ? 'OVERRIDE QUARANTINE & SIGN' : 'APPROVE & SIGN'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OngoingIntents;