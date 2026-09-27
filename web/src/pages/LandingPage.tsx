import React, { useState } from 'react';
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
  Check
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
  const [simAmount, setSimAmount] = useState<number>(7500);
  const [simRisk, setSimRisk] = useState<number>(26);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  // Protocol Rule Calculations (2h to 12h Observation Window)
  const isQuarantine = simRisk >= 75;
  const isGuardianRequired = !isQuarantine && simAmount > 10000;
  const isCosignerRequired = !isQuarantine && simAmount > 5000 && simAmount <= 10000;
  

  const handleCopyContract = () => {
    navigator.clipboard.writeText('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06080D] text-zinc-300 font-mono text-xs selection:bg-stellar-yellow selection:text-black overflow-x-hidden">
      
      {/* 1. HERO SECTION WITH EXPANDED LOGO & RADAR SWEEP */}
      <section className="relative overflow-hidden pt-12 pb-24 border-b border-[#1E2433]">
        {/* Animated Cybernetic Ambient Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-stellar-yellow/20 via-stellar-yellow/5 to-transparent blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#121620_1px,transparent_1px),linear-gradient(to_bottom,#121620_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center text-center space-y-7">
          
          {/* ENLARGED COMMAND LOGO EMBLEM */}
          <div className="relative group cursor-pointer" onClick={onNavigateToDocs}>
            <div className="absolute -inset-2 bg-gradient-to-r from-stellar-yellow/40 via-stellar-gold/20 to-stellar-yellow/40 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />
            <div className="relative p-3.5 bg-[#0A0E17] border-2 border-stellar-yellow/60 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/Logo.svg" 
                alt="Stellar Sentinel Master Protocol" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_20px_rgba(255,230,0,0.45)]"
              />
            </div>
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-black/90 text-stellar-yellow border border-stellar-yellow/50 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap shadow-md">
              Soroban Engine v2.4
            </span>
          </div>

          {/* Subheader Pill */}
          <div className="inline-flex items-center gap-2 border border-stellar-yellow/50 bg-stellar-yellow/10 px-4 py-1.5 text-[11px] text-stellar-yellow rounded-full font-bold shadow-lg shadow-stellar-yellow/5">
            <span className="w-2.5 h-2.5 rounded-full bg-stellar-yellow animate-ping" />
            <span>AUTONOMOUS NON-CUSTODIAL CORPORATE VAULT</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-sans text-white tracking-tight leading-[1.12] max-w-4xl drop-shadow-md">
            Autonomous Multi-Sig &amp; ML Treasury Defense for{' '}
            <span className="relative inline-block text-stellar-yellow underline decoration-[#283247] decoration-4 underline-offset-8">
              Stellar Soroban
            </span>
          </h1>

          <p className="text-stellar-muted text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Eliminate corporate hot-wallet draining and social engineering attacks. Features instantaneous non-custodial smart contract escrow, dynamic time-lock observation (<span className="text-stellar-yellow font-bold">2h to 12h</span>), off-chain machine learning telemetry, and automated GST tax invoicing.
          </p>

          {/* DYNAMIC ACTION STATION (AWARE OF WALLET CONNECTION) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4 w-full max-w-3xl">
            {walletAddress ? (
              // Connected State: Prominent Launch Button
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
                <div className="px-4 py-3 bg-[#0D1017] border border-emerald-500/50 text-emerald-400 font-bold rounded-sm flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</span>
                </div>
              </div>
            ) : (
              // Disconnected State: Full Suite of Access Controls
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
                  className="px-6 py-3.5 border border-[#232938] hover:border-stellar-yellow text-white text-xs bg-[#121620] btn-polygon flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Building2 className="w-4 h-4 text-stellar-yellow" />
                  <span>CORPORATE ID LOGIN</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="px-6 py-3.5 border border-stellar-yellow/40 text-stellar-yellow hover:bg-stellar-yellow/10 text-xs btn-polygon flex items-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>REGISTER ENTITY</span>
                </button>
              </>
            )}

            {/* Read Documentation / Specs Button */}
            <button
              type="button"
              onClick={onNavigateToDocs}
              className="px-5 py-3.5 border border-[#1E2433] hover:border-zinc-500 text-zinc-300 hover:text-white bg-[#0A0D14] text-xs flex items-center gap-2 transition-all cursor-pointer rounded-sm"
            >
              <FileText className="w-4 h-4 text-stellar-yellow" />
              <span>Read Architecture Specs</span>
              <ChevronRight className="w-3.5 h-3.5 text-stellar-muted" />
            </button>
          </div>

          {/* TELEMETRY BENCHMARK CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-4xl pt-8 border-t border-[#1E2433]">
            <div className="p-3.5 bg-[#0C1017] border border-[#1E2433] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/40 transition-colors">
              <div className="text-[10px] text-stellar-muted uppercase tracking-wider">Escrow Custody</div>
              <div className="text-white font-bold text-sm mt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Non-Custodial</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Smart contract SAC lock</div>
            </div>

            <div className="p-3.5 bg-[#0C1017] border border-[#1E2433] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/40 transition-colors">
              <div className="text-[10px] text-stellar-muted uppercase tracking-wider">Observation Window</div>
              <div className="text-stellar-yellow font-bold text-sm mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>2h to 12 Hours</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Configurable timelock</div>
            </div>

            <div className="p-3.5 bg-[#0C1017] border border-[#1E2433] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/40 transition-colors">
              <div className="text-[10px] text-stellar-muted uppercase tracking-wider">ML Anomaly Gate</div>
              <div className="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>&ge; 75/100 Quarantine</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">5 Telemetry axes evaluated</div>
            </div>

            <div className="p-3.5 bg-[#0C1017] border border-[#1E2433] rounded-sm text-left relative overflow-hidden group hover:border-stellar-yellow/40 transition-colors">
              <div className="text-[10px] text-stellar-muted uppercase tracking-wider">Settlement Engine</div>
              <div className="text-white font-bold text-sm mt-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autonomous Crank</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Zero user secondary gas</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE PROTOCOL SIMULATION STATION */}
      <section className="py-20 border-b border-[#1E2433] bg-[#080B10] relative">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-stellar-yellow uppercase tracking-widest text-[10px] font-bold mb-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Consensus Matrix</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-sans text-white tracking-tight">
                Simulate Autonomous Protocol Gating &amp; Multi-Sig Rules
              </h2>
            </div>
            <div className="text-stellar-muted text-[11px] max-w-sm">
              Tweak transfer parameters to observe how Soroban automatically enforces observation delay, multi-sig quorums, or immediate quarantine.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0B0E15] border border-[#1E2433] p-6 lg:p-8 rounded-sm shadow-xl relative">
            
            {/* Control Dashboard */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[10px] text-stellar-muted uppercase tracking-wider font-bold">
                    Disbursement Exposure (XLM Equivalent)
                  </label>
                  <span className="text-base font-bold text-white font-mono bg-[#121620] px-3 py-0.5 border border-[#232938] rounded">
                    {simAmount.toLocaleString()} XLM
                  </span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full accent-stellar-yellow bg-[#121620] h-2.5 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stellar-muted mt-1.5 font-mono">
                  <span>500 (FastPath)</span>
                  <span className="text-amber-400 font-bold">5,000 (1 Co-Signer)</span>
                  <span className="text-red-400 font-bold">10,000+ (Guardian Multi-Sig)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[10px] text-stellar-muted uppercase tracking-wider font-bold">
                    Off-Chain ML Telemetry Risk Assessment
                  </label>
                  <span className={`text-base font-bold font-mono px-3 py-0.5 rounded border ${
                    simRisk >= 75 
                      ? 'bg-red-950/80 border-red-500 text-red-300' 
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                  }`}>
                    {simRisk} / 100
                  </span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  value={simRisk}
                  onChange={(e) => setSimRisk(Number(e.target.value))}
                  className="w-full accent-stellar-yellow bg-[#121620] h-2.5 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stellar-muted mt-1.5 font-mono">
                  <span>0 - 30 (Clean Flow)</span>
                  <span>31 - 74 (Standard Flow)</span>
                  <span className="text-red-400 font-bold">&ge; 75 (Quarantine Trigger)</span>
                </div>
              </div>

              <div className="p-4 bg-[#07090E] border border-[#1E2433] rounded-sm space-y-2">
                <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Active Protocol Rule Enforced:
                </span>
                <p className="text-zinc-200 text-[11px] leading-relaxed">
                  {isQuarantine 
                    ? 'Anomaly Challenge Active: High composite risk score detected. Intent is quarantined immediately. Execution crank blocked until Guardian challenge dismissal.'
                    : isGuardianRequired
                    ? 'Mandatory 3-of-3 Quorum: Volume exceeds 10,000 XLM threshold. Requires Treasurer + 2 Designated Co-Signers + 1 Guardian cryptographic approval.'
                    : isCosignerRequired
                    ? 'Threshold Multi-Sig: Volume exceeds 5,000 XLM band. Requires at least 1 verified Co-Signer authorization before settlement.'
                    : 'FastPath Route: Routine authorized disbursement within standard exposure limits under treasurer authorization with active 2h to 12h observation timelock.'}
                </p>
              </div>
            </div>

            {/* Simulated Soroban State Cockpit */}
            <div className="lg:col-span-6 bg-[#07090E] border border-[#1E2433] p-6 rounded-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-[#1E2433] pb-3">
                  <span className="text-stellar-muted uppercase text-[10px] font-bold">Simulated On-Chain Execution State</span>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-sm border ${
                    isQuarantine 
                      ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
                      : isGuardianRequired 
                      ? 'bg-red-950/60 border-red-500/80 text-red-300'
                      : isCosignerRequired 
                      ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                  }`}>
                    {isQuarantine ? 'STATUS: QUARANTINED' : isGuardianRequired ? 'TIER: GUARDIAN_REQUIRED' : isCosignerRequired ? 'TIER: STANDARD_OBSERVING' : 'TIER: FAST_PATH'}
                  </span>
                </div>

                <div className="space-y-3 pt-3 text-[11px]">
                  <div className="flex justify-between py-1.5 border-b border-[#161B26]">
                    <span className="text-stellar-muted">Immediate Escrow Lock:</span>
                    <span className="text-white font-bold font-mono">100% Locked on Intent Creation</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#161B26]">
                    <span className="text-stellar-muted">Configured Observation Timelock:</span>
                    <span className="text-stellar-yellow font-bold font-mono">2 Hours to 12 Hours Window</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#161B26]">
                    <span className="text-stellar-muted">Mandatory Signer Quorum:</span>
                    <span className="text-white font-bold font-mono">
                      {isQuarantine ? 'Guardian Resolution Only' : isGuardianRequired ? '3-of-3 (Treasurer + 2 Signers + Guardian)' : isCosignerRequired ? '2-of-2 (Treasurer + 1 Signer)' : '1-of-1 (Treasurer Only)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#161B26]">
                    <span className="text-stellar-muted">Settlement Dispatch Mechanism:</span>
                    <span className="text-emerald-400 font-bold font-mono">Autonomous Keeper Crank</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-stellar-muted">If Unapproved / Anomaly Cancelled:</span>
                    <span className="text-emerald-400 font-bold font-mono">Auto-Refunded to Treasury</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={walletAddress ? onLaunchVault : onConnectWallet}
                  className="w-full py-3 bg-[#121620] hover:bg-stellar-yellow hover:text-black border border-stellar-yellow/50 text-stellar-yellow font-bold text-xs btn-polygon transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
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
      <section className="py-20 border-b border-[#1E2433]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-stellar-yellow uppercase tracking-widest text-[10px] font-bold">
              Autonomous Defense Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-sans text-white tracking-tight">
              Enterprise-Grade Protection for High-Value Treasuries
            </h2>
            <p className="text-stellar-muted text-xs leading-relaxed">
              Engineered natively on the Stellar Soroban Rust framework to replace vulnerable hot wallets with continuous cryptographic validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="bg-[#0C1017] border border-[#1E2433] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-1 duration-200">
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 text-amber-400 w-fit rounded-sm group-hover:bg-amber-400/20 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Non-Custodial Escrow</h3>
              <p className="text-[11px] text-stellar-muted leading-relaxed">
                Tokens transfer immediately into contract storage upon intent initialization. Double-spends and unauthorized treasury drain scenarios are mathematically precluded.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#0C1017] border border-[#1E2433] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-1 duration-200">
              <div className="p-3 bg-stellar-yellow/10 border border-stellar-yellow/20 text-stellar-yellow w-fit rounded-sm group-hover:bg-stellar-yellow/20 transition-colors">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">ML Telemetry Sentinel</h3>
              <p className="text-[11px] text-stellar-muted leading-relaxed">
                Evaluates counterparty trust history, volume surge (&gt;30x baseline), post-cosign frequency clustering, and memo entropy to autonomously quarantine anomalous payouts.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#0C1017] border border-[#1E2433] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-1 duration-200">
              <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 w-fit rounded-sm group-hover:bg-emerald-400/20 transition-colors">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Autonomous Crank Bot</h3>
              <p className="text-[11px] text-stellar-muted leading-relaxed">
                Zero secondary gas or manual confirmation required. Once observation timelocks clear and required multi-sig approvals are signed, the keeper bot settles on-chain.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-[#0C1017] border border-[#1E2433] hover:border-stellar-yellow/50 p-6 rounded-sm transition-all space-y-3 group hover:-translate-y-1 duration-200">
              <div className="p-3 bg-blue-400/10 border border-blue-400/20 text-blue-400 w-fit rounded-sm group-hover:bg-blue-400/20 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Automated PDF Invoicing</h3>
              <p className="text-[11px] text-stellar-muted leading-relaxed">
                Integrates with Google Apps Script to generate GST-compliant PDF Tax Invoices upon execution, relaying receipts to both the treasurer and the recipient entity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER & DEVELOPER PROFILE */}
      <footer className="pt-16 pb-12 bg-[#04060A] border-t border-[#1E2433]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-[#1E2433]">
            <div className="flex items-center gap-4">
              <img src="/Logo.svg" alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <span className="text-white font-bold text-sm tracking-wide">STELLAR SENTINEL</span>
                <p className="text-stellar-muted text-[10px]">Autonomous Smart Treasury &amp; Risk Defense Protocol</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onNavigateToDocs}
                className="text-stellar-muted hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer flex items-center gap-1 font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>Architecture Specs</span>
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="text-stellar-muted hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer"
              >
                Corporate Login
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-stellar-muted hover:text-stellar-yellow transition-colors text-[11px] cursor-pointer"
              >
                Entity Onboarding
              </button>
            </div>
          </div>

          {/* DEVELOPER PROFILE SECTION */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#090C12] border border-[#1E2433] p-6 lg:p-7 rounded-sm shadow-xl">
            <div className="space-y-1.5">
              <div className="text-[10px] text-stellar-yellow uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Architect &amp; Lead Protocol Engineer</span>
              </div>
              <h3 className="text-xl font-bold font-sans text-white tracking-tight">
                Earth Kumar Roy
              </h3>
              <p className="text-stellar-muted text-[11px] max-w-xl leading-relaxed">
                Specializing in production Web3 smart contract architectures, zero-knowledge verification frameworks, and automated decentralized keeper infrastructure on Stellar Soroban.
              </p>
            </div>

            {/* Social & Contact Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/earth-kumar-roy/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#121620] hover:bg-[#1E2433] border border-[#232938] hover:border-stellar-yellow/50 text-white text-[11px] font-bold rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>LinkedIn</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com/Earth_Kumar_Roy"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#121620] hover:bg-[#1E2433] border border-[#232938] hover:border-stellar-yellow/50 text-white text-[11px] font-bold rounded-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-stellar-yellow" />
                <span>X / Twitter</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
              </a>

              {/* Leave a Message Portal */}
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-stellar-muted text-[10px] pt-4">
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
                <span>CDLZFC3...CYSC</span>
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