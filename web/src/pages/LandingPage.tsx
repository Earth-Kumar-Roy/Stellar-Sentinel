import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Terminal, 
  BrainCircuit, 
  Mail, 
  FileText, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserPlus, 
  Wallet, 
  Globe, 
  Share2, 
  MessageSquare, 
  ChevronRight, 
  Sparkles, 
  Sliders, 
  Check, 
  Activity, 
  Zap, 
  Shield, 
  Layers, 
  Cpu 
} from 'lucide-react';

interface LandingPageProps {
  walletAddress?: string | null;
  onConnectWallet: () => void;
  onOpenLoginModal: () => void;
  onNavigateToRegister: () => void;
  onNavigateToDocs: () => void;
  onLaunchVault?: () => void;
  isConnecting: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  walletAddress,
  onConnectWallet,
  onOpenLoginModal,
  onNavigateToRegister,
  onNavigateToDocs,
  onLaunchVault,
  isConnecting,
}) => {
  // Interactive Simulator State
  const [simAmount, setSimAmount] = useState<number>(5000);
  const [simBaseRisk, setSimBaseRisk] = useState<number>(20);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  // Pure mathematical micro-variance calculations
  const simulationEngine = useMemo(() => {
    // Micro calculation based on logarithmic magnitude of the entered amount
    const microVariance = 2.15 * Math.log10(Math.max(simAmount, 10) + 15);
    
    // Strict requirement: 5,000+ XLM crosses into the 75+ quarantine zone
    let calculatedScore: number;
    let ruleText: string;

    if (simAmount >= 5000) {
      // 5,000+ guarantees 75+ with natural micro-fluctuations (e.g., 76.4, 78.8, 83.2)
      const highExposureScale = (simAmount - 5000) / 20000; // 0.0 to 1.0
      calculatedScore = 76.0 + (highExposureScale * 18.0) + (microVariance % 3.8);
      
      if (simAmount > 10000) {
        ruleText = 'High-Value Multi-Sig Band (>10,000 XLM): Mandatory 3-of-3 Quorum (Treasurer + 2 Co-Signers + Guardian).';
      } else {
        ruleText = 'Capital Exposure Ceiling (≥5,000 XLM): Risk threshold exceeded (Score ≥ 75). Mandatory Co-Signer authorization required.';
      }
    } else {
      // Below 5,000 XLM stays safely below the 75 limit with fine-grained micro adjustments
      const routineScale = simAmount / 5000; // 0.0 to 1.0
      const baseline = simBaseRisk < 45 ? simBaseRisk : 22;
      calculatedScore = baseline + (routineScale * 24.0) + (microVariance % 4.2);
      ruleText = 'FastPath Operational Buffer: Disbursement within verified capital limits. 2h to 12h observation window active.';
    }

    const finalScore = Number(Math.min(Math.max(calculatedScore, 5.0), 98.5).toFixed(1));
    const isQuarantined = finalScore >= 75.0;

    return {
      score: finalScore,
      isQuarantined,
      ruleText,
      tier: finalScore >= 75.0 && simAmount > 10000 
        ? 'GUARDIAN_REQUIRED' 
        : finalScore >= 75.0 
        ? 'QUARANTINED' 
        : simAmount > 5000 
        ? 'STANDARD_OBSERVING' 
        : 'FAST_PATH',
      quorum: finalScore >= 75.0 && simAmount > 10000
        ? '3-of-3 (Treasurer + 2 Signers + Guardian)'
        : finalScore >= 75.0
        ? '2-of-2 (Treasurer + 1 Co-Signer)'
        : '1-of-1 (Treasurer Autonomous)'
    };
  }, [simAmount, simBaseRisk]);

  const handleCopyContract = () => {
    navigator.clipboard.writeText('CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2');
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-zinc-300 font-mono text-xs selection:bg-stellar-yellow selection:text-black overflow-x-hidden relative">
      
      {/* Dynamic Keyframes for Modern Floating Cards and Shimmer Physics */}
      <style>{`
        @keyframes float-smooth {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-smooth-alt {
          0%, 100% { transform: translateY(-6px); }
          50% { transform: translateY(6px); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.05); }
        }
        @keyframes gradient-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-card-float {
          animation: float-smooth 5.5s ease-in-out infinite;
        }
        .animate-card-float-alt {
          animation: float-smooth-alt 6.5s ease-in-out infinite;
        }
        .animate-beacon-pulse {
          animation: pulse-subtle 4s ease-in-out infinite;
        }
        .shimmer-headline {
          background: linear-gradient(90deg, #FFFFFF 0%, #FFE600 45%, #FFFFFF 90%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shimmer 7s linear infinite;
        }
      `}</style>

      {/* Decorative Cybernetic Ambient Grids */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-b from-cyan-500/10 via-stellar-yellow/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#1A263D_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F172A_1px,transparent_1px),linear-gradient(to_bottom,#0F172A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* 1. HERO SECTION WITH EXPANDED EMBLEM & STATUS BEACONS */}
      <section className="relative overflow-hidden pt-14 pb-24 border-b border-[#1A2538]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center text-center space-y-7">
          
          {/* FLOATING PROTOCOL LOGO CARD */}
          <div className="relative group cursor-pointer animate-card-float" onClick={onNavigateToDocs}>
            <div className="absolute -inset-2 bg-gradient-to-r from-stellar-yellow/30 via-cyan-400/20 to-stellar-yellow/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-700 pointer-events-none" />
            <div className="relative p-4 bg-[#0A101C]/90 border border-stellar-yellow/50 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/Logo.svg" 
                alt="Stellar Sentinel Protocol" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_20px_rgba(255,230,0,0.35)]"
              />
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#05080E] text-stellar-yellow border border-stellar-yellow/60 text-[9px] px-3 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap shadow-md">
              Soroban Engine v2.4 • Shield Armed
            </span>
          </div>

          {/* Subheader Status Pill */}
          <div className="inline-flex items-center gap-2 border border-stellar-yellow/40 bg-stellar-yellow/10 px-4 py-1.5 text-[11px] text-stellar-yellow rounded-full font-bold shadow-lg shadow-stellar-yellow/5">
            <span className="w-2 h-2 rounded-full bg-stellar-yellow animate-ping" />
            <span>AUTONOMOUS NON-CUSTODIAL CORPORATE DEFENSE PROTOCOL</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-sans text-white tracking-tight leading-[1.14] max-w-4xl drop-shadow-md">
            Autonomous Multi-Sig &amp; ML Treasury Defense for{' '}
            <span className="relative inline-block shimmer-headline underline decoration-[#1E293B] decoration-4 underline-offset-8">
              Stellar Soroban
            </span>
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Eliminate corporate hot-wallet draining and social engineering attacks. Features instantaneous non-custodial smart contract escrow, dynamic time-lock observation (<span className="text-stellar-yellow font-bold">2h to 12h</span>)[cite: 27], off-chain machine learning telemetry[cite: 27], and automated GST tax invoicing[cite: 27].
          </p>

          {/* ACTION STATION */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4 w-full max-w-3xl">
            {walletAddress ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={onLaunchVault || onConnectWallet}
                  className="px-8 py-4 bg-stellar-yellow text-black font-black text-xs tracking-wider flex items-center justify-center gap-2.5 btn-polygon hover:bg-stellar-gold transition-all shadow-xl shadow-stellar-yellow/20 cursor-pointer w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                  <Terminal className="w-4 h-4" />
                  <span>LAUNCH VAULT / DISBURSE INTENT</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <div className="px-4 py-3 bg-[#0A101C] border border-emerald-500/50 text-emerald-400 font-bold rounded-sm flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</span>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onConnectWallet}
                  disabled={isConnecting}
                  className="px-7 py-3.5 bg-stellar-yellow text-black font-black text-xs tracking-wider flex items-center gap-2 btn-polygon hover:bg-stellar-gold transition-all shadow-xl shadow-stellar-yellow/15 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? 'CONNECTING FREIGHTER...' : 'CONNECT FREIGHTER WALLET'}
                </button>

                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="px-6 py-3.5 border border-[#1E293B] hover:border-stellar-yellow text-white text-xs bg-[#0F172A]/80 btn-polygon flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Building2 className="w-4 h-4 text-stellar-yellow" />
                  <span>CORPORATE ID LOGIN</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="px-6 py-3.5 border border-stellar-yellow/50 text-stellar-yellow hover:bg-stellar-yellow/10 text-xs btn-polygon flex items-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>REGISTER ENTITY</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onNavigateToDocs}
              className="px-5 py-3.5 border border-[#1E293B] hover:border-zinc-500 text-zinc-300 hover:text-white bg-[#0A101C] text-xs flex items-center gap-2 transition-all cursor-pointer rounded-sm"
            >
              <FileText className="w-4 h-4 text-stellar-yellow" />
              <span>Read Architecture Specs</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          {/* TELEMETRY BENCHMARK CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl pt-8 border-t border-[#1A2538]">
            <div className="p-4 bg-[#0A101C]/90 border border-[#1E293B] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/50 transition-all animate-card-float shadow-lg">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Escrow Custody</div>
              <div className="text-white font-bold text-sm mt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Non-Custodial</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Smart contract SAC lock[cite: 27]</div>
            </div>

            <div className="p-4 bg-[#0A101C]/90 border border-[#1E293B] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/50 transition-all animate-card-float-alt shadow-lg">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Observation Window</div>
              <div className="text-stellar-yellow font-bold text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>2h to 12 Hours</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Configurable timelock[cite: 27]</div>
            </div>

            <div className="p-4 bg-[#0A101C]/90 border border-[#1E293B] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/50 transition-all animate-card-float shadow-lg">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">ML Anomaly Gate</div>
              <div className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>&ge; 75/100 Quarantine</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">5 Telemetry axes evaluated[cite: 27]</div>
            </div>

            <div className="p-4 bg-[#0A101C]/90 border border-[#1E293B] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/50 transition-all animate-card-float-alt shadow-lg">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Settlement Engine</div>
              <div className="text-white font-bold text-sm mt-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autonomous Crank</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Zero user secondary gas[cite: 27]</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ENHANCED SIMULATION COCKPIT (CLEAN INPUTS WITH PURE 5,000+ XLM -> 75+ SCALE) */}
      <section className="py-20 border-b border-[#1A2538] bg-[#090D18]/70 relative">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-stellar-yellow uppercase tracking-widest text-[10px] font-bold mb-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Live Consensus Telemetry Matrix</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
                Simulate Autonomous Protocol Gating &amp; Multi-Sig Rules[cite: 27]
              </h2>
            </div>
            <div className="text-zinc-400 text-[11px] max-w-sm">
              Adjust disbursement parameters to observe how Soroban dynamically transitions from routine FastPath into multi-sig review and quarantine[cite: 27].
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0A101C]/90 border border-[#1E293B] p-6 lg:p-8 rounded-sm shadow-2xl relative">
            
            {/* Control Column */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-stellar-yellow" />
                    <span>Disbursement Exposure (XLM Equivalent)</span>
                  </label>
                  <span className={`text-base font-bold font-mono px-3 py-0.5 border rounded transition-colors ${
                    simAmount >= 5000 
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300' 
                      : 'bg-[#0F172A] border-[#1E293B] text-white'
                  }`}>
                    {simAmount.toLocaleString()} XLM
                  </span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="25000"
                  step="250"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full accent-stellar-yellow bg-[#0F172A] h-2.5 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
                  <span>500 (FastPath)</span>
                  <span className="text-amber-400 font-bold">5,000 (≥75 Quarantine Threshold)</span>
                  <span className="text-red-400 font-bold">10,000+ (Guardian Quorum)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Off-Chain ML Telemetry Risk Assessment</span>
                  </label>
                  <span className={`text-base font-bold font-mono px-3 py-0.5 rounded border transition-colors ${
                    simulationEngine.isQuarantined 
                      ? 'bg-red-950/80 border-red-500 text-red-300' 
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                  }`}>
                    {simulationEngine.score} / 100
                  </span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={simBaseRisk}
                  onChange={(e) => setSimBaseRisk(Number(e.target.value))}
                  className="w-full accent-stellar-yellow bg-[#0F172A] h-2.5 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
                  <span>Baseline Variance: Low</span>
                  <span>Moderate Variance</span>
                  <span className="text-amber-400">High Variance</span>
                </div>
              </div>

              {/* Real-time Rule Banner */}
              <div className="p-4 bg-[#060910] border border-[#1A2538] rounded-sm space-y-2">
                <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Protocol Rule Enforced:
                </span>
                <p className="text-zinc-200 text-[11px] leading-relaxed font-mono">
                  {simulationEngine.ruleText}
                </p>
              </div>
            </div>

            {/* Simulated Cockpit Status (Floating Animated Card) */}
            <div className="lg:col-span-6 bg-[#060910] border border-[#1E293B] p-6 rounded-sm flex flex-col justify-between space-y-5 animate-card-float shadow-2xl">
              <div>
                <div className="flex items-center justify-between border-b border-[#1A2538] pb-3">
                  <span className="text-zinc-400 uppercase text-[10px] font-bold">Simulated On-Chain Execution State[cite: 27]</span>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-sm border ${
                    simulationEngine.isQuarantined 
                      ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
                      : simulationEngine.tier === 'GUARDIAN_REQUIRED'
                      ? 'bg-red-950/60 border-red-500/80 text-red-300'
                      : simulationEngine.tier === 'STANDARD_OBSERVING'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  }`}>
                    {simulationEngine.tier === 'QUARANTINED' 
                      ? 'STATUS: QUARANTINED' 
                      : `TIER: ${simulationEngine.tier}`}
                  </span>
                </div>

                <div className="space-y-3 pt-3 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-[#131B2B]">
                    <span className="text-zinc-500">Immediate Escrow Lock:</span>
                    <span className="text-white font-bold font-mono">100% Locked on Intent Creation[cite: 27]</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#131B2B]">
                    <span className="text-zinc-500">Configured Observation Timelock:</span>
                    <span className="text-stellar-yellow font-bold font-mono">2 Hours to 12 Hours Window[cite: 27]</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#131B2B]">
                    <span className="text-zinc-500">Mandatory Signer Quorum:</span>
                    <span className="text-white font-bold font-mono">{simulationEngine.quorum}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#131B2B]">
                    <span className="text-zinc-500">Settlement Dispatch Mechanism:</span>
                    <span className="text-emerald-400 font-bold font-mono">Autonomous Keeper Crank[cite: 27]</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">If Unapproved / Cancelled:</span>
                    <span className="text-emerald-400 font-bold font-mono">Auto-Refunded to Treasury[cite: 27]</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={walletAddress ? onLaunchVault : onConnectWallet}
                  className="w-full py-3.5 bg-[#0F172A] hover:bg-stellar-yellow hover:text-black border border-stellar-yellow/50 text-stellar-yellow font-bold text-xs btn-polygon transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Terminal className="w-4 h-4" />
                  <span>{walletAddress ? 'LAUNCH VAULT CONSOLE' : 'CONNECT TO DEPLOY INTENT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FOUR CORE PILLARS & ARCHITECTURAL ADVANTAGES */}
      <section className="py-20 border-b border-[#1A2538]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-stellar-yellow uppercase tracking-widest text-[10px] font-bold">
              Autonomous Defense Architecture[cite: 27]
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-sans text-white tracking-tight">
              Enterprise-Grade Protection for High-Value Treasuries[cite: 27]
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Engineered natively on the Stellar Soroban Rust framework to replace vulnerable hot wallets with continuous cryptographic validation[cite: 27].
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="bg-[#0A101C]/80 border border-[#1E293B] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-2 duration-300 animate-card-float shadow-lg">
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 text-amber-400 w-fit rounded-sm group-hover:bg-amber-400/20 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Non-Custodial Escrow</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Tokens transfer immediately into contract storage upon intent initialization[cite: 27]. Double-spends and unauthorized treasury drain scenarios are mathematically precluded[cite: 27].
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#0A101C]/80 border border-[#1E293B] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-2 duration-300 animate-card-float-alt shadow-lg">
              <div className="p-3 bg-stellar-yellow/10 border border-stellar-yellow/20 text-stellar-yellow w-fit rounded-sm group-hover:bg-stellar-yellow/20 transition-colors">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">ML Telemetry Sentinel</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Evaluates counterparty trust history, volume surge, post-cosign frequency clustering, and memo entropy to autonomously quarantine anomalous payouts[cite: 27].
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#0A101C]/80 border border-[#1E293B] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-2 duration-300 animate-card-float shadow-lg">
              <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 w-fit rounded-sm group-hover:bg-emerald-400/20 transition-colors">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Autonomous Crank Bot</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Zero secondary gas or manual confirmation required[cite: 27]. Once observation timelocks clear and required multi-sig approvals are signed, the keeper bot settles on-chain[cite: 27].
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#0A101C]/80 border border-[#1E293B] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-2 duration-300 animate-card-float-alt shadow-lg">
              <div className="p-3 bg-blue-400/10 border border-blue-400/20 text-blue-400 w-fit rounded-sm group-hover:bg-blue-400/20 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Automated PDF Invoicing</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Integrates with Google Apps Script to generate GST-compliant PDF Tax Invoices upon execution, relaying receipts to both the treasurer and the recipient entity[cite: 27].
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPLIANCE & PROTOCOL ASSURANCES */}
      <section className="py-16 border-b border-[#1A2538] bg-[#070B14]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0A101C]/70 border border-[#1E293B] p-5 rounded-sm space-y-2 flex flex-col justify-between hover:border-stellar-yellow/40 transition-colors">
              <div>
                <span className="text-[10px] text-stellar-yellow uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  Dual-Engine Verification
                </span>
                <h4 className="text-white font-bold text-sm">Pyodide WASM &amp; Python Daemon</h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Evaluates telemetry client-side inside the user's browser for instant feedback, validated before transaction broadcast by the autonomous agent.
                </p>
              </div>
              <div className="pt-3 border-t border-[#162032] text-[10px] text-zinc-500 font-mono">
                Isolation Forest • 50 Estimators
              </div>
            </div>

            <div className="bg-[#0A101C]/70 border border-[#1E293B] p-5 rounded-sm space-y-2 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  Guaranteed Auto-Refund
                </span>
                <h4 className="text-white font-bold text-sm">Zero Stuck Capital Policy</h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  If required co-signers decline or observation delays expire without full cryptographic consensus, funds return 100% to the vault.
                </p>
              </div>
              <div className="pt-3 border-t border-[#162032] text-[10px] text-zinc-500 font-mono">
                Smart Contract SAC Reversion
              </div>
            </div>

            <div className="bg-[#0A101C]/70 border border-[#1E293B] p-5 rounded-sm space-y-2 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  Multi-Currency SAC Support
                </span>
                <h4 className="text-white font-bold text-sm">XLM, USDC &amp; EURC Standard</h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Native Stellar Lumens and regulated stablecoins operate under 7-decimal Stroop normalization with on-chain volume band enforcement.
                </p>
              </div>
              <div className="pt-3 border-t border-[#162032] text-[10px] text-zinc-500 font-mono">
                Stellar Asset Contract Standard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER & DEVELOPER PROFILE */}
      <footer className="pt-16 pb-12 bg-[#05080E] border-t border-[#1A2538]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-[#1A2538]">
            <div className="flex items-center gap-4">
              <img src="/Logo.svg" alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-white font-bold text-sm tracking-wide">STELLAR SENTINEL</span>
                <p className="text-zinc-500 text-[10px]">Autonomous Smart Treasury &amp; Risk Defense Protocol[cite: 27]</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onNavigateToDocs}
                className="text-zinc-400 hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer flex items-center gap-1 font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Architecture Specs</span>
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-zinc-400 hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer"
              >
                Corporate Login
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-zinc-400 hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer"
              >
                Entity Onboarding
              </button>
            </div>
          </div>

          {/* DEVELOPER PROFILE SECTION */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#090E1A] border border-[#1E293B] p-6 lg:p-7 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="space-y-1.5">
              <div className="text-[10px] text-stellar-yellow uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Architect &amp; Lead Protocol Engineer</span>
              </div>
              <h3 className="text-xl font-bold font-sans text-white tracking-tight">
                Earth Kumar Roy
              </h3>
              <p className="text-zinc-400 text-[11px] max-w-xl leading-relaxed">
                Specializing in production Web3 smart contract architectures, zero-knowledge verification frameworks, and automated decentralized keeper infrastructure on Stellar Soroban[cite: 27].
              </p>
            </div>

            {/* Social & Contact Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.linkedin.com/in/earth-kumar-roy/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-stellar-yellow/50 text-white text-[11px] font-bold rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>

              <a
                href="https://x.com/Earth_Kumar_Roy"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-stellar-yellow/50 text-white text-[11px] font-bold rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>X / Twitter</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>

              <a
                href="https://sites.google.com/view/ekr1/leave-a-message"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-stellar-yellow text-black hover:bg-stellar-gold text-[11px] font-black rounded-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Leave a Message</span>
                <ExternalLink className="w-3 h-3 text-black/70" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-[10px] pt-4">
            <div>
              &copy; {new Date().getFullYear()} Stellar Sentinel Protocol. Architected by Earth Kumar Roy.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono">Official Testnet Contract:</span>
              <button
                type="button"
                onClick={handleCopyContract}
                className="text-stellar-yellow hover:underline font-mono cursor-pointer flex items-center gap-1"
                title="Click to copy contract ID"
              >
                <span>CDYQLHZ...Z3C2</span>
                {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <ExternalLink className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;