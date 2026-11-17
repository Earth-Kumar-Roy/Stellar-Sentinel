import React, { useState, useMemo } from 'react';
import {
  Shield,
  Terminal,
  ArrowRight,
  Sliders,
  Building2,
  ClipboardCheck,
  Zap,
  Lock,
  Clock,
  Activity,
  ArrowLeftRight,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Code2,
  Bot,
  Cpu,
  LayoutGrid,
  Copy,
  Check,
  Wallet,
  BadgeCheck,
  Network,
  ArrowUpRight,
  FileText,
  Menu,
  X,
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

const CONTRACT_ID = 'CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2';
const CONTRACT_URL = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;

type AssetType = 'XLM' | 'USDC' | 'EURC';

const MULTIPLIERS: Record<AssetType, number> = {
  XLM: 1,
  USDC: 5,
  EURC: 5.55,
};

const TRUST_LABELS: Record<string, string> = {
  untrusted: 'NO TRUST (UNVERIFIED)',
  band1_ind: 'BAND 1 · INDEPENDENT',
  band1_corp: 'BAND 1 · GST VERIFIED',
  band2_ind: 'BAND 2 · ESTABLISHED',
  band2_corp: 'BAND 2 · FULL WHITELIST',
  entropy_spike: 'ENTROPY ANOMALY',
};

export const LandingPage: React.FC<LandingPageProps> = ({
  walletAddress,
  onConnectWallet,
  onOpenLoginModal,
  onNavigateToRegister,
  onNavigateToDocs,
  onLaunchVault,
  isConnecting,
}) => {
  const [asset, setAsset] = useState<AssetType>('XLM');
  const [amount, setAmount] = useState<number>(4500);
  const [trust, setTrust] = useState<string>('band2_corp');
  const [windowHours, setWindowHours] = useState<number>(2);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handlePrimaryAction = () => {
    if (walletAddress) {
      (onLaunchVault || onConnectWallet)();
    } else {
      onConnectWallet();
    }
  };

  const handleCopyContract = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ID);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } catch {
      setCopiedContract(false);
    }
  };

  const sim = useMemo(() => {
    const xlmEquivalent = amount * MULTIPLIERS[asset];
    const trustedBand = trust === 'band2_corp';
    const nearCap = xlmEquivalent >= 4500 && !trustedBand;
    const entropySpike = trust === 'entropy_spike';
    const variance = 1.85 * Math.log10(Math.max(xlmEquivalent, 1) + 9);

    let score = 18 + Math.round(variance * 4);
    if (nearCap) score += 28;
    if (xlmEquivalent > 5000) score += Math.min(22, Math.floor((xlmEquivalent - 5000) / 500));
    if (trust === 'untrusted') score += 22;
    if (trust === 'band1_ind') score += 10;
    if (trust === 'band1_corp') score += 5;
    if (entropySpike) score += 55;
    score = Math.max(12, Math.min(96, score));

    const quarantined = score >= 75;
    const review = score >= 50 && !quarantined;

    return {
      xlmEquivalent,
      nearCap,
      variance,
      score,
      quarantined,
      review,
      trustLabel: TRUST_LABELS[trust] || 'UNVERIFIED',
      statusTitle: quarantined ? 'QUARANTINE (2-OF-2)' : review ? 'REVIEW REQUIRED' : 'FAST PATH',
      quorumText: quarantined
        ? '2-of-2 Multi-Sig Quorum Mandatory'
        : review
        ? 'Treasurer + Co-Signer Review'
        : '1-of-1 (Treasurer FastPath)',
      settleText: quarantined
        ? 'Quarantine Hold / Multi-Sig Gated'
        : review
        ? 'Observation Window / Review Required'
        : 'Eligible after observation window',
      recTitle: quarantined
        ? 'QUARANTINE ENFORCED: SECONDARY SIGNATURE REQUIRED'
        : review
        ? 'POLICY REVIEW REQUIRED'
        : 'WITHIN DISPLAYED POLICY GUARDRAILS',
      recDesc: quarantined
        ? 'The example crosses the configured risk boundary. Funds remain locked in escrow while the required co-signer or guardian approval is collected.'
        : review
        ? 'The example requires additional review under the displayed risk policy. Funds remain in escrow during the configured observation window.'
        : 'The example remains below the displayed risk threshold. Settlement is eligible only after the observation window and all contract conditions are satisfied.',
    };
  }, [amount, asset, trust]);

  return (
    <div className="min-h-screen bg-[#0B0D13] text-[#F3F6FA] font-sans antialiased selection:bg-[#FFD100] selection:text-[#0B0D13] overflow-x-hidden">
      <style>{`
        .btn-polygon {
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .sentinel-gold-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #FFD100;
          background: rgba(255, 209, 0, 0.08);
          border: 1px solid rgba(255, 209, 0, 0.42);
          font-weight: 700;
          letter-spacing: 0.055em;
          transition: all 0.2s ease;
        }
        .sentinel-gold-link:hover {
          color: #0B0D13;
          background: #FFD100;
          border-color: #FFD100;
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(255, 209, 0, 0.22);
        }
        .sentinel-gold-panel {
          background: linear-gradient(115deg, #FFD100 0%, #FFE047 52%, #F5B700 100%);
          color: #0B0D13;
        }
      `}</style>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-[#232938] bg-[#0B0D13]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-20 px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 bg-[#FFD100]/10 border border-[#FFD100]/40 group-hover:border-[#FFD100] flex items-center justify-center p-1.5 btn-polygon transition-colors">
              <img
                src="/Logo.png"
                alt="Stellar Sentinel Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col font-mono">
              <span className="font-bold tracking-wider text-sm sm:text-base text-white leading-none">
                STELLAR<span className="text-[#FFD100]">SENTINEL</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#8E9BAE] tracking-tight uppercase mt-1">
                TREASURY DEFENSE SYSTEM
              </span>
            </div>
            <span className="hidden sm:inline-block ml-1 font-mono text-[10px] uppercase px-2 py-0.5 border border-[#FFD100]/40 text-[#FFD100] bg-[#FFD100]/10">
              TESTNET
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-6 font-mono text-xs uppercase tracking-wider">
            <a
              aria-current="page"
              href="#top"
              className="py-1.5 px-3 bg-[#FFD100] text-[#0B0D13] font-bold btn-polygon transition-colors"
            >
              Protocol
            </a>
            <a href="#lifecycle" className="py-1.5 px-2 text-[#A0AABF] hover:text-[#FFD100] transition-colors">
              Lifecycle
            </a>
            <a href="#simulator" className="py-1.5 px-2 text-[#A0AABF] hover:text-[#FFD100] transition-colors">
              Risk Engine
            </a>
            <a href="#specifications" className="py-1.5 px-2 text-[#A0AABF] hover:text-[#FFD100] transition-colors">
              Architecture
            </a>
            <button
              type="button"
              onClick={onNavigateToDocs}
              className="py-1.5 px-2 text-[#A0AABF] hover:text-[#FFD100] uppercase transition-colors cursor-pointer"
            >
              Docs
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="hidden md:inline-flex font-mono text-xs uppercase text-[#8E9BAE] hover:text-[#FFD100] transition-colors px-3 py-1.5 cursor-pointer"
            >
              Corporate Login
            </button>
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isConnecting}
              className="px-3.5 sm:px-5 py-2.5 bg-[#FFD100] text-[#0B0D13] font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-2 btn-polygon hover:bg-[#F5B700] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING...' : 'CONNECT FREIGHTER'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden p-2 border border-[#232938] text-[#C5CEDE] hover:text-[#FFD100] bg-[#121620]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#232938] bg-[#0B0D13] px-4 py-4 space-y-2 font-mono text-xs uppercase">
            <a
              href="#top"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 bg-[#FFD100] text-[#0B0D13] font-bold"
            >
              Protocol
            </a>
            <a
              href="#lifecycle"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 text-[#C5CEDE] hover:text-[#FFD100]"
            >
              Lifecycle
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 text-[#C5CEDE] hover:text-[#FFD100]"
            >
              Risk Engine
            </a>
            <a
              href="#specifications"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 text-[#C5CEDE] hover:text-[#FFD100]"
            >
              Architecture
            </a>
            <div className="pt-2 border-t border-[#232938] flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateToDocs();
                }}
                className="px-3 py-2 bg-[#121620] border border-[#232938] text-[#FFD100]"
              >
                Docs
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="px-3 py-2 bg-[#121620] border border-[#232938] text-white"
              >
                Corporate Login
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="w-full pt-20" id="top">
        {/* Status Ticker Bar */}
        <div className="w-full bg-[#0B0D13] text-[#8E9BAE] px-4 sm:px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#232938] font-mono text-[10px] uppercase tracking-wider">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD100] inline-block animate-pulse" />
              <span className="text-white tracking-widest">NETWORK: STELLAR TESTNET · RPC 42MS</span>
            </div>
            <span className="hidden sm:inline text-[#232938]">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[#8E9BAE]">WASM CONTRACT:</span>
              <span className="text-white font-medium">CDYQ...Z3C2</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="hidden md:inline">
              <span className="text-[#8E9BAE]">SAC ENGINE:</span> PROTOCOL 21 COMPLIANT
            </span>
            <span className="hidden lg:inline">
              <span className="text-[#8E9BAE]">POLICY ENFORCEMENT:</span> STRICT NON-CUSTODIAL
            </span>
            <span className="text-[#FFD100] font-semibold">ALL DEFENSE RAILS ENGAGED</span>
          </div>
        </div>

        {/* 1. HERO SECTION */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-12 lg:py-20 bg-[#0B0D13] relative overflow-hidden">
          <img
            src="/background.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            style={{
              opacity: 0.32,
              filter: 'grayscale(50%) contrast(120%) brightness(1.1)',
              mixBlendMode: 'screen',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, rgba(255,209,0,0.04) 0%, rgba(11,13,19,0.22) 65%, #0B0D13 100%)',
            }}
          />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#121620]/90 border border-[#232938] mb-6 font-mono text-[10px] uppercase tracking-widest text-[#FFD100] font-semibold">
                  <Shield className="w-3.5 h-3.5 text-[#FFD100]" />
                  <span>SOROBAN TREASURY SURVEILLANCE</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-5 leading-[0.98]">
                  Move capital.<br />
                  <span className="text-[#FFD100]">Not risk.</span>
                </h1>

                <p className="text-base sm:text-lg text-[#C5CEDE] max-w-2xl mb-8 leading-relaxed">
                  Programmable non-custodial treasury defense on Stellar Soroban. Lock every corporate disbursement into audited escrow, inspect multi-dimensional risk before release, and enforce policy quorums before funds move.
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={isConnecting}
                    className="group px-6 py-3.5 bg-[#FFD100] text-[#0B0D13] font-mono text-sm uppercase font-bold tracking-tight hover:bg-[#F5B700] transition-all flex items-center gap-2.5 shadow-md btn-polygon cursor-pointer disabled:opacity-50"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING…' : 'CONNECT FREIGHTER'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <a
                    href="#simulator"
                    className="px-6 py-3.5 bg-[#121620]/90 text-white font-mono text-sm uppercase tracking-tight border border-[#232938] hover:border-[#FFD100] hover:text-[#FFD100] transition-all flex items-center gap-2 btn-polygon"
                  >
                    <span>EXPLORE PROTOCOL</span>
                    <Sliders className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-[#232938] font-mono text-xs uppercase">
                  <button type="button" onClick={onOpenLoginModal} className="sentinel-gold-link cursor-pointer">
                    <Building2 className="w-4 h-4" />
                    <span>Corporate Access</span>
                  </button>
                  <button type="button" onClick={onNavigateToRegister} className="sentinel-gold-link cursor-pointer">
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Register Entity</span>
                  </button>
                  <a href="#simulator" className="sentinel-gold-link">
                    <Zap className="w-4 h-4" />
                    <span>Test Simulator</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-[#232938]">
                <div className="p-3.5 bg-[#121620]/90 border border-[#232938]">
                  <span className="block font-mono text-[10px] uppercase text-[#8E9BAE]">EXECUTION</span>
                  <span className="block font-bold text-base text-white mt-1">NON-CUSTODIAL</span>
                  <span className="block font-mono text-[10px] text-[#9BA5B8] mt-0.5">Soroban Smart Escrow</span>
                </div>
                <div className="p-3.5 bg-[#121620]/90 border border-[#232938]">
                  <span className="block font-mono text-[10px] uppercase text-[#8E9BAE]">ENVIRONMENT</span>
                  <span className="block font-bold text-base text-[#FFD100] mt-1">TESTNET LIVE</span>
                  <span className="block font-mono text-[10px] text-[#9BA5B8] mt-0.5">RPC Sync Verified</span>
                </div>
                <div className="p-3.5 bg-[#121620]/90 border border-[#232938]">
                  <span className="block font-mono text-[10px] uppercase text-[#8E9BAE]">ASSET SUPPORT</span>
                  <span className="block font-bold text-base text-white mt-1">SAC NATIVE</span>
                  <span className="block font-mono text-[10px] text-[#9BA5B8] mt-0.5">XLM · USDC · EURC</span>
                </div>
              </div>
            </div>

            {/* Large Prominent Logo.png Showcase Panel */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[300px] aspect-square bg-[#121620]/90 border border-[#FFD100]/40 p-6 flex flex-col items-center justify-center btn-polygon shadow-[0_0_50px_rgba(255,209,0,0.12)] group">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,209,0,0.14) 0%, transparent 72%)',
                  }}
                />
                <img
                  src="/Logo.png"
                  alt="Stellar Sentinel Protocol Emblem"
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain relative z-10 drop-shadow-[0_0_24px_rgba(255,209,0,0.3)] group-hover:scale-105 transition-transform duration-300"
                />
                <div className="mt-4 pt-3 border-t border-[#232938] w-full flex items-center justify-between font-mono text-[10px] uppercase relative z-10">
                  <span className="text-[#8E9BAE]">SENTINEL CORE</span>
                  <span className="text-[#FFD100] font-bold">v2.1 ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FOUR-COLUMN FEATURE STRIP */}
        <section className="w-full bg-[#0E1118] border-y border-[#232938]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232938]">
            <div className="p-6 flex flex-col justify-between hover:bg-[#121620] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-[#FFD100] font-bold">01</span>
                <Lock className="w-5 h-5 text-[#8E9BAE]" />
              </div>
              <div>
                <h3 className="text-base uppercase text-white font-semibold mb-1.5">NON-CUSTODIAL</h3>
                <p className="text-xs text-[#C5CEDE] leading-relaxed">
                  Disbursements lock directly into Soroban smart contracts. Neither Sentinel operators nor intermediaries possess asset custody.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#8E9BAE] uppercase tracking-wider mt-4">ATOMIC RUST SMART CONTRACT</span>
            </div>

            <div className="p-6 flex flex-col justify-between hover:bg-[#121620] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-[#FFD100] font-bold">02 — 12H</span>
                <Clock className="w-5 h-5 text-[#8E9BAE]" />
              </div>
              <div>
                <h3 className="text-base uppercase text-white font-semibold mb-1.5">OBSERVATION WINDOW</h3>
                <p className="text-xs text-[#C5CEDE] leading-relaxed">
                  Programmable latency buffer designed for high-value flows, empowering risk inspectors and guardians to challenge anomalous payouts.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#8E9BAE] uppercase tracking-wider mt-4">CONFIGURABLE TIME-LOCK HORIZON</span>
            </div>

            <div className="p-6 flex flex-col justify-between hover:bg-[#121620] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-[#FFD100] font-bold">75+</span>
                <Activity className="w-5 h-5 text-[#8E9BAE]" />
              </div>
              <div>
                <h3 className="text-base uppercase text-white font-semibold mb-1.5">RISK THRESHOLD</h3>
                <p className="text-xs text-[#C5CEDE] leading-relaxed">
                  Real-time isolation-forest algorithms monitor velocity, address freshness, and corporate GST hash matches to trigger multi-sig holds.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#8E9BAE] uppercase tracking-wider mt-4">ALGORITHMIC QUARANTINE LOGIC</span>
            </div>

            <div className="p-6 flex flex-col justify-between hover:bg-[#121620] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm text-[#FFD100] font-bold">SAC NATIVE</span>
                <ArrowLeftRight className="w-5 h-5 text-[#8E9BAE]" />
              </div>
              <div>
                <h3 className="text-base uppercase text-white font-semibold mb-1.5">XLM · USDC · EURC</h3>
                <p className="text-xs text-[#C5CEDE] leading-relaxed">
                  Zero protocol wrapping required. Works seamlessly with Stellar Asset Contracts, respecting corporate trustlines and compliance mandates.
                </p>
              </div>
              <span className="font-mono text-[10px] text-[#8E9BAE] uppercase tracking-wider mt-4">NATIVE ASSET COMPATIBILITY</span>
            </div>
          </div>
        </section>

        {/* 3. SYSTEMIC VULNERABILITY AUDIT */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-16 bg-[#0B0D13]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] text-[#ff6b6b] uppercase tracking-widest mb-3">
                <span className="w-2 h-2 bg-[#ff6b6b]" />
                <span>SYSTEMIC VULNERABILITY AUDIT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase text-white tracking-tight leading-tight mb-4">
                A single transaction should never be an irreversible leap of faith.
              </h2>
              <p className="text-sm text-[#C5CEDE] mb-4 leading-relaxed">
                In standard corporate crypto treasuries, signing a transaction broadcasts it straight to the ledger with zero grace period. When hot keys are compromised, recipient addresses are subtly spoofed, or rogue actors initiate drain attempts, funds vanish in milliseconds.
              </p>
              <p className="text-sm text-[#C5CEDE] leading-relaxed mb-6">
                Stellar Sentinel inserts a deterministic defense boundary between intent and settlement. By enforcing an observation window governed by automated risk inspection, organizations retain complete governance over their sovereign treasury reserves.
              </p>
              <div className="p-4 bg-[#121620] border-l-2 border-[#FFD100]">
                <div className="font-mono text-xs uppercase text-[#FFD100] font-semibold mb-1">DEFENSE AXIOM #01</div>
                <p className="text-xs text-[#C5CEDE]">
                  "Settlement finality should be an asset, not a vector for catastrophic corporate capital extraction."
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-[#121620] border border-[#232938]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232938]">
                  <span className="font-mono text-[10px] uppercase text-[#ff6b6b] font-semibold">TRADITIONAL WEB3 TREASURY</span>
                  <XCircle className="w-4 h-4 text-[#ff6b6b]" />
                </div>
                <h4 className="text-base font-semibold uppercase text-white mb-2">Instant Irrevocable Leak</h4>
                <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                  Once a transaction is broadcasted, consensus commits it permanently. Malicious or erroneous transfers cannot be rescinded or audited in-flight.
                </p>
                <div className="p-2 bg-[#0B0D13] font-mono text-[10px] text-[#8E9BAE] uppercase">
                  REMEDY: POST-MORTEM POLICE REPORTS
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#FFD100]/40">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232938]">
                  <span className="font-mono text-[10px] uppercase text-[#FFD100] font-semibold">STELLAR SENTINEL PROTOCOL</span>
                  <ShieldCheck className="w-4 h-4 text-[#FFD100]" />
                </div>
                <h4 className="text-base font-semibold uppercase text-white mb-2">Programmable Time-Lock Escrow</h4>
                <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                  Funds are committed into a non-custodial Soroban vault with an immutable cooling period. The capital remains untouchable by the destination until cleared.
                </p>
                <div className="p-2 bg-[#0B0D13] font-mono text-[10px] text-[#FFD100] uppercase font-semibold">
                  REMEDY: ATOMIC TREASURY REFUND
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#232938]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232938]">
                  <span className="font-mono text-[10px] uppercase text-[#ff6b6b] font-semibold">BLIND MULTI-SIG APPROVAL</span>
                  <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />
                </div>
                <h4 className="text-base font-semibold uppercase text-white mb-2">Signer Fatigue &amp; Exploits</h4>
                <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                  Co-signers blindly approve raw hexadecimal payloads under urgency, rubber-stamping sophisticated wallet drainer contracts or fraudulent invoices.
                </p>
                <div className="p-2 bg-[#0B0D13] font-mono text-[10px] text-[#8E9BAE] uppercase">
                  TELEMETRY: NONE (BLIND SIGNING)
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#FFD100]/40">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232938]">
                  <span className="font-mono text-[10px] uppercase text-[#FFD100] font-semibold">TELEMETRY-BACKED QUORUM</span>
                  <BarChart3 className="w-4 h-4 text-[#FFD100]" />
                </div>
                <h4 className="text-base font-semibold uppercase text-white mb-2">Multi-Dimensional ML Scoring</h4>
                <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                  Every payout triggers real-time velocity, volume surge, and corporate vendor registry inspection. Anomaly triggers dynamic escalation to 2-of-2 multi-sig.
                </p>
                <div className="p-2 bg-[#0B0D13] font-mono text-[10px] text-[#FFD100] uppercase font-semibold">
                  TELEMETRY: PYODIDE ML &amp; GST REGISTRY
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FOUR-STAGE LIFECYCLE */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-16 bg-[#0E1118] border-y border-[#232938]" id="lifecycle">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#232938] gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#FFD100] font-semibold block mb-1">
                  SYSTEM EXECUTION PIPELINE
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase text-white tracking-tight">
                  The 4-Stage Lifecycle of an Intent
                </h2>
              </div>
              <div className="font-mono text-xs uppercase text-[#C5CEDE]">
                STATE MACHINE: <span className="text-white font-semibold">LOCKED → INSPECTED → QUORUM → SETTLED</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121620] p-6 border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-0.5 bg-[#0B0D13] text-[#FFD100] font-mono text-xs font-bold border border-[#232938]">
                      STAGE 01
                    </span>
                    <span className="font-mono text-[10px] text-[#8E9BAE] uppercase">SOROBAN OP</span>
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Create Intent</h3>
                  <p className="text-xs text-[#C5CEDE] leading-relaxed mb-4">
                    Treasurer specifies beneficiary wallet, native SAC asset, volume, corporate purpose hash, and sets the 2h to 12h challenge duration.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#232938] space-y-1.5 font-mono text-[10px] text-[#8E9BAE]">
                  <div className="flex justify-between">
                    <span>Function:</span> <span className="text-white">lock_escrow()</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custody:</span> <span className="text-[#FFD100]">Non-Custodial</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Event:</span> <span className="text-white">EscrowLocked</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121620] p-6 border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-0.5 bg-[#0B0D13] text-[#FFD100] font-mono text-xs font-bold border border-[#232938]">
                      STAGE 02
                    </span>
                    <span className="font-mono text-[10px] text-[#8E9BAE] uppercase">OFF-CHAIN ML</span>
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Inspect Risk</h3>
                  <p className="text-xs text-[#C5CEDE] leading-relaxed mb-4">
                    Python/Pyodide pipeline extracts disbursement telemetry: 24h address velocity, cluster deviation, verified corporate GST hash, and trust-band tier.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#232938] space-y-1.5 font-mono text-[10px] text-[#8E9BAE]">
                  <div className="flex justify-between">
                    <span>Model:</span> <span className="text-white">Isolation Forest</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Score Range:</span> <span className="text-[#FFD100]">0 — 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registry:</span> <span className="text-white">Corporate GST Check</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121620] p-6 border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-0.5 bg-[#0B0D13] text-[#FFD100] font-mono text-xs font-bold border border-[#232938]">
                      STAGE 03
                    </span>
                    <span className="font-mono text-[10px] text-[#8E9BAE] uppercase">DYNAMIC QUORUM</span>
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Policy Quorum</h3>
                  <p className="text-xs text-[#C5CEDE] leading-relaxed mb-4">
                    Scores &lt;75 navigate FastPath (single signature). Scores ≥75 enter Quarantine, mandating multi-sig endorsement from authorized co-signers.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#232938] space-y-1.5 font-mono text-[10px] text-[#8E9BAE]">
                  <div className="flex justify-between">
                    <span>FastPath:</span> <span className="text-[#FFD100]">1-of-1 Autopilot</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quarantine:</span> <span className="text-[#ff6b6b]">2-of-2 Multi-Sig</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Challenge:</span> <span className="text-white">Guardian Override</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121620] p-6 border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-0.5 bg-[#0B0D13] text-[#FFD100] font-mono text-xs font-bold border border-[#232938]">
                      STAGE 04
                    </span>
                    <span className="font-mono text-[10px] text-[#8E9BAE] uppercase">FINALITY</span>
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Settle or Refund</h3>
                  <p className="text-xs text-[#C5CEDE] leading-relaxed mb-4">
                    Automated keeper daemon executes payout upon window expiry if unchallenged. If an emergency challenge is verified, 100% of escrow refunds to treasury.
                  </p>
                </div>
                <div className="pt-4 border-t border-[#232938] space-y-1.5 font-mono text-[10px] text-[#8E9BAE]">
                  <div className="flex justify-between">
                    <span>Autonomous:</span> <span className="text-white">Keeper Settlement</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emergency:</span> <span className="text-[#FFD100]">Treasury Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guarantee:</span> <span className="text-white">Zero Lock-in Loss</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE CLIENT-SIDE RISK SIMULATOR */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-16 bg-[#0B0D13]" id="simulator">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#FFD100] font-semibold block mb-1">
                CLIENT-SIDE RISK SIMULATOR · PYTHON ALGORITHM REFLECTION
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase text-white tracking-tight mb-2">
                Test the Soroban Policy Engine
              </h2>
              <p className="text-sm text-[#C5CEDE] leading-relaxed">
                Adjust SAC asset type, nominal volume, and counterparty trust tiers to inspect how the telemetry engine calculates SAC normalization (1,000 USDC / 900 EURC = 5,000 XLM), logs the dynamic amount variance formula, and trips the Near-Cap Anomaly Gate at 4,500 XLM equivalent.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls */}
              <div className="lg:col-span-6 bg-[#121620] border border-[#232938] p-6 sm:p-8">
                <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#232938]">
                  <span className="font-mono text-xs uppercase text-white font-semibold">INTENT SIMULATOR CONTROLS</span>
                  <span className="font-mono text-[10px] text-[#FFD100] uppercase font-bold">SAC &amp; VARIANCE ALGO V2</span>
                </div>

                {/* Asset Selector */}
                <div className="mb-6">
                  <label className="font-mono text-xs uppercase text-white block mb-2">
                    SAC Asset Selection &amp; Normalization Multiplier
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs uppercase">
                    {(['XLM', 'USDC', 'EURC'] as AssetType[]).map((item) => {
                      const active = asset === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setAsset(item)}
                          className={`p-2.5 border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#232938] text-[#FFD100] font-semibold border-[#FFD100]'
                              : 'bg-[#161B26] text-white border-[#232938] hover:border-[#FFD100]/40'
                          }`}
                        >
                          {item} ({MULTIPLIERS[item]}x)
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 font-mono text-[10px] text-[#8E9BAE] mt-2">
                    <span>XLM: 1.0x Native</span>
                    <span>USDC: 1,000 = 5,000 XLM</span>
                    <span>EURC: 900 = 5,000 XLM</span>
                  </div>
                </div>

                {/* Amount Slider */}
                <div className="mb-6">
                  <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
                    <label className="font-mono text-xs uppercase text-white" htmlFor="sim-amount">
                      Disbursement Nominal Amount
                    </label>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg text-[#FFD100] font-bold">
                        {amount.toLocaleString()} {asset}
                      </span>
                      <span className="font-mono text-[11px] text-[#C5CEDE]">
                        ({sim.xlmEquivalent.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM Eq)
                      </span>
                    </div>
                  </div>
                  <input
                    id="sim-amount"
                    type="range"
                    min={200}
                    max={10000}
                    step={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-[#0B0D13] appearance-none cursor-pointer accent-[#FFD100] border border-[#232938]"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-[#8E9BAE] mt-2">
                    <span>Min (200)</span>
                    <span className="text-[#ff6b6b] font-medium">NEAR-CAP GATE: 4,500 XLM EQ</span>
                    <span>Max (10,000)</span>
                  </div>
                </div>

                {/* Trust Tier Select */}
                <div className="mb-6">
                  <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
                    <label className="font-mono text-xs uppercase text-white" htmlFor="sim-counterparty">
                      Counterparty Trust Band Hierarchy
                    </label>
                    <span className="font-mono text-[10px] text-[#FFD100] uppercase font-bold">
                      {sim.trustLabel}
                    </span>
                  </div>
                  <select
                    id="sim-counterparty"
                    value={trust}
                    onChange={(e) => setTrust(e.target.value)}
                    className="w-full p-2.5 bg-[#0B0D13] text-white font-mono text-xs border border-[#232938] focus:border-[#FFD100] focus:outline-none"
                  >
                    <option value="untrusted">Unregistered Independent (0 Historical Tx · New Keypair)</option>
                    <option value="band1_ind">Band 1 Independent (7+ Tx Historical Baseline · FastPath Cap 2.5k)</option>
                    <option value="band1_corp">Band 1 Corporate GST (10+ Tx Verified GST Registry)</option>
                    <option value="band2_ind">Band 2 Independent (13+ Tx High Settlement History)</option>
                    <option value="band2_corp">Band 2 Corporate GST (18+ Tx Full Whitelist · Near-Cap Immune)</option>
                    <option value="entropy_spike">Entropy Anomaly Spike (25x Surge over 15-Tx Baseline)</option>
                  </select>
                </div>

                {/* Latency Window */}
                <div className="mb-6">
                  <label className="font-mono text-xs uppercase text-white block mb-2">
                    Configured Latency Window
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs uppercase">
                    {[2, 6, 12].map((hrs) => {
                      const active = windowHours === hrs;
                      return (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setWindowHours(hrs)}
                          className={`p-2.5 border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#232938] text-[#FFD100] font-semibold border-[#FFD100]'
                              : 'bg-[#161B26] text-white border-[#232938] hover:border-[#FFD100]/40'
                          }`}
                        >
                          {hrs} Hours
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Variance Formula */}
                <div className="p-3 bg-[#0B0D13] border border-[#232938] font-mono text-[10px] space-y-1">
                  <div className="flex items-center justify-between text-[#8E9BAE]">
                    <span>DYNAMIC AMOUNT VARIANCE FORMULA:</span>
                    <span className="text-[#FFD100] font-bold">+{sim.variance.toFixed(2)} PTS VARIANCE</span>
                  </div>
                  <div className="text-[#A0AABF] break-all">
                    amount_dynamic_var = 1.85 * log10(max(xlm_equivalent, 1) + 9)
                  </div>
                </div>
              </div>

              {/* Predicted Verdict */}
              <div className="lg:col-span-6 bg-[#121620] border border-[#232938] p-6 sm:p-8">
                <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#232938]">
                  <span className="font-mono text-xs uppercase text-white font-semibold">PREDICTED SETTLEMENT VERDICT</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E9BAE]">SOROBAN WASM DISPATCH</span>
                </div>

                <div className="bg-[#0B0D13] p-5 border border-[#232938] mb-6">
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-[#8E9BAE] block">COMPUTED RISK SCORE</span>
                      <span
                        className={`text-4xl sm:text-5xl font-bold ${
                          sim.quarantined ? 'text-[#ff6b6b]' : sim.review ? 'text-[#C5CEDE]' : 'text-[#FFD100]'
                        }`}
                      >
                        {sim.score}
                      </span>
                      <span className="text-lg text-[#8E9BAE]"> / 100</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[10px] uppercase text-[#8E9BAE] block">EXECUTION TRACK</span>
                      <span
                        className={`text-lg sm:text-xl uppercase font-bold ${
                          sim.quarantined ? 'text-[#ff6b6b]' : sim.review ? 'text-[#C5CEDE]' : 'text-[#FFD100]'
                        }`}
                      >
                        {sim.statusTitle}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-[#232938] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        sim.quarantined ? 'bg-[#ff6b6b]' : sim.review ? 'bg-[#7B849B]' : 'bg-[#FFD100]'
                      }`}
                      style={{ width: `${sim.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-[#8E9BAE] mt-2">
                    <span>0 (CLEAN)</span>
                    <span className="text-[#C5CEDE] font-semibold">QUARANTINE THRESHOLD (75)</span>
                    <span>100 (CRITICAL)</span>
                  </div>
                </div>

                <div className="space-y-2 font-mono text-xs mb-6">
                  <div className="p-3 bg-[#161B26] flex flex-wrap items-center justify-between gap-2 border-b border-[#232938]">
                    <span className="text-[#8E9BAE] uppercase">Normalized XLM Exposure:</span>
                    <span className="text-white font-semibold">
                      {sim.xlmEquivalent.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM Eq (100% Non-Custodial)
                    </span>
                  </div>
                  <div className="p-3 bg-[#161B26] flex flex-wrap items-center justify-between gap-2 border-b border-[#232938]">
                    <span className="text-[#8E9BAE] uppercase">Near-Cap Gate Status:</span>
                    <span className={`font-semibold ${sim.nearCap ? 'text-[#ff6b6b]' : 'text-[#FFD100]'}`}>
                      {sim.nearCap ? 'TRIPPED (≥4,500 XLM Eq without Band 2)' : 'CLEAR (TRUST / AMOUNT WITHIN POLICY)'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#161B26] flex flex-wrap items-center justify-between gap-2 border-b border-[#232938]">
                    <span className="text-[#8E9BAE] uppercase">Challenge Horizon:</span>
                    <span className="text-white font-semibold">{windowHours.toFixed(1)} Hours</span>
                  </div>
                  <div className="p-3 bg-[#161B26] flex flex-wrap items-center justify-between gap-2 border-b border-[#232938]">
                    <span className="text-[#8E9BAE] uppercase">Signer Quorum:</span>
                    <span
                      className={`font-semibold ${
                        sim.quarantined ? 'text-[#ff6b6b]' : sim.review ? 'text-[#C5CEDE]' : 'text-[#FFD100]'
                      }`}
                    >
                      {sim.quorumText}
                    </span>
                  </div>
                  <div className="p-3 bg-[#161B26] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[#8E9BAE] uppercase">Settlement Mechanism:</span>
                    <span className="text-white font-semibold">{sim.settleText}</span>
                  </div>
                </div>

                <div
                  className={`p-4 bg-[#161B26] border ${
                    sim.quarantined ? 'border-[#ff6b6b]' : sim.review ? 'border-[#7B849B]' : 'border-[#FFD100]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {sim.quarantined ? (
                      <AlertTriangle className="w-4 h-4 text-[#ff6b6b] shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#FFD100] shrink-0" />
                    )}
                    <span
                      className={`font-mono text-xs uppercase font-semibold ${
                        sim.quarantined ? 'text-[#ff6b6b]' : sim.review ? 'text-[#C5CEDE]' : 'text-[#FFD100]'
                      }`}
                    >
                      {sim.recTitle}
                    </span>
                  </div>
                  <p className="text-xs text-[#C5CEDE] leading-relaxed">{sim.recDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. PROTOCOL SPECIFICATIONS */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-16 bg-[#0E1118] border-y border-[#232938]" id="specifications">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#232938] gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#FFD100] font-semibold block mb-1">
                  PROTOCOL SPECIFICATIONS
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase text-white tracking-tight">
                  Full Technical Stack Architecture
                </h2>
              </div>
              <div className="font-mono text-xs uppercase text-[#8E9BAE]">
                STELLAR PROTOCOL 21 · SOROBAN ENVIRONMENT
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-[#121620] border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-[#232938] flex items-center justify-center mb-4 text-[#FFD100]">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">On-Chain Engine</h3>
                  <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                    Implemented in strict no_std Rust. Implements an immutable state machine, atomic ledger-level refunds, cryptographic intent hashes, and cross-contract Stellar Asset transfers.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] pt-4 border-t border-[#232938]">
                  <div className="text-[#8E9BAE]">
                    TARGET: <span className="text-white">wasm32-unknown-unknown</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    CONTRACT SIZE: <span className="text-white">42.8 KB</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    COMPILATION: <span className="text-[#FFD100]">Optimized Release</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-[#232938] flex items-center justify-center mb-4 text-[#FFD100]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Telemetry &amp; Risk ML</h3>
                  <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                    Hybrid isolation-forest anomaly detector coupled with deterministic rules. Evaluates 24-hour volume surges, entropy spikes, and counterparty GST identity records.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] pt-4 border-t border-[#232938]">
                  <div className="text-[#8E9BAE]">
                    RUNTIME: <span className="text-white">Python / Pyodide WASM</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    SCORING SPEED: <span className="text-white">&lt; 14ms</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    REGISTRY: <span className="text-[#FFD100]">Sha256 GST Hashes</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-[#232938] flex items-center justify-center mb-4 text-[#FFD100]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Autonomous Keepers</h3>
                  <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                    FastAPI-powered daemon network continuously monitoring Soroban ledger events. Triggers autonomous execution transactions the second challenge windows elapse.
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] pt-4 border-t border-[#232938]">
                  <div className="text-[#8E9BAE]">
                    BACKEND: <span className="text-white">FastAPI / AsyncIO</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    HORIZON LATENCY: <span className="text-white">Polls every 4s</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    REDUNDANCY: <span className="text-[#FFD100]">3-Node Mesh</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#121620] border border-[#232938] flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 bg-[#232938] flex items-center justify-center mb-4 text-[#FFD100]">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold uppercase text-white mb-2">Institutional Console</h3>
                  <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                    High-density React + TypeScript corporate console. Instant Freighter browser wallet injection with granular role assignment (Treasurer, Risk Officer, Guardian).
                  </p>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] pt-4 border-t border-[#232938]">
                  <div className="text-[#8E9BAE]">
                    WALLET: <span className="text-white">Freighter API v2</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    STATE SYNC: <span className="text-white">Zustand Telemetry</span>
                  </div>
                  <div className="text-[#8E9BAE]">
                    INTERACTION: <span className="text-[#FFD100]">Zero Delay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. VERIFIED SOROBAN TESTNET ANCHOR */}
        <section className="w-full px-4 sm:px-6 lg:px-10 py-16 bg-[#0B0D13] relative overflow-hidden">
          <img
            src="/background.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            style={{
              opacity: 0.22,
              filter: 'grayscale(50%) contrast(115%) brightness(1.05)',
              mixBlendMode: 'screen',
            }}
          />
          <div className="max-w-7xl mx-auto bg-[#121620]/90 border border-[#232938] p-6 sm:p-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD100]" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#FFD100] font-semibold">
                    VERIFIED SOROBAN TESTNET ANCHOR
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold uppercase text-white mb-2">
                  Contract Address &amp; Deployment Hash
                </h3>
                <p className="text-xs text-[#C5CEDE] mb-4 leading-relaxed">
                  All escrow allocations, intent hashes, and guardian multi-sig approvals execute via this verified smart contract deployment on Stellar Testnet. You can inspect transactions directly on the Horizon RPC explorer.
                </p>
                <div className="p-3 bg-[#0B0D13] border border-[#232938] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <a
                    href={CONTRACT_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-white break-all select-all font-medium hover:text-[#FFD100] transition-colors"
                  >
                    CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyContract}
                    className="px-4 py-2 bg-[#161B26] hover:bg-[#FFD100] hover:text-[#0B0D13] text-white font-mono text-[10px] uppercase transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-[#232938] cursor-pointer"
                  >
                    {copiedContract ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedContract ? 'COPIED TO CLIPBOARD!' : 'COPY CONTRACT ID'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#0B0D13] p-4 border border-[#232938] font-mono text-[11px] space-y-2.5">
                <div className="flex justify-between items-center text-[#8E9BAE]">
                  <span>NETWORK</span>
                  <span className="text-white font-semibold">Stellar Testnet</span>
                </div>
                <div className="flex justify-between items-center text-[#8E9BAE]">
                  <span>COMPLIANCE CAP</span>
                  <span className="text-white font-semibold">5,000 XLM / fast</span>
                </div>
                <div className="flex justify-between items-center text-[#8E9BAE]">
                  <span>DISBURSED TODAY</span>
                  <span className="text-[#FFD100] font-semibold">412,850 XLM</span>
                </div>
                <div className="flex justify-between items-center text-[#8E9BAE]">
                  <span>INTERCEPTED DRAINS</span>
                  <span className="text-[#ff6b6b] font-semibold">3 (100% REFUNDED)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. GOLDEN YELLOW CTA BANNER */}
        <section className="w-full sentinel-gold-panel px-4 sm:px-6 lg:px-10 py-14">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#0B0D13] font-bold block mb-2">
                SOVEREIGN CAPITAL INTEGRITY
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl uppercase font-bold tracking-tight leading-none mb-3 text-[#0B0D13]">
                Make every corporate payment earn its release.
              </h2>
              <p className="text-sm sm:text-base text-[#0B0D13]/85 max-w-2xl leading-relaxed">
                Stellar Sentinel is currently live on Stellar Testnet for institutional audits and treasury simulations. Zero irreversible mistakes. Cryptographic mathematical defense.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={isConnecting}
                className="px-7 py-3.5 bg-[#0B0D13] text-white font-mono text-sm uppercase font-bold tracking-tight hover:bg-[#161B26] transition-colors flex items-center justify-center gap-2.5 shadow-xl btn-polygon cursor-pointer disabled:opacity-50"
              >
                <Wallet className="w-4 h-4 text-[#FFD100]" />
                <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING…' : 'CONNECT FREIGHTER'}</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToDocs}
                className="px-7 py-3.5 bg-transparent text-[#0B0D13] font-mono text-sm uppercase font-bold tracking-tight border-2 border-[#0B0D13] hover:bg-[#0B0D13] hover:text-[#FFD100] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>VIEW SPECS</span>
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 pt-4 border-t border-[#0B0D13]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 font-mono text-[10px] uppercase text-[#0B0D13]/85">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 shrink-0" />
              <span>TESTNET TRANSPARENCY: PROTOCOL IS IN PILOT TESTING ON STELLAR TESTNET. NO REAL MAINNET VALUE AT RISK.</span>
            </div>
            <div>
              <span>DEPLOYMENT REVISION: 2025.1-ALPHA</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0B0D13] border-t border-[#232938]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-[#FFD100]" />
                <span className="font-mono text-xs uppercase text-white tracking-wider font-semibold">
                  Soroban Contract Anchor
                </span>
              </div>
              <div className="p-3 bg-[#121620] border border-[#232938]">
                <div className="font-mono text-[10px] text-[#C5CEDE] break-all select-all leading-relaxed">
                  CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2
                </div>
                <button
                  type="button"
                  onClick={handleCopyContract}
                  className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase text-[#FFD100] hover:text-white transition-colors cursor-pointer"
                >
                  {copiedContract ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract ? 'COPIED HASH' : 'COPY WASM HASH'}</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[#FFD100]" />
                <span className="font-mono text-xs uppercase text-white tracking-wider font-semibold">
                  Protocol Specifications
                </span>
              </div>
              <ul className="space-y-2 font-mono text-xs text-[#C5CEDE]">
                <li className="flex justify-between items-center py-1">
                  <span className="text-[#8E9BAE]">Consensus Layer</span>
                  <span className="text-white font-medium">Stellar Testnet</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span className="text-[#8E9BAE]">Custody Model</span>
                  <span className="text-white font-medium">Non-Custodial Vaults</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span className="text-[#8E9BAE]">Authorization Engine</span>
                  <span className="text-white font-medium">Threshold Multi-Sig</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span className="text-[#8E9BAE]">Execution Latency</span>
                  <span className="text-[#FFD100] font-medium">Sub-Second Finality</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-4 h-4 text-[#FFD100]" />
                <span className="font-mono text-xs uppercase text-white tracking-wider font-semibold">
                  Ecosystem Network
                </span>
              </div>
              <ul className="space-y-2 font-mono text-xs text-[#C5CEDE]">
                <li className="py-1">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://stellar.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Stellar Development Foundation</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li className="py-1">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://developers.stellar.org/docs/build/smart-contracts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Soroban Smart Contracts RFC</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li className="py-1">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://www.freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Freighter Wallet Extension</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li className="py-1">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://stellar.expert/explorer/testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Horizon API Explorer</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/Logo.png" alt="Stellar Sentinel" className="w-4 h-4 object-contain" />
                <span className="font-mono text-xs uppercase text-white tracking-wider font-semibold">
                  Architectural Attribution
                </span>
              </div>
              <div className="p-3 bg-[#121620] border border-[#232938] mb-3">
                <span className="block font-mono text-[10px] text-[#8E9BAE] uppercase">Protocol Engineer</span>
                <span className="block font-bold text-base text-white">Earth Kumar Roy</span>
                <span className="block font-mono text-[10px] text-[#FFD100] uppercase mt-1">Lead Defense Architect</span>
              </div>
              <p className="text-xs text-[#8E9BAE] leading-relaxed">
                Formal smart contract verification and high-density algorithmic telemetry on Stellar Core.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#232938] flex flex-col md:flex-row items-center justify-between gap-4 text-[#8E9BAE]">
            <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-wider text-center md:text-left">
              <img src="/Logo.png" alt="" className="w-4 h-4 object-contain opacity-90 shrink-0" />
              <span>© 2025 STELLAR SENTINEL PROTOCOL. NON-CUSTODIAL ASSET INTEGRITY ASSURED.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[10px] uppercase">
              <button type="button" onClick={onNavigateToDocs} className="hover:text-white transition-colors cursor-pointer">
                Audits &amp; Verifications
              </button>
              <button type="button" onClick={onNavigateToDocs} className="hover:text-white transition-colors cursor-pointer">
                Security Disclosures
              </button>
              <button type="button" onClick={onNavigateToDocs} className="hover:text-white transition-colors cursor-pointer">
                Terms of Operation
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;