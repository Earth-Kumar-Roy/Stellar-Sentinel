import React, { useState, useEffect, useId, useMemo } from 'react';
import { 
  Send, 
  AlertCircle, 
  BrainCircuit, 
  Lock, 
  Coins, 
  ChevronDown, 
  Clock, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Database,
  Cpu
} from 'lucide-react';
import { useRecipientOrg } from '../../hooks/useRecipientOrg';
import { RecipientOrgCard } from './RecipientOrgCard';
import { ContractClient } from '../../services/contractClient';
import { AppsScriptService } from '../../services/appsScript';
import { SUPPORTED_TOKENS, STELLAR_CONFIG } from '../../config/constants';
import { supabase } from '../../config/supabase';
import { runPythonRiskEvaluation, initPyodideEngine, isPyodideReady } from '../../services/pyodideScorer';
import type { OrgMember } from '../../types';

interface PaymentFormProps {
  senderWallet: string;
  senderName?: string;
  senderRole?: string;
  orgName?: string;
  assetAddress?: string;
  assetSymbol?: string;
  initialRecipient?: string;
  onSuccess: (intentId: number, txHash: string, symbol: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  senderWallet, 
  senderName,
  senderRole,
  orgName,
  assetAddress: initialAssetAddress,
  assetSymbol: initialAssetSymbol = 'XLM',
  initialRecipient = '',
  onSuccess 
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialAssetSymbol);
  const activeToken = SUPPORTED_TOKENS[selectedSymbol] || SUPPORTED_TOKENS.XLM;
  const currentAssetAddress = activeToken.contractId || initialAssetAddress || STELLAR_CONFIG.NATIVE_TOKEN;

  const [recipient, setRecipient] = useState<string>(initialRecipient || '');
  const [amount, setAmount] = useState<string>('');
  const [purposeNote, setPurposeNote] = useState<string>('');
  const [delayMinutes, setDelayMinutes] = useState<number>(3);

  const [companyOfficers, setCompanyOfficers] = useState<OrgMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(true);
  const [resolvedOrgName, setResolvedOrgName] = useState<string>(orgName || 'Enterprise Vault');
  const [treasurerEmail, setTreasurerEmail] = useState<string>('');

  const [selectedOfficer1, setSelectedOfficer1] = useState<string>('');
  const [selectedOfficer2, setSelectedOfficer2] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Engine pre-warming state
  const [isEngineReady, setIsEngineReady] = useState<boolean>(isPyodideReady());
  const [engineWarmupStage, setEngineWarmupStage] = useState<string>('Initializing Python WASM Runtime...');

  const [mlScore, setMlScore] = useState<number | null>(null);
  const [mlRationale, setMlRationale] = useState<string | null>(null);
  const [isHighRisk, setIsHighRisk] = useState<boolean>(false);
  const [isEvaluatingMl, setIsEvaluatingMl] = useState<boolean>(false);

  const recipientInputId = useId();
  const amountInputId = useId();
  const purposeInputId = useId();
  const delayInputId = useId();

  const { recipientOrg, isSearching, isValidAddress } = useRecipientOrg(recipient);

  useEffect(() => {
    setRecipient(initialRecipient || '');
  }, [initialRecipient]);

  // Pre-warm Pyodide WASM Runtime on load
  useEffect(() => {
    if (isPyodideReady()) {
      setIsEngineReady(true);
      return;
    }

    let isMounted = true;
    initPyodideEngine((stage) => {
      if (isMounted) setEngineWarmupStage(stage);
    })
      .then(() => {
        if (isMounted) setIsEngineReady(true);
      })
      .catch((err) => {
        console.warn('WASM background warmup warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const numericAmount = parseFloat(amount) || 0;
  const normalizedXlmAmount = useMemo(() => {
    const symbol = activeToken.symbol.toUpperCase();
    if (symbol === 'USDC') return numericAmount * 5.0;
    if (symbol === 'EURC') return numericAmount * 5.55;
    return numericAmount;
  }, [numericAmount, activeToken.symbol]);

  const isThreshold10k = normalizedXlmAmount > 10000;
  const isThreshold5k = normalizedXlmAmount > 5000;
  const isMlHighAnomaly = (mlScore ?? 0) >= 75;

  const requiredCoSigners: 0 | 1 | 2 = useMemo(() => {
    if (isThreshold10k) return 2;
    if (isThreshold5k || isMlHighAnomaly) return 1;
    return 0;
  }, [isThreshold10k, isThreshold5k, isMlHighAnomaly]);

  useEffect(() => {
    async function resolveOrgAndFetchOfficers() {
      setIsLoadingMembers(true);
      try {
        let targetOrg = orgName;

        if (senderWallet) {
          const { data: memberLookup } = await supabase
            .from('organization_members')
            .select('org_name, email, role')
            .ilike('wallet_address', senderWallet.trim())
            .maybeSingle();

          if (memberLookup) {
            if (!targetOrg || targetOrg.toLowerCase() === 'none') {
              targetOrg = memberLookup.org_name;
            }
            if (memberLookup.email && memberLookup.email.includes('@')) {
              setTreasurerEmail(memberLookup.email.trim());
            }
          }
        }

        if (!targetOrg || targetOrg.toLowerCase() === 'none') {
          targetOrg = 'Enterprise Vault';
        }

        setResolvedOrgName(targetOrg);

        const { data, error } = await supabase
          .from('organization_members')
          .select('*')
          .ilike('org_name', targetOrg.trim())
          .neq('status', 'rejected')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const members = (data as OrgMember[]) || [];
        const eligibleOfficers = members.filter((m) => {
          return m.wallet_address.trim().toUpperCase() !== senderWallet.trim().toUpperCase();
        });

        const selfMem = members.find(
          (m) => m.wallet_address.trim().toUpperCase() === senderWallet.trim().toUpperCase()
        );
        if (selfMem?.email && selfMem.email.includes('@')) {
          setTreasurerEmail(selfMem.email.trim());
        }

        setCompanyOfficers(eligibleOfficers);
      } catch (err) {
        console.error('Failed to resolve company officers:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    resolveOrgAndFetchOfficers();
  }, [orgName, senderWallet]);

  // Client-Side Pyodide Risk Scoring
  useEffect(() => {
    if (!isValidAddress || numericAmount <= 0) {
      setMlScore(null);
      setMlRationale(null);
      setIsHighRisk(false);
      setIsEvaluatingMl(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsEvaluatingMl(true);
        const data = await runPythonRiskEvaluation({
          intentId: 0,
          sender: senderWallet,
          recipient: recipient.trim(),
          amount: numericAmount,
          assetAddress: currentAssetAddress,
          dailyLimit: 50000.0,
          purposeHashHex: '',
          orgName: resolvedOrgName,
        });

        if (isMounted) {
          setMlScore(data.risk_score);
          setMlRationale(data.rationale);
          setIsHighRisk(data.should_challenge || data.risk_score >= 75);
          setIsEngineReady(true);
        }
      } catch (err) {
        console.warn('Pyodide inference execution error:', err);
      } finally {
        if (isMounted) {
          setIsEvaluatingMl(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [recipient, numericAmount, isValidAddress, senderWallet, currentAssetAddress, resolvedOrgName]);

  const getMemberByWallet = (addr: string) => {
    if (!addr) return undefined;
    return companyOfficers.find((m) => m.wallet_address.trim().toUpperCase() === addr.trim().toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidAddress) {
      setErrorMessage('A valid 56-character Stellar address (G...) is required for the recipient.');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMessage('Transfer amount must be greater than 0.');
      return;
    }

    if (!purposeNote.trim()) {
      setErrorMessage('A purpose/reference note is mandatory to generate on-chain reference hash.');
      return;
    }

    if (delayMinutes < 3 || delayMinutes > 720) {
      setErrorMessage('Observation delay must be configured between 3 minutes and 720 minutes (12 hours).');
      return;
    }

    if (requiredCoSigners === 2) {
      if (!selectedOfficer1 || !selectedOfficer2) {
        setErrorMessage('This transaction mandates 2 designated Co-Signers.');
        return;
      }
      if (selectedOfficer1.trim().toUpperCase() === selectedOfficer2.trim().toUpperCase()) {
        setErrorMessage('Co-Signer 1 and Co-Signer 2 must be different company officers.');
        return;
      }
    } else if (requiredCoSigners === 1) {
      if (!selectedOfficer1) {
        setErrorMessage('This transaction mandates 1 designated Co-Signer.');
        return;
      }
    }

    const effectiveCosigner1 = requiredCoSigners >= 1 ? selectedOfficer1.trim() : '';
    const effectiveCosigner2 = requiredCoSigners === 2 ? selectedOfficer2.trim() : '';

    const officer1Data = getMemberByWallet(effectiveCosigner1);
    const officer2Data = getMemberByWallet(effectiveCosigner2);

    try {
      setIsSubmitting(true);

      let activeTreasurerEmail = treasurerEmail;
      if (!activeTreasurerEmail || !activeTreasurerEmail.includes('@')) {
        const { data: directMem } = await supabase
          .from('organization_members')
          .select('email')
          .ilike('wallet_address', senderWallet.trim())
          .maybeSingle();

        if (directMem?.email && directMem.email.includes('@')) {
          activeTreasurerEmail = directMem.email.trim();
          setTreasurerEmail(activeTreasurerEmail);
        }
      }

      setSubmitStage('Submitting transaction to Soroban smart contract escrow...');
      const amountStroops = BigInt(Math.floor(numericAmount * 10_000_000));
      const observationDelaySeconds = delayMinutes * 60;
      const encodedMemo = `[DELAY:${observationDelaySeconds}] ${purposeNote.trim()}`;

      // Submit on-chain with exact public keys
      const { intentId, txHash } = await ContractClient.createIntent({
        caller: senderWallet,
        recipient: recipient.trim(),
        cosigner1: effectiveCosigner1 || null,
        cosigner2: effectiveCosigner2 || null,
        guardian: (requiredCoSigners === 2 && effectiveCosigner2) ? effectiveCosigner2 : null,
        asset: currentAssetAddress,
        amountStroops,
        purposeNote: encodedMemo,
        observationDelaySeconds,
        orgName: resolvedOrgName,
        senderName: senderName || 'Treasurer',
        senderRole: senderRole || 'Treasurer',
      });

      setSubmitStage('Appending Intent & Signatures in Database...');
      if (intentId !== undefined && intentId !== null) {
        const recipientEntityEmail = (recipientOrg as any)?.email || (recipientOrg as any)?.contact_email || 'none';

        // Direct upfront status assignment: quarantined if risk >= 75, else observing
        const initialStatus = isHighRisk ? 'quarantined' : 'observing';
        const initialNote = isHighRisk 
          ? `[QUARANTINED] ML Score: ${(mlScore || 78).toFixed(2)} | ${mlRationale || 'Anomaly challenge triggered'} | ${encodedMemo}`
          : (mlScore !== null 
              ? `ML Risk Score: ${mlScore.toFixed(2)}/100 | ${mlRationale || 'Approved baseline flow'} | ${encodedMemo}` 
              : encodedMemo);

        await supabase
          .from('transactions_testnet')
          .update({
            status: initialStatus,
            note: initialNote,
            sender_email: activeTreasurerEmail || 'none',
            receiver_email: recipientEntityEmail,
            cosigner_1_name: effectiveCosigner1 || 'none',
            cosigner_1_role: officer1Data?.role || (effectiveCosigner1 ? 'Signer' : 'none'),
            cosigner_1_email: officer1Data?.email || 'none',
            cosigner_2_name: effectiveCosigner2 || 'none',
            cosigner_2_role: officer2Data?.role || (effectiveCosigner2 ? 'Signer' : 'none'),
            cosigner_2_email: officer2Data?.email || 'none',
          })
          .eq('intent_id', intentId);
      }

      setSubmitStage('Emailing Intent notification to Treasurer & Signatories...');
      try {
        if (activeTreasurerEmail && activeTreasurerEmail.includes('@')) {
          await AppsScriptService.notifyIntentCreated({
            intent_id: String(intentId),
            total_amount: numericAmount,
            asset_symbol: activeToken.symbol,
            recipient: recipient.trim(),
            treasurer_email: activeTreasurerEmail,
            sender_email: activeTreasurerEmail,
            delay_minutes: delayMinutes,
            ml_score: mlScore,
            note: purposeNote.trim()
          });
        }

        const c1Email = officer1Data?.email;
        const c2Email = officer2Data?.email;

        if (requiredCoSigners > 0 && ((c1Email && c1Email.includes('@')) || (c2Email && c2Email.includes('@')))) {
          await AppsScriptService.notifyCosignerMandate({
            intent_id: String(intentId),
            total_amount: numericAmount,
            asset_symbol: activeToken.symbol,
            recipient: recipient.trim(),
            org_name: resolvedOrgName,
            cosigner_1_email: c1Email,
            cosigner_2_email: c2Email,
            ml_score: mlScore,
            reason: isMlHighAnomaly ? 'ML Sentinel Risk Score >= 75' : 'Volume Threshold Exceeded'
          });
        }
      } catch (mailErr) {
        console.warn('Apps Script notification warning:', mailErr);
      }

      if (typeof onSuccess === 'function') {
        onSuccess(Number(intentId), txHash, activeToken.symbol);
      }

      setRecipient('');
      setAmount('');
      setPurposeNote('');
      setSelectedOfficer1('');
      setSelectedOfficer2('');
      setMlScore(null);
      setMlRationale(null);
    } catch (err: unknown) {
      console.error(err);
      let msg = err instanceof Error ? err.message : 'Failed to commit payment intent on-chain.';
      if (msg.includes('Error(Contract, #16)') || msg.includes('CosignerRequired')) {
        msg = '[Error #16: CosignerRequired] Disbursements exceeding risk limits require co-signers.';
      } else if (msg.includes('Error(Contract, #20)') || msg.includes('AmountExceedsPerTxLimit')) {
        msg = '[Error #20: AmountExceedsPerTxLimit] Amount exceeds maximum protocol limits.';
      } else if (msg.includes('Error(Contract, #12)') || msg.includes('InvalidIntentParameters')) {
        msg = '[Error #12: InvalidIntentParameters] Timelock delay must be configured between 3 minutes and 12 hours.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      setSubmitStage('');
    }
  };

  const selectedOfficer1Obj = getMemberByWallet(selectedOfficer1);
  const selectedOfficer2Obj = getMemberByWallet(selectedOfficer2);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
      {!isEngineReady && (
        <div className="bg-[#0B0E17] border border-stellar-yellow/40 p-3 card-polygon flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5 text-stellar-yellow text-[11px]">
            <Cpu className="w-4 h-4 animate-spin text-stellar-yellow shrink-0" />
            <span>
              <strong className="uppercase tracking-wider">Client ML Runtime:</strong> {engineWarmupStage}
            </span>
          </div>
          <span className="text-[10px] text-stellar-muted font-sans hidden sm:inline">
            One-time load (~30s). Subsequent checks are instant.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/40 border border-red-700/80 p-3.5 text-red-300 flex items-start gap-2.5 card-polygon animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {isSubmitting && (
        <div className="bg-[#121620] border border-stellar-yellow p-4 card-polygon space-y-2">
          <div className="flex items-center gap-2 text-stellar-yellow font-bold text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="uppercase tracking-wider">Disbursement Pipeline in Progress</span>
          </div>
          <div className="text-white text-[11px] font-semibold">
            {submitStage}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-stellar-muted">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-stellar-yellow" /> 1. Soroban Contract
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 2. Database Sync
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-stellar-yellow" /> 3. Email Dispatch
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 bg-stellar-yellow/10 border border-stellar-yellow/30 text-[11px] text-stellar-yellow card-polygon">
        <Lock className="w-4 h-4 shrink-0" />
        <span>Funds are held in on-chain non-custodial escrow during observation. Cancelled intents auto-refund to your wallet.</span>
      </div>

      <div>
        <label className="block text-stellar-muted uppercase mb-1.5 flex items-center gap-1.5 text-[10px] tracking-wider">
          <Coins className="w-3.5 h-3.5 text-stellar-yellow" />
          1. Settlement Currency
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(SUPPORTED_TOKENS).map((token) => {
            const isSelected = selectedSymbol === token.symbol;
            return (
              <button
                key={token.symbol}
                type="button"
                onClick={() => setSelectedSymbol(token.symbol)}
                className={`p-3 border text-left btn-polygon transition-all cursor-pointer ${
                  isSelected
                    ? 'border-stellar-yellow bg-stellar-yellow/15 text-white ring-1 ring-stellar-yellow shadow-lg'
                    : 'border-[#232938] bg-[#0B0D13] text-stellar-muted hover:border-zinc-500 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm tracking-wide text-white">{token.symbol}</span>
                  {token.isNative ? (
                    <span className="text-[9px] text-amber-400 bg-amber-950/80 px-1 py-0.5 border border-amber-600/40 font-bold">
                      NATIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1 py-0.5 border border-emerald-600/40 font-bold">
                      STABLE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stellar-muted truncate mt-1">{token.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={recipientInputId} className="block text-stellar-muted uppercase mb-1 text-[10px] tracking-wider">
          2. Counterparty Stellar Public Key
        </label>
        <input
          id={recipientInputId}
          type="text"
          required
          maxLength={56}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          placeholder="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
          className="w-full bg-[#0B0D13] border border-[#232938] px-3.5 py-2.5 text-white focus:border-stellar-yellow outline-none text-xs font-mono"
        />
      </div>

      <RecipientOrgCard
        org={recipientOrg}
        isSearching={isSearching}
        isValidAddress={isValidAddress}
        address={recipient}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={amountInputId} className="block text-stellar-muted uppercase mb-1 text-[10px] tracking-wider flex items-center justify-between">
            <span>Disbursement Amount ({activeToken.symbol})</span>
            {numericAmount > 0 && (
              <span className="text-stellar-yellow text-[10px] font-bold">
                ≈ {normalizedXlmAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM EQ
              </span>
            )}
          </label>
          <div className="relative">
            <input
              id={amountInputId}
              type="number"
              step="0.0000001"
              min="0.0000001"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.00"
              className="w-full bg-[#0B0D13] border border-[#232938] px-3.5 py-2.5 text-white focus:border-stellar-yellow outline-none text-base font-bold font-mono"
            />
            <div className="absolute right-3 top-2.5 text-xs text-stellar-yellow font-bold uppercase pointer-events-none">
              {activeToken.symbol}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor={delayInputId} className="block text-stellar-muted uppercase mb-1 text-[10px] tracking-wider flex items-center justify-between">
            <span>Observation Time-Lock (Minutes)</span>
            <span className="text-stellar-yellow font-bold">
              {delayMinutes}m ({(delayMinutes / 60).toFixed(1)}h)
            </span>
          </label>
          <div className="relative">
            <input
              id={delayInputId}
              type="number"
              min="3"
              max="720"
              required
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 3)}
              placeholder="3"
              className="w-full bg-[#0B0D13] border border-[#232938] px-3.5 py-2.5 text-white focus:border-stellar-yellow outline-none text-base font-bold font-mono"
            />
            <div className="absolute right-3 top-2.5 text-xs text-stellar-muted font-bold pointer-events-none">
              MINS
            </div>
          </div>
          <span className="text-[10px] text-stellar-muted mt-1 block">
            Min 3 minutes (Test Window) — Max 720 minutes (12 Hours)
          </span>
        </div>
      </div>

      {(mlScore !== null || isEvaluatingMl) && (
        <div className={`p-4 border card-polygon transition-all ${
          isHighRisk 
            ? 'bg-red-950/40 border-red-500 text-red-200' 
            : 'bg-[#121620] border-[#232938] text-stellar-muted'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <BrainCircuit className={`w-4 h-4 ${isHighRisk ? 'text-red-400' : 'text-stellar-yellow'}`} />
              <span className="text-white uppercase tracking-wider">ML Sentinel Autonomous Risk Scorer</span>
            </div>
            {isEvaluatingMl ? (
              <span className="text-[10px] text-stellar-yellow animate-pulse flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" /> Evaluating Telemetry...
              </span>
            ) : (
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                isHighRisk 
                  ? 'bg-red-900/60 border-red-500 text-white' 
                  : 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
              }`}>
                {mlScore?.toFixed(1)} / 100
              </span>
            )}
          </div>
          {mlRationale && <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{mlRationale}</p>}
        </div>
      )}

      {requiredCoSigners > 0 && (
        <div className="p-4 bg-[#0B0D13] border border-amber-500/50 card-polygon space-y-4">
          <div className="text-amber-400 font-bold uppercase text-xs flex items-center justify-between border-b border-[#232938] pb-2">
            <span>
              {requiredCoSigners === 2 
                ? 'Mandatory 2 Co-Signers Appointed' 
                : 'Mandatory 1 Co-Signer Appointed'}
            </span>
            <span className="text-[10px] text-stellar-muted font-normal">
              {isMlHighAnomaly ? 'High Risk Score (>= 75)' : 'High Volume Threshold'}
            </span>
          </div>

          {isLoadingMembers ? (
            <div className="p-3 text-center text-stellar-yellow text-[11px] animate-pulse">
              Querying active organization roster from Supabase...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] text-stellar-muted uppercase mb-1">
                  Designated Co-Signer 1 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedOfficer1}
                    required
                    onChange={(e) => setSelectedOfficer1(e.target.value)}
                    className="w-full bg-[#121620] border border-[#232938] px-3 py-2.5 text-white text-xs outline-none focus:border-stellar-yellow appearance-none cursor-pointer pr-8 font-mono"
                  >
                    <option value="">-- Select Officer from {resolvedOrgName} --</option>
                    {companyOfficers.map((m) => (
                      <option key={m.id} value={m.wallet_address}>
                        {m.full_name} ({m.role}) — {m.wallet_address}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stellar-muted absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {selectedOfficer1 && (
                  <div className="mt-2 p-3 bg-[#05070A] border border-[#1e2536] text-[11px] rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">
                        {selectedOfficer1Obj?.full_name} <span className="text-stellar-yellow text-[10px]">({selectedOfficer1Obj?.role})</span>
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${selectedOfficer1}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stellar-yellow hover:underline inline-flex items-center gap-1 text-[10px]"
                      >
                        <span>Stellar Expert</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-stellar-muted text-[10px] uppercase font-bold">Full Officer Public Key:</div>
                    <div className="text-stellar-yellow font-mono text-[11px] break-all select-all bg-[#0B0D13] p-2 border border-[#1b212f] rounded">
                      {selectedOfficer1}
                    </div>
                  </div>
                )}
              </div>

              {requiredCoSigners === 2 && (
                <div className="space-y-1.5 pt-2 border-t border-[#1b212f]">
                  <label className="block text-[10px] text-stellar-muted uppercase mb-1">
                    Designated Co-Signer 2 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOfficer2}
                      required
                      onChange={(e) => setSelectedOfficer2(e.target.value)}
                      className="w-full bg-[#121620] border border-[#232938] px-3 py-2.5 text-white text-xs outline-none focus:border-stellar-yellow appearance-none cursor-pointer pr-8 font-mono"
                    >
                      <option value="">-- Select Second Officer from {resolvedOrgName} --</option>
                      {companyOfficers
                        .filter((m) => m.wallet_address.trim().toUpperCase() !== selectedOfficer1.trim().toUpperCase())
                        .map((m) => (
                          <option key={m.id} value={m.wallet_address}>
                            {m.full_name} ({m.role}) — {m.wallet_address}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stellar-muted absolute right-2.5 top-3 pointer-events-none" />
                  </div>

                  {selectedOfficer2 && (
                    <div className="mt-2 p-3 bg-[#05070A] border border-[#1e2536] text-[11px] rounded space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">
                          {selectedOfficer2Obj?.full_name} <span className="text-stellar-yellow text-[10px]">({selectedOfficer2Obj?.role})</span>
                        </span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${selectedOfficer2}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stellar-yellow hover:underline inline-flex items-center gap-1 text-[10px]"
                        >
                          <span>Stellar Expert</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-stellar-muted text-[10px] uppercase font-bold">Full Officer Public Key:</div>
                      <div className="text-stellar-yellow font-mono text-[11px] break-all select-all bg-[#0B0D13] p-2 border border-[#1b212f] rounded">
                        {selectedOfficer2}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor={purposeInputId} className="block text-stellar-muted uppercase mb-1 text-[10px] tracking-wider">
          3. Purpose / Transaction Audit Reference (On-Chain Memo)
        </label>
        <input
          id={purposeInputId}
          type="text"
          required
          value={purposeNote}
          onChange={(e) => setPurposeNote(e.target.value)}
          placeholder="e.g., Vendor disbursement for infrastructure audit"
          className="w-full bg-[#0B0D13] border border-[#232938] px-3.5 py-2.5 text-white focus:border-stellar-yellow outline-none text-xs"
        />
      </div>

      <div className="bg-[#0B0D13] border border-[#232938] p-4 card-polygon space-y-2">
        <div className="flex items-center justify-between text-stellar-muted">
          <span>Observation Window:</span>
          <span className="text-stellar-yellow font-bold font-mono">
            {delayMinutes} Minutes ({(delayMinutes / 60).toFixed(1)} Hours)
          </span>
        </div>
        <div className="flex items-center justify-between text-stellar-muted">
          <span>Normalized Exposure:</span>
          <span className="text-zinc-300 font-mono">
            {normalizedXlmAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM Equivalent
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isValidAddress || numericAmount <= 0}
        className={`w-full py-3.5 font-bold text-xs tracking-wider flex items-center justify-center gap-2 btn-polygon transition-all cursor-pointer ${
          isHighRisk 
            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/50 shadow-lg' 
            : 'bg-stellar-yellow hover:bg-stellar-gold text-black shadow-lg shadow-stellar-yellow/10'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Send className="w-4 h-4" />
        {isSubmitting 
          ? (submitStage || 'PROCESSING TRANSACTION PIPELINE...') 
          : isHighRisk 
            ? 'SUBMIT QUARANTINED INTENT' 
            : `LOCK ESCROW & DISBURSE ${activeToken.symbol}`}
      </button>
    </form>
  );
};

export default PaymentForm;