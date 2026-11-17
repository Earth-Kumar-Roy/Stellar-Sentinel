import React, { useEffect } from 'react';

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

export const LandingPage: React.FC<LandingPageProps> = ({
  walletAddress,
  onConnectWallet,
  onOpenLoginModal,
  onNavigateToRegister,
  onNavigateToDocs,
  onLaunchVault,
  isConnecting,
}) => {
  const handlePrimaryAction = () => {
    if (walletAddress) (onLaunchVault || onConnectWallet)();
    else onConnectWallet();
  };

  useEffect(() => {
    const head = document.head;

    const addLink = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      head.appendChild(link);
    };

    addLink('sentinel-fonts-display', 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
    addLink('sentinel-fonts-icons', 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

    if (!document.getElementById('sentinel-base-style')) {
      const style = document.createElement('style');
      style.id = 'sentinel-base-style';
      style.textContent = 'html,body{margin:0;padding:0;min-height:100%;background:#0B0D13;}body{overscroll-behavior:none;}::-webkit-scrollbar{display:none;}';
      head.appendChild(style);
    }

    const win = window as Window & { tailwind?: { config?: unknown } };
    if (!win.tailwind) win.tailwind = {};
    win.tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            'stellar-yellow': '#FFD100',
            'stellar-gold': '#F5B700',
            'stellar-muted': '#8E9BAE',
            'on-error': '#690005',
            error: '#ff6b6b',
            'outline-variant': '#232938',
            'on-primary-fixed-variant': '#3D3000',
            'primary-container': '#FFD100',
            'error-container': '#93000a',
            'on-secondary-fixed': '#121620',
            'surface-tint': '#FFD100',
            outline: '#7B849B',
            'surface-container-low': '#121620',
            'on-secondary-fixed-variant': '#44483f',
            'on-tertiary': '#2f312d',
            secondary: '#C5CEDE',
            'on-error-container': '#ffdad6',
            'surface-container-lowest': '#0B0D13',
            'inverse-surface': '#e2e3e0',
            'on-primary': '#0B0D13',
            'inverse-on-surface': '#2f312f',
            'on-primary-container': '#0B0D13',
            tertiary: '#ffffff',
            'secondary-fixed': '#e0e4d7',
            'surface-container-highest': '#232938',
            'on-surface-variant': '#A0AABF',
            'tertiary-fixed': '#e3e3dd',
            'surface-dim': '#0B0D13',
            'secondary-fixed-dim': '#9BA5B8',
            'surface-variant': '#232938',
            background: '#0B0D13',
            'on-background': '#F3F6FA',
            surface: '#0E1118',
            'surface-container': '#161B26',
            'on-tertiary-fixed-variant': '#464743',
            'on-surface': '#F3F6FA',
            'tertiary-fixed-dim': '#c6c7c1',
            'surface-container-high': '#232938',
            'inverse-primary': '#B39200',
            'secondary-container': '#232938',
            'on-tertiary-container': '#636560',
            'surface-bright': '#2C3344',
            'primary-fixed-dim': '#F5B700',
            primary: '#ffffff',
            'on-secondary': '#121620',
            'on-primary-fixed': '#0B0D13',
            'on-secondary-container': '#b6baae',
            'on-tertiary-fixed': '#1a1c19',
            'primary-fixed': '#FFE047',
          },
          borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
          spacing: {
            'space-lg': '1.5rem',
            gutter: '1rem',
            'space-sm': '0.5rem',
            'space-xs': '0.25rem',
            'margin-desktop': '2.5rem',
            margin: '1rem',
            'space-md': '1rem',
            'space-xl': '2.5rem',
            'gutter-desktop': '1.5rem',
          },
          fontFamily: {
            'display-lg': ['Space Grotesk'],
            'display-lg-mobile': ['Space Grotesk'],
            'headline-xl': ['Space Grotesk'],
            'headline-xl-mobile': ['Space Grotesk'],
            'headline-md': ['Space Grotesk'],
            'headline-sm': ['Space Grotesk'],
            'body-sm': ['Manrope'],
            'body-md': ['Manrope'],
            'body-lg': ['Manrope'],
            'label-mono-micro': ['JetBrains Mono'],
            'label-mono-sm': ['JetBrains Mono'],
            'label-mono-lg': ['JetBrains Mono'],
            'telemetry-num': ['JetBrains Mono'],
          },
          fontSize: {
            'display-lg-mobile': ['32px', { lineHeight: '38px', letterSpacing: '-0.03em', fontWeight: '700' }],
            'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '400' }],
            'headline-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '600' }],
            'label-mono-micro': ['9px', { lineHeight: '12px', letterSpacing: '0.1em', fontWeight: '600' }],
            'headline-xl-mobile': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
            'telemetry-num': ['20px', { lineHeight: '24px', letterSpacing: '-0.02em', fontWeight: '500' }],
            'label-mono-lg': ['13px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }],
            'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '400' }],
            'headline-xl': ['36px', { lineHeight: '42px', letterSpacing: '-0.03em', fontWeight: '600' }],
            'label-mono-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.06em', fontWeight: '400' }],
            'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '500' }],
            'display-lg': ['48px', { lineHeight: '52px', letterSpacing: '-0.04em', fontWeight: '700' }],
            'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
          },
        },
      },
    };

    if (!document.getElementById('sentinel-tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'sentinel-tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      script.async = false;
      head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const amountSlider = document.getElementById('sim-amount') as HTMLInputElement | null;
    const assetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[id^="asset-btn-"]'));
    const counterpartySelect = document.getElementById('sim-counterparty') as HTMLSelectElement | null;
    const windowButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.sim-window-btn'));
    const copyButton = document.getElementById('copy-contract-btn');
    const copyText = document.getElementById('copy-btn-text');

    let asset: 'XLM' | 'USDC' | 'EURC' = 'XLM';
    let windowHours = 2;
    const multipliers = { XLM: 1, USDC: 5, EURC: 5.55 } as const;

    const setText = (id: string, value: string) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    };
    const setClass = (id: string, value: string) => {
      const node = document.getElementById(id);
      if (node) node.className = value;
    };

    const updateSimulation = () => {
      if (!amountSlider || !counterpartySelect) return;

      const amount = Number(amountSlider.value);
      const xlmEquivalent = amount * multipliers[asset];
      const trust = counterpartySelect.value;
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
      const trustLabels: Record<string, string> = {
        untrusted: 'NO TRUST (UNVERIFIED)',
        band1_ind: 'BAND 1 · INDEPENDENT',
        band1_corp: 'BAND 1 · GST VERIFIED',
        band2_ind: 'BAND 2 · ESTABLISHED',
        band2_corp: 'BAND 2 · FULL WHITELIST',
        entropy_spike: 'ENTROPY ANOMALY',
      };
      setText('sim-nominal-display', `${amount.toLocaleString()} ${asset}`);
      setText('sim-normalized-eq', `(${xlmEquivalent.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM Eq)`);
      setText('sim-out-locked', `${xlmEquivalent.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM Eq (100% Non-Custodial)`);
      setText('sim-out-nearcap', nearCap ? 'TRIPPED (≥4,500 XLM Eq without Band 2)' : 'CLEAR (TRUST / AMOUNT WITHIN POLICY)');
      setText('sim-out-window', `${windowHours.toFixed(1)} Hours`);
      setText('sim-out-quorum', quarantined ? '2-of-2 Multi-Sig Quorum Mandatory' : review ? 'Treasurer + Co-Signer Review' : '1-of-1 (Treasurer FastPath)');
      setText('sim-out-settle', quarantined ? 'Quarantine Hold / Multi-Sig Gated' : review ? 'Observation Window / Review Required' : 'Eligible after observation window');
      setText('sim-gst-badge', trustLabels[trust] || 'UNVERIFIED');
      setText('sim-score-value', String(score));
      setText('sim-status-title', quarantined ? 'QUARANTINE (2-OF-2)' : review ? 'REVIEW REQUIRED' : 'FAST PATH');
      setText('sim-rec-title', quarantined ? 'QUARANTINE ENFORCED: SECONDARY SIGNATURE REQUIRED' : review ? 'POLICY REVIEW REQUIRED' : 'WITHIN DISPLAYED POLICY GUARDRAILS');
      setText(
        'sim-rec-desc',
        quarantined
          ? 'The example crosses the configured risk boundary. Funds remain locked in escrow while the required co-signer or guardian approval is collected.'
          : review
          ? 'The example requires additional review under the displayed risk policy. Funds remain in escrow during the configured observation window.'
          : 'The example remains below the displayed risk threshold. Settlement is eligible only after the observation window and all contract conditions are satisfied.'
      );
      setText('sim-variance-value', `+${variance.toFixed(2)} PTS VARIANCE`);

      const scoreBar = document.getElementById('sim-score-bar') as HTMLElement | null;
      if (scoreBar) {
        scoreBar.style.width = `${score}%`;
        scoreBar.className = `h-full transition-all duration-300 ${quarantined ? 'bg-error' : review ? 'bg-outline' : 'bg-[#FFD100]'}`;
      }
      setClass('sim-score-value', `font-display-lg text-display-lg font-bold ${quarantined ? 'text-error' : review ? 'text-secondary' : 'text-[#FFD100]'}`);
      setClass('sim-status-title', `font-headline-md text-headline-md uppercase font-bold ${quarantined ? 'text-error' : review ? 'text-secondary' : 'text-[#FFD100]'}`);
      setClass('sim-out-quorum', quarantined ? 'text-error font-semibold' : review ? 'text-secondary font-semibold' : 'text-[#FFD100] font-semibold');
      setClass('sim-recommendation-box', `p-space-md bg-surface-container border ${quarantined ? 'border-error' : review ? 'border-outline' : 'border-[#FFD100]'}`);
      setClass('sim-rec-icon', `material-symbols-outlined text-[18px] ${quarantined ? 'text-error' : review ? 'text-secondary' : 'text-[#FFD100]'}`);
      setText('sim-rec-icon', quarantined ? 'warning' : review ? 'policy' : 'verified');
      setClass('sim-rec-title', `font-label-mono-sm text-label-mono-sm uppercase font-semibold ${quarantined ? 'text-error' : review ? 'text-secondary' : 'text-[#FFD100]'}`);

      assetButtons.forEach((button) => {
        const selected = button.id === `asset-btn-${asset.toLowerCase()}`;
        button.className = selected
          ? 'p-space-sm bg-surface-container-highest text-[#FFD100] font-semibold border border-[#FFD100]'
          : 'p-space-sm bg-surface-container text-on-surface border border-surface-container-high';
        button.setAttribute('aria-pressed', String(selected));
      });
      windowButtons.forEach((button) => {
        const selected = Number(button.dataset.hours) === windowHours;
        button.className = selected
          ? 'sim-window-btn p-space-sm bg-surface-container-highest text-[#FFD100] font-semibold border border-[#FFD100]'
          : 'sim-window-btn p-space-sm bg-surface-container text-on-surface border border-surface-container-high';
        button.setAttribute('aria-pressed', String(selected));
      });
    };

    amountSlider?.addEventListener('input', updateSimulation, { signal });
    counterpartySelect?.addEventListener('change', updateSimulation, { signal });
    assetButtons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          const selected = button.id.replace('asset-btn-', '').toUpperCase();
          if (selected === 'XLM' || selected === 'USDC' || selected === 'EURC') asset = selected;
          updateSimulation();
        },
        { signal }
      );
    });
    windowButtons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          windowHours = Number(button.dataset.hours || 2);
          updateSimulation();
        },
        { signal }
      );
    });
    copyButton?.addEventListener(
      'click',
      async () => {
        try {
          await navigator.clipboard.writeText(CONTRACT_ID);
          if (copyText) copyText.textContent = 'COPIED TO CLIPBOARD!';
        } catch {
          if (copyText) copyText.textContent = 'COPY FAILED';
        }
      },
      { signal }
    );

    document.addEventListener(
      'click',
      (event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        if (action === 'connect' && !isConnecting) handlePrimaryAction();
        if (action === 'login') onOpenLoginModal();
        if (action === 'register') onNavigateToRegister();
        if (action === 'docs') onNavigateToDocs();
      },
      { signal }
    );

    updateSimulation();
    return () => controller.abort();
  }, [onConnectWallet, onLaunchVault, onNavigateToDocs, onNavigateToRegister, onOpenLoginModal, walletAddress, isConnecting]);

  return (
    <div className="min-h-screen bg-[#0B0D13] font-body-md text-on-surface antialiased selection:bg-[#FFD100] selection:text-[#0B0D13] relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        html, body { margin: 0; padding: 0; background-color: #0B0D13; }
        body { overscroll-behavior: none; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { display: none; }
        .btn-polygon {
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
        }
        .sentinel-gold-link {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          padding: .8rem 1.05rem;
          color: #FFD100;
          background: rgba(255, 209, 0, 0.08);
          border: 1px solid rgba(255, 209, 0, 0.42);
          font-weight: 700;
          letter-spacing: .055em;
          transition: all .2s ease;
        }
        .sentinel-gold-link:hover {
          color: #0B0D13;
          background: #FFD100;
          border-color: #FFD100;
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(255, 209, 0, 0.22);
        }
        .sentinel-gold-link .material-symbols-outlined { color: inherit; }
        .sentinel-gold-panel {
          background: linear-gradient(115deg, #FFD100 0%, #FFE047 52%, #F5B700 100%);
          color: #0B0D13;
        }
        .sentinel-gold-panel a { border-color: rgba(11, 13, 19, 0.65); color: #0B0D13; }
        .sentinel-gold-panel a:hover { background: #0B0D13; color: #FFD100; }
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 1em; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
      `}</style>

      {/* Fixed Header Matching Navbar.tsx & Logo.png */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-[#232938] bg-[#0B0D13]/95 backdrop-blur-md">
        <div className="h-20 w-full px-margin-desktop flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#FFD100]/10 border border-[#FFD100]/40 group-hover:border-[#FFD100] flex items-center justify-center p-1.5 btn-polygon transition-colors">
              <img
                src="/Logo.png"
                alt="Stellar Sentinel Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col font-mono">
              <span className="font-bold tracking-wider text-base text-white leading-none">
                STELLAR<span className="text-[#FFD100]">SENTINEL</span>
              </span>
              <span className="text-[10px] text-[#8E9BAE] tracking-tight uppercase mt-1">
                TREASURY DEFENSE SYSTEM
              </span>
            </div>
            <span className="hidden sm:inline-block ml-1 font-mono text-[10px] uppercase px-2 py-0.5 border border-[#FFD100]/40 text-[#FFD100] bg-[#FFD100]/10">
              TESTNET
            </span>
          </a>

          <nav className="hidden xl:flex items-center gap-space-lg">
            <a aria-current="page" className="font-label-mono-lg text-label-mono-lg uppercase transition-colors py-space-xs px-space-sm bg-[#FFD100] text-[#0B0D13] font-bold btn-polygon" href="#top">
              Protocol
            </a>
            <a className="font-label-mono-lg text-label-mono-lg uppercase text-[#A0AABF] hover:text-[#FFD100] transition-colors py-space-xs px-space-sm" href="#lifecycle">
              Lifecycle
            </a>
            <a className="font-label-mono-lg text-label-mono-lg uppercase text-[#A0AABF] hover:text-[#FFD100] transition-colors py-space-xs px-space-sm" href="#simulator">
              Risk Engine
            </a>
            <a className="font-label-mono-lg text-label-mono-lg uppercase text-[#A0AABF] hover:text-[#FFD100] transition-colors py-space-xs px-space-sm" href="#specifications">
              Architecture
            </a>
            <a className="font-label-mono-lg text-label-mono-lg uppercase text-[#A0AABF] hover:text-[#FFD100] transition-colors py-space-xs px-space-sm" data-action="docs" href="#">
              Docs
            </a>
          </nav>

          <div className="flex items-center gap-space-md">
            <button
              className="hidden md:flex font-label-mono-sm text-label-mono-sm uppercase text-[#8E9BAE] hover:text-[#FFD100] transition-colors px-space-sm py-space-xs"
              data-action="login"
              type="button"
            >
              Corporate Login
            </button>
            <button
              className="px-5 py-2.5 bg-[#FFD100] text-[#0B0D13] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 btn-polygon hover:bg-[#F5B700] transition-colors cursor-pointer"
              data-action="connect"
              disabled={isConnecting}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING...' : 'CONNECT FREIGHTER'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full pt-20 min-h-[calc(100vh-20rem)] relative z-10" id="top">
        <div className="flex flex-col w-full">
          {/* Status Ticker Bar */}
          <div className="w-full bg-[#0B0D13] text-[#8E9BAE] px-margin-desktop py-space-xs flex flex-wrap items-center justify-between gap-space-sm border-b border-[#232938] relative z-10">
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFD100] inline-block animate-pulse"></span>
                <span className="font-label-mono-micro text-label-mono-micro uppercase text-white tracking-widest">NETWORK: STELLAR TESTNET · RPC 42MS</span>
              </div>
              <span className="hidden sm:inline-block font-label-mono-micro text-label-mono-micro text-[#232938]">|</span>
              <div className="hidden sm:flex items-center gap-space-xs font-label-mono-micro text-label-mono-micro">
                <span className="text-[#8E9BAE] uppercase">WASM CONTRACT:</span>
                <span className="text-white font-medium tracking-tight">CDYQ...Z3C2</span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg font-label-mono-micro text-label-mono-micro uppercase">
              <span className="hidden md:inline">
                <span className="text-[#8E9BAE]">SAC ENGINE:</span> PROTOCOL 21 COMPLIANT
              </span>
              <span className="hidden lg:inline">
                <span className="text-[#8E9BAE]">POLICY ENFORCEMENT:</span> STRICT NON-CUSTODIAL
              </span>
              <span className="text-[#FFD100] font-semibold">ALL DEFENSE RAILS ENGAGED</span>
            </div>
          </div>

          {/* Hero Section with Prominent Logo.png Showcase & Subtle background.png Texture */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0B0D13] relative overflow-hidden">
            {/* Subtle background.png layer */}
            <img
              src="/background.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              style={{
                opacity: 0.35,
                filter: 'grayscale(50%) contrast(120%) brightness(1.1)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Soft edge vignette */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 45%, rgba(255,209,0,0.04) 0%, rgba(11,13,19,0.20) 65%, #0B0D13 100%)',
              }}
            ></div>

            <div className="max-w-[1536px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
              <div className="lg:col-span-7 lg:col-start-2 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs bg-[#121620]/90 border border-[#232938] mb-space-lg">
                    <span className="material-symbols-outlined text-[#FFD100] text-[14px]">shield_with_heart</span>
                    <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#FFD100] font-semibold">SOROBAN TREASURY SURVEILLANCE</span>
                  </div>

                  <h1 className="font-display-lg text-display-lg uppercase tracking-tight text-white mb-space-md leading-[0.95]">
                    Move capital.<br />
                    <span className="text-[#FFD100]">Not risk.</span>
                  </h1>

                  <p className="font-body-lg text-body-lg text-[#C5CEDE] max-w-xl mb-space-xl leading-relaxed">
                    Programmable non-custodial treasury defense on Stellar Soroban. Lock every corporate disbursement into audited escrow, inspect multi-dimensional risk before release, and enforce policy quorums before funds move.
                  </p>

                  <div className="flex flex-wrap items-center gap-space-md mb-space-xl">
                    <button
                      className="group relative px-space-lg py-space-md bg-[#FFD100] text-[#0B0D13] font-headline-sm text-headline-sm uppercase font-bold tracking-tight hover:bg-[#F5B700] transition-all flex items-center gap-space-sm shadow-md btn-polygon"
                      data-action="connect"
                      disabled={isConnecting}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:rotate-45 transition-transform">terminal</span>
                      <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING…' : 'CONNECT FREIGHTER'}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                    <a
                      className="px-space-lg py-space-md bg-[#121620]/90 text-white font-headline-sm text-headline-sm uppercase tracking-tight border border-[#232938] hover:border-[#FFD100] hover:text-[#FFD100] transition-all flex items-center gap-space-xs btn-polygon"
                      href="#simulator"
                    >
                      <span>EXPLORE PROTOCOL</span>
                      <span className="material-symbols-outlined text-[18px]">tune</span>
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-space-sm pt-space-md border-t border-[#232938] font-label-mono-sm text-label-mono-sm uppercase">
                    <a className="sentinel-gold-link" data-action="login" href="#specifications">
                      <span className="material-symbols-outlined text-[14px]">corporate_fare</span>
                      <span>Corporate Access</span>
                    </a>

                    <a className="sentinel-gold-link" data-action="register" href="#lifecycle">
                      <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                      <span>Register Entity</span>
                    </a>

                    <a className="sentinel-gold-link" href="#simulator">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>Test Simulator</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-space-xs mt-space-xl pt-space-lg border-t border-[#232938]">
                  <div className="p-space-sm bg-[#121620]/90 border border-[#232938]">
                    <span className="block font-label-mono-micro text-label-mono-micro uppercase text-[#8E9BAE]">EXECUTION</span>
                    <span className="block font-headline-sm text-headline-sm text-white mt-space-xs">NON-CUSTODIAL</span>
                    <span className="block font-label-mono-micro text-label-mono-micro text-[#9BA5B8]">Soroban Smart Escrow</span>
                  </div>
                  <div className="p-space-sm bg-[#121620]/90 border border-[#232938]">
                    <span className="block font-label-mono-micro text-label-mono-micro uppercase text-[#8E9BAE]">ENVIRONMENT</span>
                    <span className="block font-headline-sm text-headline-sm text-[#FFD100] mt-space-xs">TESTNET LIVE</span>
                    <span className="block font-label-mono-micro text-label-mono-micro text-[#9BA5B8]">RPC Sync Verified</span>
                  </div>
                  <div className="p-space-sm bg-[#121620]/90 border border-[#232938]">
                    <span className="block font-label-mono-micro text-label-mono-micro uppercase text-[#8E9BAE]">ASSET SUPPORT</span>
                    <span className="block font-headline-sm text-headline-sm text-white mt-space-xs">SAC NATIVE</span>
                    <span className="block font-label-mono-micro text-label-mono-micro text-[#9BA5B8]">XLM · USDC · EURC</span>
                  </div>
                </div>
              </div>

              {/* Large Prominent Logo.png Showcase Panel */}
              <div className="lg:col-span-3 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-[300px] aspect-square bg-[#121620]/90 border border-[#FFD100]/40 p-space-lg flex flex-col items-center justify-center btn-polygon shadow-[0_0_50px_rgba(255,209,0,0.12)] group">
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
                  <div className="mt-space-md pt-space-sm border-t border-[#232938] w-full flex items-center justify-between font-label-mono-micro text-label-mono-micro uppercase relative z-10">
                    <span className="text-[#8E9BAE]">SENTINEL CORE</span>
                    <span className="text-[#FFD100] font-bold">v2.1 ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4-Column Feature Strip */}
          <section className="w-full bg-[#0E1118] border-y border-[#232938]">
            <div className="max-w-[1536px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232938]">
              <div className="p-space-lg flex flex-col justify-between hover:bg-[#121620] transition-colors">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-mono-lg text-label-mono-lg text-[#FFD100] font-bold">01</span>
                  <span className="material-symbols-outlined text-[#8E9BAE] text-[20px]">lock</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">NON-CUSTODIAL</h3>
                  <p className="font-body-sm text-body-sm text-[#C5CEDE]">
                    Disbursements lock directly into Soroban smart contracts. Neither Sentinel operators nor intermediaries possess asset custody.
                  </p>
                </div>
                <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase tracking-wider mt-space-md">ATOMIC RUST SMART CONTRACT</span>
              </div>
              <div className="p-space-lg flex flex-col justify-between hover:bg-[#121620] transition-colors">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-mono-lg text-label-mono-lg text-[#FFD100] font-bold">02 — 12H</span>
                  <span className="material-symbols-outlined text-[#8E9BAE] text-[20px]">timelapse</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">OBSERVATION WINDOW</h3>
                  <p className="font-body-sm text-body-sm text-[#C5CEDE]">
                    Programmable latency buffer designed for high-value flows, empowering risk inspectors and guardians to challenge anomalous payouts.
                  </p>
                </div>
                <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase tracking-wider mt-space-md">CONFIGURABLE TIME-LOCK HORIZON</span>
              </div>
              <div className="p-space-lg flex flex-col justify-between hover:bg-[#121620] transition-colors">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-mono-lg text-label-mono-lg text-[#FFD100] font-bold">75+</span>
                  <span className="material-symbols-outlined text-[#8E9BAE] text-[20px]">monitoring</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">RISK THRESHOLD</h3>
                  <p className="font-body-sm text-body-sm text-[#C5CEDE]">
                    Real-time isolation-forest algorithms monitor velocity, address freshness, and corporate GST hash matches to trigger multi-sig holds.
                  </p>
                </div>
                <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase tracking-wider mt-space-md">ALGORITHMIC QUARANTINE LOGIC</span>
              </div>
              <div className="p-space-lg flex flex-col justify-between hover:bg-[#121620] transition-colors">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-mono-lg text-label-mono-lg text-[#FFD100] font-bold">SAC NATIVE</span>
                  <span className="material-symbols-outlined text-[#8E9BAE] text-[20px]">currency_exchange</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">XLM · USDC · EURC</h3>
                  <p className="font-body-sm text-body-sm text-[#C5CEDE]">
                    Zero protocol wrapping required. Works seamlessly with Stellar Asset Contracts, respecting corporate trustlines and compliance mandates.
                  </p>
                </div>
                <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase tracking-wider mt-space-md">NATIVE ASSET COMPATIBILITY</span>
              </div>
            </div>
          </section>

          {/* Systemic Vulnerability Audit */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0B0D13]">
            <div className="max-w-[1536px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
                <div className="lg:col-span-5">
                  <div className="inline-flex items-center gap-space-xs font-label-mono-micro text-label-mono-micro text-error uppercase tracking-widest mb-space-sm">
                    <span className="w-2 h-2 bg-error"></span>
                    <span>SYSTEMIC VULNERABILITY AUDIT</span>
                  </div>
                  <h2 className="font-headline-xl text-headline-xl uppercase text-white tracking-tight leading-tight mb-space-md">
                    A single transaction should never be an irreversible leap of faith.
                  </h2>
                  <p className="font-body-md text-body-md text-[#C5CEDE] mb-space-md leading-relaxed">
                    In standard corporate crypto treasuries, signing a transaction broadcasts it straight to the ledger with zero grace period. When hot keys are compromised, recipient addresses are subtly spoofed, or rogue actors initiate drain attempts, funds vanish in milliseconds.
                  </p>
                  <p className="font-body-md text-body-md text-[#C5CEDE] leading-relaxed mb-space-lg">
                    Stellar Sentinel inserts a deterministic defense boundary between intent and settlement. By enforcing an observation window governed by automated risk inspection, organizations retain complete governance over their sovereign treasury reserves.
                  </p>
                  <div className="p-space-md bg-[#121620] border-l-2 border-[#FFD100]">
                    <div className="font-label-mono-sm text-label-mono-sm uppercase text-[#FFD100] font-semibold mb-1">DEFENSE AXIOM #01</div>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE]">
                      "Settlement finality should be an asset, not a vector for catastrophic corporate capital extraction."
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="p-space-lg bg-[#121620] border border-[#232938]">
                    <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#232938]">
                      <span className="font-label-mono-micro text-label-mono-micro uppercase text-error font-semibold">TRADITIONAL WEB3 TREASURY</span>
                      <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm uppercase text-white mb-space-xs">Instant Irrevocable Leak</h4>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Once a transaction is broadcasted, consensus commits it permanently. Malicious or erroneous transfers cannot be rescinded or audited in-flight.
                    </p>
                    <div className="p-space-xs bg-[#0B0D13] font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">
                      REMEDY: POST-MORTEM POLICE REPORTS
                    </div>
                  </div>

                  <div className="p-space-lg bg-[#121620] border border-[#FFD100]/40">
                    <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#232938]">
                      <span className="font-label-mono-micro text-label-mono-micro uppercase text-[#FFD100] font-semibold">STELLAR SENTINEL PROTOCOL</span>
                      <span className="material-symbols-outlined text-[#FFD100] text-[18px]">verified_user</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm uppercase text-white mb-space-xs">Programmable Time-Lock Escrow</h4>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Funds are committed into a non-custodial Soroban vault with an immutable cooling period. The capital remains untouchable by the destination until cleared.
                    </p>
                    <div className="p-space-xs bg-[#0B0D13] font-label-mono-micro text-label-mono-micro text-[#FFD100] uppercase font-semibold">
                      REMEDY: ATOMIC TREASURY REFUND
                    </div>
                  </div>

                  <div className="p-space-lg bg-[#121620] border border-[#232938]">
                    <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#232938]">
                      <span className="font-label-mono-micro text-label-mono-micro uppercase text-error font-semibold">BLIND MULTI-SIG APPROVAL</span>
                      <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm uppercase text-white mb-space-xs">Signer Fatigue &amp; Exploits</h4>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Co-signers blindly approve raw hexadecimal payloads under urgency, rubber-stamping sophisticated wallet drainer contracts or fraudulent invoices.
                    </p>
                    <div className="p-space-xs bg-[#0B0D13] font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">
                      TELEMETRY: NONE (BLIND SIGNING)
                    </div>
                  </div>

                  <div className="p-space-lg bg-[#121620] border border-[#FFD100]/40">
                    <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#232938]">
                      <span className="font-label-mono-micro text-label-mono-micro uppercase text-[#FFD100] font-semibold">TELEMETRY-BACKED QUORUM</span>
                      <span className="material-symbols-outlined text-[#FFD100] text-[18px]">query_stats</span>
                    </div>
                    <h4 className="font-headline-sm text-headline-sm uppercase text-white mb-space-xs">Multi-Dimensional ML Scoring</h4>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Every payout triggers real-time velocity, volume surge, and corporate vendor registry inspection. Anomaly triggers dynamic escalation to 2-of-2 multi-sig.
                    </p>
                    <div className="p-space-xs bg-[#0B0D13] font-label-mono-micro text-label-mono-micro text-[#FFD100] uppercase font-semibold">
                      TELEMETRY: PYODIDE ML &amp; GST REGISTRY
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4-Stage Lifecycle */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0E1118] border-y border-[#232938]" id="lifecycle">
            <div className="max-w-[1536px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl pb-space-md border-b border-[#232938] gap-space-md">
                <div>
                  <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#FFD100] font-semibold block mb-space-xs">SYSTEM EXECUTION PIPELINE</span>
                  <h2 className="font-headline-xl text-headline-xl uppercase text-white tracking-tight">The 4-Stage Lifecycle of an Intent</h2>
                </div>
                <div className="font-label-mono-sm text-label-mono-sm uppercase text-[#C5CEDE]">
                  STATE MACHINE: <span className="text-white font-semibold">LOCKED → INSPECTED → QUORUM → SETTLED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md relative">
                <div className="bg-[#121620] p-space-lg border border-[#232938] relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-md">
                      <span className="px-space-xs py-0.5 bg-[#0B0D13] text-[#FFD100] font-label-mono-sm text-label-mono-sm font-bold border border-[#232938]">STAGE 01</span>
                      <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">SOROBAN OP</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Create Intent</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] leading-relaxed mb-space-md">
                      Treasurer specifies beneficiary wallet, native SAC asset, volume, corporate purpose hash, and sets the 2h to 12h challenge duration.
                    </p>
                  </div>
                  <div className="pt-space-md border-t border-[#232938] space-y-1 font-label-mono-micro text-label-mono-micro text-[#8E9BAE]">
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

                <div className="bg-[#121620] p-space-lg border border-[#232938] relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-md">
                      <span className="px-space-xs py-0.5 bg-[#0B0D13] text-[#FFD100] font-label-mono-sm text-label-mono-sm font-bold border border-[#232938]">STAGE 02</span>
                      <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">OFF-CHAIN ML</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Inspect Risk</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] leading-relaxed mb-space-md">
                      Python/Pyodide pipeline extracts disbursement telemetry: 24h address velocity, cluster deviation, verified corporate GST hash, and trust-band tier.
                    </p>
                  </div>
                  <div className="pt-space-md border-t border-[#232938] space-y-1 font-label-mono-micro text-label-mono-micro text-[#8E9BAE]">
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

                <div className="bg-[#121620] p-space-lg border border-[#232938] relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-md">
                      <span className="px-space-xs py-0.5 bg-[#0B0D13] text-[#FFD100] font-label-mono-sm text-label-mono-sm font-bold border border-[#232938]">STAGE 03</span>
                      <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">DYNAMIC QUORUM</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Policy Quorum</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] leading-relaxed mb-space-md">
                      Scores &lt;75 navigate FastPath (single signature). Scores ≥75 enter Quarantine, mandating multi-sig endorsement from authorized co-signers.
                    </p>
                  </div>
                  <div className="pt-space-md border-t border-[#232938] space-y-1 font-label-mono-micro text-label-mono-micro text-[#8E9BAE]">
                    <div className="flex justify-between">
                      <span>FastPath:</span> <span className="text-[#FFD100]">1-of-1 Autopilot</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quarantine:</span> <span className="text-error">2-of-2 Multi-Sig</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Challenge:</span> <span className="text-white">Guardian Override</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121620] p-space-lg border border-[#232938] relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-md">
                      <span className="px-space-xs py-0.5 bg-[#0B0D13] text-[#FFD100] font-label-mono-sm text-label-mono-sm font-bold border border-[#232938]">STAGE 04</span>
                      <span className="font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">FINALITY</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Settle or Refund</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] leading-relaxed mb-space-md">
                      Automated keeper daemon executes payout upon window expiry if unchallenged. If an emergency challenge is verified, 100% of escrow refunds to treasury.
                    </p>
                  </div>
                  <div className="pt-space-md border-t border-[#232938] space-y-1 font-label-mono-micro text-label-mono-micro text-[#8E9BAE]">
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

          {/* Interactive Client-Side Risk Simulator */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0B0D13]" id="simulator">
            <div className="max-w-[1536px] mx-auto">
              <div className="max-w-2xl mb-space-xl">
                <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#FFD100] font-semibold block mb-space-xs">CLIENT-SIDE RISK SIMULATOR · PYTHON ALGORITHM REFLECTION</span>
                <h2 className="font-headline-xl text-headline-xl uppercase text-white tracking-tight mb-space-xs">Test the Soroban Policy Engine</h2>
                <p className="font-body-md text-body-md text-[#C5CEDE]">
                  Adjust SAC asset type, nominal volume, and counterparty trust tiers to inspect how the telemetry engine calculates SAC normalization (1,000 USDC / 900 EURC = 5,000 XLM), logs the dynamic amount variance formula, and trips the Near-Cap Anomaly Gate at 4,500 XLM equivalent.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
                <div className="lg:col-span-6 bg-[#121620] border border-[#232938] p-space-xl">
                  <div className="flex items-center justify-between pb-space-sm mb-space-lg border-b border-[#232938]">
                    <span className="font-label-mono-sm text-label-mono-sm uppercase text-white font-semibold">INTENT SIMULATOR CONTROLS</span>
                    <span className="font-label-mono-micro text-label-mono-micro text-[#FFD100] uppercase font-bold">SAC &amp; VARIANCE ALGO V2</span>
                  </div>
                  <div className="mb-space-lg">
                    <label className="font-label-mono-sm text-label-mono-sm uppercase text-white block mb-space-xs">SAC Asset Selection &amp; Normalization Multiplier</label>
                    <div className="grid grid-cols-3 gap-space-xs font-label-mono-sm text-label-mono-sm uppercase">
                      <button className="p-space-sm bg-[#232938] text-[#FFD100] font-semibold border border-[#FFD100]" id="asset-btn-xlm" type="button">
                        XLM (1.0x)
                      </button>
                      <button className="p-space-sm bg-[#161B26] text-white border border-[#232938]" id="asset-btn-usdc" type="button">
                        USDC (5.0x)
                      </button>
                      <button className="p-space-sm bg-[#161B26] text-white border border-[#232938]" id="asset-btn-eurc" type="button">
                        EURC (5.55x)
                      </button>
                    </div>
                    <div className="flex justify-between font-label-mono-micro text-label-mono-micro text-[#8E9BAE] mt-space-xs">
                      <span>XLM: 1.0x Native</span>
                      <span>USDC: 1,000 = 5,000 XLM</span>
                      <span>EURC: 900 = 5,000 XLM</span>
                    </div>
                  </div>
                  <div className="mb-space-xl">
                    <div className="flex justify-between items-baseline mb-space-xs">
                      <label className="font-label-mono-sm text-label-mono-sm uppercase text-white" htmlFor="sim-amount">
                        Disbursement Nominal Amount
                      </label>
                      <div className="flex items-baseline gap-space-xs">
                        <span className="font-telemetry-num text-telemetry-num text-[#FFD100] font-bold" id="sim-nominal-display">
                          4,500 XLM
                        </span>
                        <span className="font-label-mono-micro text-label-mono-micro text-[#C5CEDE]" id="sim-normalized-eq">
                          (4,500 XLM Eq)
                        </span>
                      </div>
                    </div>
                    <input className="w-full h-2 bg-[#0B0D13] appearance-none cursor-pointer accent-[#FFD100] border border-[#232938]" id="sim-amount" max="10000" min="200" step="100" type="range" defaultValue="4500" />
                    <div className="flex justify-between font-label-mono-micro text-label-mono-micro text-[#8E9BAE] mt-space-xs">
                      <span>Min (200)</span>
                      <span className="text-error font-medium">NEAR-CAP GATE: 4,500 XLM EQ</span>
                      <span>Max (10,000)</span>
                    </div>
                  </div>
                  <div className="mb-space-xl">
                    <div className="flex justify-between items-baseline mb-space-xs">
                      <label className="font-label-mono-sm text-label-mono-sm uppercase text-white" htmlFor="sim-counterparty">
                        Counterparty Trust Band Hierarchy
                      </label>
                      <span className="font-label-mono-micro text-label-mono-micro text-error uppercase font-bold" id="sim-gst-badge">
                        NO TRUST (UNVERIFIED)
                      </span>
                    </div>
                    <select className="w-full p-space-sm bg-[#0B0D13] text-white font-label-mono-sm text-label-mono-sm border border-[#232938] focus:border-[#FFD100] focus:outline-none" defaultValue="band2_corp" id="sim-counterparty">
                      <option value="untrusted">Unregistered Independent (0 Historical Tx · New Keypair)</option>
                      <option value="band1_ind">Band 1 Independent (7+ Tx Historical Baseline · FastPath Cap 2.5k)</option>
                      <option value="band1_corp">Band 1 Corporate GST (10+ Tx Verified GST Registry)</option>
                      <option value="band2_ind">Band 2 Independent (13+ Tx High Settlement History)</option>
                      <option value="band2_corp">Band 2 Corporate GST (18+ Tx Full Whitelist · Near-Cap Immune)</option>
                      <option value="entropy_spike">Entropy Anomaly Spike (25x Surge over 15-Tx Baseline)</option>
                    </select>
                  </div>
                  <div className="mb-space-lg">
                    <label className="font-label-mono-sm text-label-mono-sm uppercase text-white block mb-space-xs">Configured Latency Window</label>
                    <div className="grid grid-cols-3 gap-space-xs font-label-mono-sm text-label-mono-sm uppercase">
                      <button className="sim-window-btn p-space-sm bg-[#232938] text-[#FFD100] font-semibold border border-[#FFD100]" data-hours="2" type="button">
                        2 Hours
                      </button>
                      <button className="sim-window-btn p-space-sm bg-[#161B26] text-white border border-[#232938]" data-hours="6" type="button">
                        6 Hours
                      </button>
                      <button className="sim-window-btn p-space-sm bg-[#161B26] text-white border border-[#232938]" data-hours="12" type="button">
                        12 Hours
                      </button>
                    </div>
                  </div>
                  <div className="p-space-sm bg-[#0B0D13] border border-[#232938] font-label-mono-micro text-label-mono-micro space-y-1">
                    <div className="flex items-center justify-between text-[#8E9BAE]">
                      <span>DYNAMIC AMOUNT VARIANCE FORMULA:</span>
                      <span className="text-[#FFD100] font-bold" id="sim-variance-value">
                        +6.78 PTS VARIANCE
                      </span>
                    </div>
                    <div className="text-[#A0AABF] font-mono text-[10px] break-all">amount_dynamic_var = 1.85 * log10(max(xlm_equivalent, 1) + 9)</div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#121620] border border-[#232938] p-space-xl">
                  <div className="flex items-center justify-between pb-space-sm mb-space-lg border-b border-[#232938]">
                    <span className="font-label-mono-sm text-label-mono-sm uppercase text-white font-semibold">PREDICTED SETTLEMENT VERDICT</span>
                    <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-wider text-[#8E9BAE]">SOROBAN WASM DISPATCH</span>
                  </div>
                  <div className="bg-[#0B0D13] p-space-lg border border-[#232938] mb-space-lg">
                    <div className="flex items-end justify-between mb-space-sm">
                      <div>
                        <span className="font-label-mono-micro text-label-mono-micro uppercase text-[#8E9BAE] block">COMPUTED RISK SCORE</span>
                        <span className="font-display-lg text-display-lg font-bold text-error" id="sim-score-value">
                          78
                        </span>
                        <span className="font-headline-sm text-headline-sm text-[#8E9BAE]"> / 100</span>
                      </div>
                      <div className="text-right">
                        <span className="font-label-mono-micro text-label-mono-micro uppercase text-[#8E9BAE] block">EXECUTION TRACK</span>
                        <span className="font-headline-md text-headline-md uppercase font-bold text-error" id="sim-status-title">
                          QUARANTINE (2-OF-2)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-[#232938] overflow-hidden flex">
                      <div className="h-full bg-error transition-all duration-300" id="sim-score-bar" style={{ width: '78%' }}></div>
                    </div>
                    <div className="flex justify-between font-label-mono-micro text-label-mono-micro text-[#8E9BAE] mt-space-xs">
                      <span>0 (CLEAN)</span>
                      <span className="text-[#C5CEDE] font-semibold">QUARANTINE THRESHOLD (75)</span>
                      <span>100 (CRITICAL)</span>
                    </div>
                  </div>
                  <div className="space-y-space-xs font-label-mono-sm text-label-mono-sm mb-space-lg">
                    <div className="p-space-sm bg-[#161B26] flex items-center justify-between border-b border-[#232938]">
                      <span className="text-[#8E9BAE] uppercase">Normalized XLM Exposure:</span>
                      <span className="text-white font-semibold" id="sim-out-locked">
                        4,500 XLM Eq (100% Non-Custodial)
                      </span>
                    </div>
                    <div className="p-space-sm bg-[#161B26] flex items-center justify-between border-b border-[#232938]">
                      <span className="text-[#8E9BAE] uppercase">Near-Cap Gate Status:</span>
                      <span className="text-error font-semibold" id="sim-out-nearcap">
                        TRIPPED (≥4,500 XLM Eq without Band 2)
                      </span>
                    </div>
                    <div className="p-space-sm bg-[#161B26] flex items-center justify-between border-b border-[#232938]">
                      <span className="text-[#8E9BAE] uppercase">Challenge Horizon:</span>
                      <span className="text-white font-semibold" id="sim-out-window">
                        2.0 Hours
                      </span>
                    </div>
                    <div className="p-space-sm bg-[#161B26] flex items-center justify-between border-b border-[#232938]">
                      <span className="text-[#8E9BAE] uppercase">Signer Quorum:</span>
                      <span className="text-error font-semibold" id="sim-out-quorum">
                        2-of-2 Multi-Sig Quorum Mandatory
                      </span>
                    </div>
                    <div className="p-space-sm bg-[#161B26] flex items-center justify-between">
                      <span className="text-[#8E9BAE] uppercase">Settlement Mechanism:</span>
                      <span className="text-white font-semibold" id="sim-out-settle">
                        Quarantine Hold / Multi-Sig Gated
                      </span>
                    </div>
                  </div>
                  <div className="p-space-md bg-[#161B26] border border-error" id="sim-recommendation-box">
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="material-symbols-outlined text-[18px] text-error" id="sim-rec-icon">
                        warning
                      </span>
                      <span className="font-label-mono-sm text-label-mono-sm uppercase font-semibold text-error" id="sim-rec-title">
                        NEAR-CAP ANOMALY GATE ACTIVE (SCORE 78+)
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] leading-relaxed" id="sim-rec-desc">
                      Exposure reached the 4,500 XLM equivalent boundary without Band 2 co-signer clearance. The Soroban state machine enforces 2-of-2 multi-sig quorum before autonomous settlement is permissible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Protocol Specifications */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0E1118] border-y border-[#232938]" id="specifications">
            <div className="max-w-[1536px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl pb-space-md border-b border-[#232938] gap-space-md">
                <div>
                  <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#FFD100] font-semibold block mb-space-xs">PROTOCOL SPECIFICATIONS</span>
                  <h2 className="font-headline-xl text-headline-xl uppercase text-white tracking-tight">Full Technical Stack Architecture</h2>
                </div>
                <div className="font-label-mono-sm text-label-mono-sm uppercase text-[#8E9BAE]">STELLAR PROTOCOL 21 · SOROBAN ENVIRONMENT</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="p-space-lg bg-[#121620] border border-[#232938] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-[#232938] flex items-center justify-center mb-space-md text-[#FFD100]">
                      <span className="material-symbols-outlined text-[20px]">code</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">On-Chain Engine</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Implemented in strict no_std Rust. Implements an immutable state machine, atomic ledger-level refunds, cryptographic intent hashes, and cross-contract Stellar Asset transfers.
                    </p>
                  </div>
                  <div className="space-y-space-xs font-label-mono-micro text-label-mono-micro pt-space-md border-t border-[#232938]">
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

                <div className="p-space-lg bg-[#121620] border border-[#232938] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-[#232938] flex items-center justify-center mb-space-md text-[#FFD100]">
                      <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Telemetry &amp; Risk ML</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      Hybrid isolation-forest anomaly detector coupled with deterministic rules. Evaluates 24-hour volume surges, entropy spikes, and counterparty GST identity records.
                    </p>
                  </div>
                  <div className="space-y-space-xs font-label-mono-micro text-label-mono-micro pt-space-md border-t border-[#232938]">
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

                <div className="p-space-lg bg-[#121620] border border-[#232938] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-[#232938] flex items-center justify-center mb-space-md text-[#FFD100]">
                      <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Autonomous Keepers</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      FastAPI-powered daemon network continuously monitoring Soroban ledger events. Triggers autonomous execution transactions the second challenge windows elapse.
                    </p>
                  </div>
                  <div className="space-y-space-xs font-label-mono-micro text-label-mono-micro pt-space-md border-t border-[#232938]">
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

                <div className="p-space-lg bg-[#121620] border border-[#232938] flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 bg-[#232938] flex items-center justify-center mb-space-md text-[#FFD100]">
                      <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-white font-semibold mb-space-xs">Institutional Console</h3>
                    <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                      High-density React + TypeScript corporate console. Instant Freighter browser wallet injection with granular role assignment (Treasurer, Risk Officer, Guardian).
                    </p>
                  </div>
                  <div className="space-y-space-xs font-label-mono-micro text-label-mono-micro pt-space-md border-t border-[#232938]">
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

          {/* Verified Soroban Testnet Anchor */}
          <section className="w-full px-margin-desktop py-space-xl bg-[#0B0D13] relative overflow-hidden">
            <img
              src="/background.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              style={{
                opacity: 0.25,
                filter: 'grayscale(50%) contrast(115%) brightness(1.05)',
                mixBlendMode: 'screen',
              }}
            />
            <div className="max-w-[1536px] mx-auto bg-[#121620]/90 border border-[#232938] p-space-xl relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-space-xs mb-space-xs">
                    <span className="w-2 h-2 rounded-full bg-[#FFD100]"></span>
                    <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#FFD100] font-semibold">VERIFIED SOROBAN TESTNET ANCHOR</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md uppercase text-white font-semibold mb-space-sm">Contract Address &amp; Deployment Hash</h3>
                  <p className="font-body-sm text-body-sm text-[#C5CEDE] mb-space-md leading-relaxed">
                    All escrow allocations, intent hashes, and guardian multi-sig approvals execute via this verified smart contract deployment on Stellar Testnet. You can inspect transactions directly on the Horizon RPC explorer.
                  </p>
                  <div className="p-space-sm bg-[#0B0D13] border border-[#232938] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
                    <a href={CONTRACT_URL} target="_blank" rel="noreferrer" className="font-label-mono-sm text-label-mono-sm text-white break-all select-all font-medium hover:text-[#FFD100] transition-colors">
                      CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2
                    </a>
                    <button
                      className="px-space-md py-space-xs bg-[#161B26] hover:bg-[#FFD100] hover:text-[#0B0D13] text-white font-label-mono-micro text-label-mono-micro uppercase transition-colors shrink-0 flex items-center justify-center gap-space-xs border border-[#232938]"
                      id="copy-contract-btn"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      <span id="copy-btn-text">COPY CONTRACT ID</span>
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-[#0B0D13] p-space-md border border-[#232938] font-label-mono-micro text-label-mono-micro space-y-2">
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
                    <span className="text-error font-semibold">3 (100% REFUNDED)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Golden Yellow CTA Banner */}
          <section className="w-full sentinel-gold-panel px-margin-desktop py-space-xl">
            <div className="max-w-[1536px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-space-xl">
              <div>
                <span className="font-label-mono-micro text-label-mono-micro uppercase tracking-widest text-[#0B0D13] font-bold block mb-space-xs">SOVEREIGN CAPITAL INTEGRITY</span>
                <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg uppercase font-bold tracking-tight leading-none mb-space-sm text-[#0B0D13]">
                  Make every corporate payment earn its release.
                </h2>
                <p className="font-body-lg text-body-lg text-[#0B0D13]/85 max-w-2xl leading-relaxed">
                  Stellar Sentinel is currently live on Stellar Testnet for institutional audits and treasury simulations. Zero irreversible mistakes. Cryptographic mathematical defense.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md shrink-0">
                <button
                  className="px-space-xl py-space-md bg-[#0B0D13] text-white font-headline-sm text-headline-sm uppercase font-bold tracking-tight hover:bg-[#161B26] transition-colors flex items-center justify-center gap-space-sm shadow-xl btn-polygon"
                  data-action="connect"
                  disabled={isConnecting}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#FFD100]">account_balance_wallet</span>
                  <span>{walletAddress ? 'OPEN TREASURY' : isConnecting ? 'CONNECTING…' : 'CONNECT FREIGHTER'}</span>
                </button>
                <a
                  className="px-space-xl py-space-md bg-transparent text-[#0B0D13] font-headline-sm text-headline-sm uppercase font-bold tracking-tight border-2 border-[#0B0D13] hover:bg-[#0B0D13] hover:text-[#FFD100] transition-colors flex items-center justify-center gap-space-xs"
                  data-action="docs"
                  href="#specifications"
                >
                  <span>VIEW SPECS</span>
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                </a>
              </div>
            </div>

            <div className="max-w-[1536px] mx-auto mt-space-xl pt-space-md border-t border-[#0B0D13]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-sm font-label-mono-micro text-label-mono-micro uppercase text-[#0B0D13]/85">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>TESTNET TRANSPARENCY: PROTOCOL IS IN PILOT TESTING ON STELLAR TESTNET. NO REAL MAINNET VALUE AT RISK.</span>
              </div>
              <div>
                <span>DEPLOYMENT REVISION: 2025.1-ALPHA</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer with Logo Brand Anchor */}
      <footer className="w-full bg-[#0B0D13] border-t border-[#232938] relative z-10">
        <div className="w-full px-margin-desktop py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl">
            <div>
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="material-symbols-outlined text-[#FFD100] text-[18px]">terminal</span>
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-white tracking-wider font-semibold">Soroban Contract Anchor</span>
              </div>
              <div className="p-space-sm bg-[#121620] border border-[#232938]">
                <div className="font-label-mono-micro text-label-mono-micro text-[#C5CEDE] break-all select-all leading-relaxed">
                  CDYQLHZ3KBXVJVC5LGGXJTXXBEIA4BGZHLJKZ3JY2FA4FEGURT7YZ3C2
                </div>
                <button className="mt-space-sm inline-flex items-center gap-space-xs font-label-mono-micro text-label-mono-micro uppercase text-[#FFD100] hover:text-white transition-colors" type="button">
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>COPY WASM HASH</span>
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="material-symbols-outlined text-[#FFD100] text-[18px]">security</span>
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-white tracking-wider font-semibold">Protocol Specifications</span>
              </div>
              <ul className="space-y-space-xs font-label-mono-sm text-label-mono-sm text-[#C5CEDE]">
                <li className="flex justify-between items-center py-space-xs">
                  <span className="text-[#8E9BAE]">Consensus Layer</span>
                  <span className="text-white font-medium">Stellar Testnet</span>
                </li>
                <li className="flex justify-between items-center py-space-xs">
                  <span className="text-[#8E9BAE]">Custody Model</span>
                  <span className="text-white font-medium">Non-Custodial Vaults</span>
                </li>
                <li className="flex justify-between items-center py-space-xs">
                  <span className="text-[#8E9BAE]">Authorization Engine</span>
                  <span className="text-white font-medium">Threshold Multi-Sig</span>
                </li>
                <li className="flex justify-between items-center py-space-xs">
                  <span className="text-[#8E9BAE]">Execution Latency</span>
                  <span className="text-[#FFD100] font-medium">Sub-Second Finality</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="material-symbols-outlined text-[#FFD100] text-[18px]">hub</span>
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-white tracking-wider font-semibold">Ecosystem Network</span>
              </div>
              <ul className="space-y-space-xs font-label-mono-sm text-label-mono-sm text-[#C5CEDE]">
                <li className="py-space-xs">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://stellar.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Stellar Development Foundation</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </a>
                </li>
                <li className="py-space-xs">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://developers.stellar.org/docs/build/smart-contracts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Soroban Smart Contracts RFC</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </a>
                </li>
                <li className="py-space-xs">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://www.freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Freighter Wallet Extension</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </a>
                </li>
                <li className="py-space-xs">
                  <a
                    className="hover:text-[#FFD100] transition-colors flex items-center justify-between"
                    href="https://stellar.expert/explorer/testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Horizon API Explorer</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-space-xs mb-space-sm">
                <img src="/Logo.png" alt="Stellar Sentinel" className="w-4 h-4 object-contain" />
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-white tracking-wider font-semibold">Architectural Attribution</span>
              </div>
              <div className="p-space-sm bg-[#121620] border border-[#232938] mb-space-sm">
                <span className="block font-label-mono-micro text-label-mono-micro text-[#8E9BAE] uppercase">Protocol Engineer</span>
                <span className="block font-headline-sm text-headline-sm text-white font-semibold">Earth Kumar Roy</span>
                <span className="block font-label-mono-micro text-label-mono-micro text-[#FFD100] uppercase mt-space-xs">Lead Defense Architect</span>
              </div>
              <p className="font-body-sm text-body-sm text-[#8E9BAE] leading-relaxed">
                Formal smart contract verification and high-density algorithmic telemetry on Stellar Core.
              </p>
            </div>
          </div>
          <div className="pt-space-md border-t border-[#232938] flex flex-col md:flex-row items-center justify-between gap-space-md text-[#8E9BAE]">
            <div className="flex items-center gap-space-sm font-label-mono-micro text-label-mono-micro uppercase tracking-wider">
              <img src="/Logo.png" alt="" className="w-4 h-4 object-contain opacity-90" />
              <span>© 2025 STELLAR SENTINEL PROTOCOL. NON-CUSTODIAL ASSET INTEGRITY ASSURED.</span>
            </div>
            <div className="flex items-center gap-space-lg font-label-mono-micro text-label-mono-micro uppercase">
              <a className="hover:text-white transition-colors" href="#">
                Audits &amp; Verifications
              </a>
              <a className="hover:text-white transition-colors" href="#">
                Security Disclosures
              </a>
              <a className="hover:text-white transition-colors" href="#">
                Terms of Operation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;