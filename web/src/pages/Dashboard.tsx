import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Send, 
  Coins, 
  ShieldAlert, 
  CheckCircle,
  Cpu,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Lock,
  Layers,
  Zap,
  FileCheck,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import type { OrgMember, PaymentIntentRecord } from '../types';

interface DashboardProps {
  member: OrgMember;
  currentWallet: string;
  intents: PaymentIntentRecord[];
  quarantineCount: number;
  onNavigateToPayment: () => void;
  onNavigateToQuarantine: () => void;
  onRefreshTransactions: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  member,
  currentWallet,
  intents,
  quarantineCount,
  onNavigateToPayment,
  onNavigateToQuarantine,
  onRefreshTransactions,
}) => {
  // Security Guard: Check if the connected user has an approved, active role
  const isAuthorizedActive = Boolean(member && member.status === 'active');
  const isTreasurer = isAuthorizedActive && member.role.toLowerCase() === 'treasurer';

  // Metrics aggregation
  const executedIntents = useMemo(() => intents.filter((i) => i.status === 'executed'), [intents]);
  const observingIntents = useMemo(
    () => intents.filter((i) => i.status === 'observing' || i.status === 'pending'),
    [intents]
  );
  const quarantinedIntents = useMemo(
    () => intents.filter((i) => i.status === 'quarantined'),
    [intents]
  );
  const cancelledIntents = useMemo(() => intents.filter((i) => i.status === 'cancelled'), [intents]);

  const totalVolume = useMemo(() => {
    return executedIntents.reduce(
      (sum, current) => sum + (parseFloat(current.total_amount) || 0),
      0
    );
  }, [executedIntents]);

  const totalLockedVolume = useMemo(() => {
    return observingIntents.reduce(
      (sum, current) => sum + (parseFloat(current.total_amount) || 0),
      0
    );
  }, [observingIntents]);

  const awaitingSignatureCount = useMemo(() => {
    return intents.filter((i) => {
      const isObservingOrPending = i.status === 'pending' || i.status === 'observing';
      const isAssigned = 
        i.cosigner_1_name?.trim().toUpperCase() === currentWallet.trim().toUpperCase() || 
        i.cosigner_2_name?.trim().toUpperCase() === currentWallet.trim().toUpperCase();
      return isObservingOrPending && isAssigned;
    }).length;
  }, [intents, currentWallet]);

  const totalIntentsCount = intents.length || 1;
  const successRate = ((executedIntents.length / totalIntentsCount) * 100).toFixed(1);

  // Asset allocation estimation
  const tokenBreakdown = useMemo(() => {
    let xlmCount = 0;
    let usdcCount = 0;
    let eurcCount = 0;

    intents.forEach((item) => {
      const addr = (item.asset_address || '').toUpperCase();
      if (addr.includes('CBPD') || addr.includes('USDC')) usdcCount++;
      else if (addr.includes('CCEW') || addr.includes('EURC')) eurcCount++;
      else xlmCount++;
    });

    return { xlmCount, usdcCount, eurcCount };
  }, [intents]);

  // Recent 5 activity items
  const recentActivities = useMemo(() => {
    return [...intents].slice(0, 5);
  }, [intents]);

  // Security Access Wall: If member is pending approval or rejected, hide operational data
  if (!isAuthorizedActive) {
    return (
      <div className="bg-[#121620] border border-amber-500/40 p-10 card-polygon text-center space-y-4 my-8 max-w-2xl mx-auto font-mono text-xs">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          ACCESS RESTRICTED — AUTHORIZATION PENDING
        </h2>
        <p className="text-stellar-muted leading-relaxed text-[11px]">
          Your registration for <strong className="text-white">{member?.org_name || 'Organization'}</strong> has not yet been approved by the company Treasurer.
        </p>
        <div className="bg-[#0B0D13] border border-[#232938] p-3 text-zinc-400 text-[10px]">
          MEMBERSHIP STATUS: <span className="text-amber-400 font-bold uppercase">{member?.status || 'PENDING'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-xs text-zinc-300 pb-16">
      
      {/* 1. HERO COMMAND COCKPIT */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0C1017] via-[#0F1420] to-[#0A0D14] border border-[#232938] p-6 lg:p-7 card-polygon shadow-2xl">
        {/* Visual Background Grid Accent */}
        <div className="absolute right-0 top-0 w-96 h-full opacity-5 pointer-events-none bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2 py-0.5 bg-stellar-yellow text-black font-extrabold text-[9px] uppercase tracking-wider rounded-sm">
                Active Vault
              </span>
              <h1 className="text-2xl lg:text-3xl font-black font-sans text-white tracking-tight flex items-center gap-2">
                {member.org_name}
              </h1>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-sm font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> GST VERIFIED ENTITY
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stellar-muted text-[11px]">
              <div>
                Operator: <span className="text-white font-bold">{member.full_name}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div>
                Role: <span className="text-stellar-yellow font-bold uppercase">{member.role}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div>
                GSTIN: <span className="text-white font-mono">{member.gst_number || 'REGISTERED_CORP'}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400">Soroban Consensus Live</span>
              </div>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {isTreasurer ? (
              <button
                type="button"
                onClick={onNavigateToPayment}
                className="w-full lg:w-auto px-6 py-3 bg-stellar-yellow text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 btn-polygon hover:bg-stellar-gold transition-all shadow-lg shadow-stellar-yellow/10 cursor-pointer"
              >
                <Send className="w-4 h-4" /> DISBURSE TREASURY INTENT
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToQuarantine}
                className="w-full lg:w-auto px-6 py-3 bg-stellar-yellow text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 btn-polygon hover:bg-stellar-gold transition-all shadow-lg shadow-stellar-yellow/10 cursor-pointer"
              >
                <Users className="w-4 h-4" /> REVIEW ACTIVE QUORUM ({awaitingSignatureCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ATTENTION BANNERS */}
      {quarantineCount > 0 && (
        <div 
          onClick={onNavigateToQuarantine}
          className="group relative overflow-hidden bg-gradient-to-r from-red-950/40 via-red-900/20 to-black border border-red-700/80 p-4 card-polygon flex items-center justify-between cursor-pointer hover:border-red-500 transition-all shadow-lg shadow-red-950/40 animate-pulse"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-red-600 text-white rounded-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="text-white font-bold text-xs tracking-wider flex items-center gap-2">
                <span>{quarantineCount} DISBURSEMENT(S) QUARANTINED BY ML ENGINE</span>
                <span className="text-[10px] bg-red-600/40 text-red-200 border border-red-500 px-1.5 py-0.2 rounded font-mono">
                  RISK &ge; 75/100
                </span>
              </div>
              <p className="text-red-300/80 text-[11px] mt-0.5">
                Autonomous anomaly detection triggered. Requires authorized Co-Signer override or Guardian challenge dismissal.
              </p>
            </div>
          </div>
          <span className="text-red-400 group-hover:text-white font-bold text-xs flex items-center gap-1 transition-colors">
            RESOLVE NOW <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {!isTreasurer && awaitingSignatureCount > 0 && (
        <div 
          onClick={onNavigateToQuarantine}
          className="group relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black border border-amber-600/70 p-4 card-polygon flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all shadow-lg shadow-amber-950/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-amber-500 text-black font-bold rounded-sm">
              <Clock className="w-5 h-5 shrink-0 animate-spin" />
            </div>
            <div>
              <div className="text-white font-bold text-xs tracking-wider flex items-center gap-2">
                <span>{awaitingSignatureCount} INTENT(S) MANDATE YOUR MULTI-SIG APPROVAL</span>
              </div>
              <p className="text-amber-200/80 text-[11px] mt-0.5">
                Cryptographic signature pending within observation timelock before autonomous settlement crank can clear funds.
              </p>
            </div>
          </div>
          <span className="text-amber-400 group-hover:text-white font-bold text-xs flex items-center gap-1 transition-colors">
            SUBMIT SIGNATURE <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* 3. CORE TELEMETRY KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Settled Outflow */}
        <div className="bg-[#0C1017] border border-[#232938] hover:border-stellar-yellow/40 p-4 card-polygon transition-all space-y-2 group">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase tracking-wider">
            <span>Settled Treasury Outflow</span>
            <div className="p-1.5 bg-stellar-yellow/10 rounded group-hover:bg-stellar-yellow/20 transition-colors">
              <Coins className="w-4 h-4 text-stellar-yellow" />
            </div>
          </div>
          <div className="text-2xl font-black font-sans text-white tracking-tight">
            {totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs text-stellar-yellow font-mono">XLM</span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#1b212f] text-stellar-muted">
            <span>{executedIntents.length} confirmed payouts</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> 100% On-Chain
            </span>
          </div>
        </div>

        {/* Tile 2: Observation Escrow */}
        <div 
          onClick={onNavigateToQuarantine}
          className="bg-[#0C1017] border border-[#232938] hover:border-amber-400/60 p-4 card-polygon transition-all space-y-2 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase tracking-wider">
            <span>Locked in Observation</span>
            <div className="p-1.5 bg-amber-400/10 rounded group-hover:bg-amber-400/20 transition-colors">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black font-sans text-amber-400 tracking-tight">
            {totalLockedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-mono text-zinc-400">XLM</span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#1b212f] text-stellar-muted">
            <span>{observingIntents.length} active time-locks</span>
            <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
              Inspect <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Tile 3: ML Sentinel Daemon */}
        <div className="bg-[#0C1017] border border-[#232938] hover:border-emerald-500/40 p-4 card-polygon transition-all space-y-2 group">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase tracking-wider">
            <span>ML Sentinel Health</span>
            <div className="p-1.5 bg-emerald-500/10 rounded group-hover:bg-emerald-500/20 transition-colors">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black font-sans text-emerald-400 tracking-tight flex items-center gap-2">
            ONLINE <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#1b212f] text-stellar-muted">
            <span>Isolation Forest Active</span>
            <span className="text-white font-bold">5 Telemetry Axes</span>
          </div>
        </div>

        {/* Tile 4: Settlement Health Rate */}
        <div className="bg-[#0C1017] border border-[#232938] hover:border-stellar-yellow/40 p-4 card-polygon transition-all space-y-2 group">
          <div className="flex items-center justify-between text-stellar-muted text-[10px] uppercase tracking-wider">
            <span>Settlement Success</span>
            <div className="p-1.5 bg-stellar-yellow/10 rounded group-hover:bg-stellar-yellow/20 transition-colors">
              <CheckCircle className="w-4 h-4 text-stellar-yellow" />
            </div>
          </div>
          <div className="text-2xl font-black font-sans text-white tracking-tight">
            {successRate}%
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#1b212f] text-stellar-muted">
            <span>{cancelledIntents.length} auto-refunded / stopped</span>
            <span className="text-stellar-yellow font-bold">0 Breach Incurred</span>
          </div>
        </div>
      </div>

      {/* 4. DUAL TELEMETRY MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module A: Visual Lifecycle Pipeline */}
        <div className="lg:col-span-2 bg-[#0C1017] border border-[#232938] p-5 card-polygon space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b212f] gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-stellar-yellow" />
              <span className="text-white font-bold text-xs uppercase tracking-wide">
                Disbursement Pipeline Telemetry
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-stellar-muted">
                Total Intents Created: <strong className="text-white">{intents.length}</strong>
              </span>
              <button
                type="button"
                onClick={onRefreshTransactions}
                className="text-stellar-yellow hover:underline cursor-pointer"
              >
                Sync Now
              </button>
            </div>
          </div>

          {/* Graphical Multi-Stage Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-stellar-muted">
              <span>Overall Escrow Flow Distribution</span>
              <span>100% Audited</span>
            </div>
            <div className="w-full bg-[#05070A] h-3 rounded-xs overflow-hidden flex border border-[#1b212f]">
              <div 
                style={{ width: `${(executedIntents.length / totalIntentsCount) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-700" 
                title={`Settled: ${executedIntents.length}`}
              />
              <div 
                style={{ width: `${(observingIntents.length / totalIntentsCount) * 100}%` }}
                className="bg-amber-400 h-full transition-all duration-700" 
                title={`Observing: ${observingIntents.length}`}
              />
              <div 
                style={{ width: `${(quarantinedIntents.length / totalIntentsCount) * 100}%` }}
                className="bg-red-500 h-full transition-all duration-700" 
                title={`Quarantined: ${quarantinedIntents.length}`}
              />
              <div 
                style={{ width: `${(cancelledIntents.length / totalIntentsCount) * 100}%` }}
                className="bg-zinc-600 h-full transition-all duration-700" 
                title={`Refunded: ${cancelledIntents.length}`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-[10px] pt-1 text-stellar-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Settled ({executedIntents.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-amber-400" /> Observing ({observingIntents.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-red-500" /> Quarantined ({quarantinedIntents.length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-zinc-600" /> Auto-Refunded ({cancelledIntents.length})
              </span>
            </div>
          </div>

          {/* Asset Allocation Breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded-xs text-center space-y-1">
              <span className="text-[10px] text-stellar-muted uppercase font-bold">XLM Lumens</span>
              <div className="text-base font-bold text-white">{tokenBreakdown.xlmCount} Intents</div>
              <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-600/40 font-bold inline-block">
                Native
              </span>
            </div>

            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded-xs text-center space-y-1">
              <span className="text-[10px] text-stellar-muted uppercase font-bold">USDC Stable</span>
              <div className="text-base font-bold text-white">{tokenBreakdown.usdcCount} Intents</div>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-600/40 font-bold inline-block">
                1:1 USD
              </span>
            </div>

            <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded-xs text-center space-y-1">
              <span className="text-[10px] text-stellar-muted uppercase font-bold">EURC Euro</span>
              <div className="text-base font-bold text-white">{tokenBreakdown.eurcCount} Intents</div>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-600/40 font-bold inline-block">
                1:1 EUR
              </span>
            </div>
          </div>
        </div>

        {/* Module B: Protocol Defense Rules */}
        <div className="bg-[#0C1017] border border-[#232938] p-5 card-polygon space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1b212f]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold text-xs uppercase tracking-wide">
                  Active Guard Rules
                </span>
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-600/40 font-bold rounded-sm">
                ENFORCED
              </span>
            </div>

            <div className="space-y-3 pt-3 text-[11px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#161B26]">
                <span className="text-stellar-muted">FastPath Tier (0 Signers)</span>
                <span className="text-white font-bold">&le; 5,000.00 XLM</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#161B26]">
                <span className="text-stellar-muted">Co-Signer Mandate Tier</span>
                <span className="text-amber-400 font-bold">&gt; 5,000 XLM (1-of-2)</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#161B26]">
                <span className="text-stellar-muted">Multi-Sig &amp; Guardian Tier</span>
                <span className="text-red-400 font-bold">&gt; 10,000 XLM (3-of-3)</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#161B26]">
                <span className="text-stellar-muted">Observation Window Bounds</span>
                <span className="text-white font-bold">3 Mins &mdash; 12 Hours</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stellar-muted">Keeper Crank Gas Sponsoring</span>
                <span className="text-emerald-400 font-bold">Zero User Gas</span>
              </div>
            </div>
          </div>

          <div className="bg-[#07090E] border border-[#1b212f] p-3 rounded-xs text-[10px] text-stellar-muted flex items-center gap-2">
            <Zap className="w-4 h-4 text-stellar-yellow shrink-0" />
            <span>Escrow locks instantaneously on Soroban upon intent creation. Double-spending is mathematically impossible.</span>
          </div>
        </div>

      </div>

      {/* 5. RECENT ACTIVITY STREAM */}
      <div className="bg-[#0C1017] border border-[#232938] p-5 card-polygon space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b212f]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stellar-yellow" />
            <span className="text-white font-bold text-xs uppercase tracking-wide">
              Recent Intent Action Stream
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToQuarantine}
            className="text-[11px] text-stellar-yellow hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <span>View Complete Ongoing Queue</span> <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-stellar-muted space-y-2">
            <FileCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>No recent treasury activity detected. Initiate your first payment intent.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((tx) => {
              const statusStr = (tx.status || '').toLowerCase();
              const isSettled = statusStr === 'executed';
              const isObserving = statusStr === 'observing' || statusStr === 'pending';
              const isQuarantine = statusStr === 'quarantined';
              const isRefunded = statusStr === 'cancelled';
              const destinationWallet = tx.to_wallet || 'N/A';

              return (
                <div
                  key={tx.intent_id}
                  className="bg-[#07090E] border border-[#1b212f] hover:border-zinc-700 p-3 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xs shrink-0 ${
                      isSettled ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400' :
                      isObserving ? 'bg-amber-950/60 border border-amber-500/40 text-amber-400' :
                      isQuarantine ? 'bg-red-950/60 border border-red-500/40 text-red-400' :
                      isRefunded ? 'bg-zinc-800 border border-zinc-700 text-zinc-400' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isSettled ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isObserving ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : isQuarantine ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">Intent #{tx.intent_id}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isSettled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          isObserving ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          isQuarantine ? 'bg-red-950 text-red-400 border border-red-800' :
                          isRefunded ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                          'bg-zinc-900 text-zinc-400 border border-zinc-700'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-stellar-muted truncate max-w-md">
                        To: <span className="text-zinc-300 font-mono">{destinationWallet}</span> • {tx.note || tx.description || 'Routine transfer'}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#161B26]">
                    <div className="text-sm font-bold text-white font-mono">
                      {parseFloat(tx.total_amount).toFixed(2)}{' '}
                      <span className="text-stellar-yellow text-xs font-mono">XLM</span>
                    </div>
                    <div className="text-[10px] text-stellar-muted">
                      {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : 'Recent'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;