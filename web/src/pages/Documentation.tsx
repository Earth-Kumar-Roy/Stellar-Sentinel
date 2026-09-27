import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  BrainCircuit, 
  Mail, 
  Lock, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Database,
  Coins,
  Workflow,
  ArrowRight,
  ArrowLeft,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  language?: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = 'rust' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-sm border border-[#1E2433] bg-[#07090E] font-mono text-[11px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1E2433] bg-[#0D1017] px-3.5 py-1.5 text-stellar-muted">
        <span className="text-[10px] uppercase tracking-wider text-stellar-yellow">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-300 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

interface DocumentationProps {
  onBack?: () => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState<string>('workflow');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'workflow', label: 'Architecture & Workflow' },
    { id: 'multi-currency', label: '1. Multi-Currency Tokens' },
    { id: 'smart-contract', label: '2. Soroban Smart Escrow' },
    { id: 'quorum-rules', label: '3. Timelocks & Quorum' },
    { id: 'keeper-crank', label: '4. Autonomous Crank' },
    { id: 'ai-sentinel', label: '5. AI-ML Telemetry' },
    { id: 'invoicing-email', label: '6. Invoicing & Email' },
    { id: 'error-matrix', label: '7. Soroban Error Matrix' },
  ];

  return (
    <div className="min-h-screen text-xs font-mono text-zinc-300 pb-24 bg-[#07090E]">
      {/* Top Banner */}
      <div className="border-b border-[#1E2433] bg-[#090C12] p-6 lg:p-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-stellar-yellow text-black rounded-sm">
                Soroban Protocol Specification
              </span>
              <span className="text-[10px] text-stellar-muted">Stellar Sentinel Standard v2.4</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2 font-sans">
              <ShieldCheck className="w-7 h-7 text-stellar-yellow" />
              STELLAR SENTINEL ARCHITECTURAL MANUAL
            </h1>
            <p className="text-stellar-muted text-[11px] mt-1 max-w-2xl">
              Non-custodial multi-sig treasury protocol featuring instant contract escrow, dynamic time-lock observation windows (2h to 12h), autonomous ML anomaly detection, and automated corporate tax invoicing.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 border border-stellar-yellow/50 bg-stellar-yellow/10 hover:bg-stellar-yellow hover:text-black text-stellar-yellow font-bold text-xs btn-polygon flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK TO HOME</span>
              </button>
            )}
            <span className="px-3 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> TESTNET LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-16 z-30 border-b border-[#1E2433] bg-[#07090E]/95 backdrop-blur-md px-4 lg:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1.5 bg-[#121620] hover:bg-[#1c2230] border border-[#232938] text-stellar-yellow text-[11px] font-bold rounded-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`whitespace-nowrap px-3 py-1.5 text-[11px] rounded-sm transition-all cursor-pointer font-bold ${
                    isActive
                      ? 'bg-stellar-yellow text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-[#0D1017] border border-[#1E2433] hover:border-stellar-yellow/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 space-y-14">

        {/* Section 0: End-to-End Project Workflow */}
        <section id="workflow" className="scroll-mt-36 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Workflow className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              End-to-End Protocol Workflow
            </h2>
          </div>
          <p className="leading-relaxed">
            The Stellar Sentinel platform safeguards treasury capital by dividing transactions into verifiable stages. 
            Below is the full state progression from raw treasurer input to automated execution or refund:
          </p>

          {/* Visual Step-by-Step Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stellar-yellow font-bold uppercase">Phase 1</span>
                  <Coins className="w-4 h-4 text-stellar-yellow" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1">Intent Creation</h3>
                <p className="text-[10px] text-stellar-muted leading-relaxed">
                  Treasurer specifies token, counterparty, purpose memo, and time-lock duration (2h to 12h).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161B26] text-[10px] text-amber-400 flex items-center gap-1 font-bold">
                <span>Funds Deducted to Escrow</span>
                <ArrowRight className="w-3 h-3 ml-auto" />
              </div>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stellar-yellow font-bold uppercase">Phase 2</span>
                  <BrainCircuit className="w-4 h-4 text-stellar-yellow" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1">ML Risk Inspection</h3>
                <p className="text-[10px] text-stellar-muted leading-relaxed">
                  Off-chain agent scores velocity, counterparty history, entropy, and trust. Scores 75 or higher trigger instant quarantine.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161B26] text-[10px] text-stellar-yellow flex items-center gap-1 font-bold">
                <span>Timelock Active</span>
                <ArrowRight className="w-3 h-3 ml-auto" />
              </div>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stellar-yellow font-bold uppercase">Phase 3</span>
                  <Key className="w-4 h-4 text-stellar-yellow" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1">Quorum & Review</h3>
                <p className="text-[10px] text-stellar-muted leading-relaxed">
                  Designated co-signers approve on-chain. If rejected, challenged, or cancelled, funds return immediately to treasury.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161B26] text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <span>Consensus Reached</span>
                <ArrowRight className="w-3 h-3 ml-auto" />
              </div>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-stellar-yellow font-bold uppercase">Phase 4</span>
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold text-xs mb-1">Keeper Bot Settlement</h3>
                <p className="text-[10px] text-stellar-muted leading-relaxed">
                  Autonomous crank executes disbursement upon timelock maturation. PDF Tax Invoice is compiled and emailed to both parties.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#161B26] text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Final Settlement Complete</span>
              </div>
            </div>
          </div>

          {/* ASCII State Transition Diagram */}
          <div className="bg-[#0A0D14] border border-[#1E2433] p-4 rounded-sm font-mono text-[11px] overflow-x-auto text-zinc-300">
            <div className="text-stellar-yellow font-bold mb-2 uppercase text-[10px]">Deterministic Protocol State Progression:</div>
            <pre className="leading-relaxed">
{`[Treasurer Creates Intent] 
       │
       ▼
[Atomic Transfer -> Soroban Escrow] ───(Immediate Escrow Lock)
       │
       ├───> [Off-Chain ML Telemetry Engine] 
       │           │
       │           ├── Score >= 75  ──> [Status: Quarantined] ──> [Awaiting Guardian Override / Dismissal]
       │           └── Score < 75   ──> [Status: Observing / AwaitingApproval]
       │
       ▼
[Observation Window (2h - 12h) & Co-Signer Quorum Check]
       │
       ├── [Cancellation Triggered / Co-Signer Rejection / Timelock Expired without Quorum]
       │           │
       │           ▼
       │     [Contract Executes Auto-Refund] ──> 100% Tokens Returned to Treasury Vault
       │                                         (Internal Refund Notice Sent, Recipient Gets No Invoice)
       │
       └── [Timelock Matured AND Mandatory Quorum Satisfied]
                   │
                   ▼
             [Autonomous Python Keeper Bot Invokes execute_intent]
                   │
                   ├──> Tokens Disbursed On-Chain to Recipient Address
                   └──> Google Apps Script Generates PDF Tax Invoice 
                        (Relayed to both Disbursing Treasurer & Counterparty Entity)`}
            </pre>
          </div>
        </section>

        {/* Section 1: Multi-Currency Tokens */}
        <section id="multi-currency" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Coins className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              1. Multi-Currency Token Addressing &amp; Decimals
            </h2>
          </div>
          <p className="leading-relaxed">
            Stellar Sentinel natively supports multi-asset treasury operations. Outbound disbursements can be denominated in Native Stellar Lumens (XLM) or regulated stablecoins (USDC and EURC). All supported assets conform to the 7-decimal Stroop standard (1 Stroop = 0.0000001 tokens) under official Soroban Asset Contracts (SAC):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-[#0D1017] border border-[#1E2433] p-3.5 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">XLM (Native)</span>
                <span className="text-[9px] text-amber-400 bg-amber-950/80 px-1 py-0.5 border border-amber-600/40 font-bold">
                  NATIVE
                </span>
              </div>
              <div className="text-[10px] text-stellar-muted font-mono break-all">
                CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
              </div>
              <div className="text-[10px] text-zinc-400">Decimals: 7 • Equiv: 1.0x XLM</div>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-3.5 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">USDC (USD Coin)</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1 py-0.5 border border-emerald-600/40 font-bold">
                  STABLE
                </span>
              </div>
              <div className="text-[10px] text-stellar-muted font-mono break-all">
                CBPD6XGRX4VF5CIBDLLYQCBV7UG6ZW7CTZE3FSWKD73JMNIJJ73MDJKK
              </div>
              <div className="text-[10px] text-zinc-400">Decimals: 7 • Equiv: 5.0x XLM (1,000 USDC = 5,000 XLM)</div>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-3.5 rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">EURC (Euro Coin)</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1 py-0.5 border border-emerald-600/40 font-bold">
                  STABLE
                </span>
              </div>
              <div className="text-[10px] text-stellar-muted font-mono break-all">
                CCEWDNGDQZRTSBQLDZZEPNFPL3R7NZTVBNRDKT6AZ436L6X6V5OL56QN
              </div>
              <div className="text-[10px] text-zinc-400">Decimals: 7 • Equiv: 5.55x XLM (900 EURC = 5,000 XLM)</div>
            </div>
          </div>

          <CodeSnippet
            language="typescript"
            code={`export const SUPPORTED_TOKENS: Record<string, TokenAsset> = {
  XLM: {
    symbol: 'XLM',
    name: 'Stellar Lumens',
    contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    contractId: 'CBPD6XGRX4VF5CIBDLLYQCBV7UG6ZW7CTZE3FSWKD73JMNIJJ73MDJKK',
    decimals: 7,
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    contractId: 'CCEWDNGDQZRTSBQLDZZEPNFPL3R7NZTVBNRDKT6AZ436L6X6V5OL56QN',
    decimals: 7,
  },
};`}
          />
        </section>

        {/* Section 2: Soroban Smart Contract */}
        <section id="smart-contract" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Cpu className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              2. Soroban Smart Escrow Architecture
            </h2>
          </div>
          <p className="leading-relaxed">
            The primary state machine is defined in Rust (SentinelTreasury in contract.rs), compiling to WebAssembly on the Soroban execution environment. When the treasurer submits an intent, funds are immediately deducted from the caller and locked in non-custodial smart contract escrow.
          </p>

          <div className="bg-[#0D1017] p-4 border border-[#1E2433] rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-stellar-yellow font-bold text-xs uppercase">
              <Lock className="w-4 h-4" /> Immediate Escrow Transfer Mechanism
            </div>
            <p className="text-[11px] text-zinc-300">
              During create_intent, the contract executes an atomic transfer from the caller to the contract address via Soroban Token SAC Client. Funds do not sit in the user's wallet during observation, eliminating double-spend and unauthorized balance drainage:
            </p>
            <CodeSnippet
              language="rust"
              code={`// Lock funds immediately into contract escrow
token::Client::new(&env, &asset).transfer(
    &caller,
    &env.current_contract_address(),
    &(amount as i128),
);`}
            />
          </div>

          <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-stellar-yellow" />
              Core State Structure (PaymentIntent)
            </h3>
            <CodeSnippet
              language="rust"
              code={`pub struct PaymentIntent {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub asset: Address,
    pub amount: i64,
    pub purpose_hash: BytesN<32>,
    pub status: IntentStatus,
    pub tier: ExecutionTier,
    pub created_at: u64,
    pub observation_until: u64,
    pub expires_at: u64,
    pub cosigners: Vec<Address>,
    pub guardian: Option<Address>,
    pub approvals: Vec<Address>,
    pub guardian_approvals: Vec<Address>,
    pub policy_version: u32,
    pub observation_delay: u64,
}`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-white font-bold text-xs uppercase tracking-wide">Key Contract Interfaces</h3>
            <ul className="space-y-2 text-[11px] text-zinc-300">
              <li className="bg-[#0D1017] p-3 border border-[#1E2433] rounded-sm">
                <strong className="text-stellar-yellow font-mono">create_intent(caller, recipient, cosigners, guardian, asset, amount, purpose_hash, delay)</strong>
                <p className="text-stellar-muted mt-1 text-[10px]">
                  Validates policy boundaries, transfers tokens into contract escrow, determines the required execution tier based on exposure, and publishes the (intent, created) event.
                </p>
              </li>
              <li className="bg-[#0D1017] p-3 border border-[#1E2433] rounded-sm">
                <strong className="text-stellar-yellow font-mono">execute_intent(caller, intent_id)</strong>
                <p className="text-stellar-muted mt-1 text-[10px]">
                  Settles matured disbursements. If observation time has elapsed and required multi-sig signatures are present, funds are released to recipient. If quorum is unsatisfied upon deadline expiration, the contract automatically auto-refunds back to the treasurer.
                </p>
              </li>
              <li className="bg-[#0D1017] p-3 border border-[#1E2433] rounded-sm">
                <strong className="text-stellar-yellow font-mono">cancel_intent(caller, intent_id)</strong>
                <p className="text-stellar-muted mt-1 text-[10px]">
                  Callable by the sender, any designated co-signer, or the guardian. Immediately refunds escrowed tokens to the sender and marks the intent terminal (Cancelled).
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Timelocks & Quorum */}
        <section id="quorum-rules" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Key className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              3. Observation Timelocks &amp; Multi-Sig Quorums
            </h2>
          </div>
          <p className="leading-relaxed">
            The timelock provides a security buffer (configurable between <strong>2 Hours (7,200s)</strong> and <strong>12 Hours (43,200s)</strong>). During this active timeframe, participants can review the transaction, co-signers can submit required cryptographic approvals, or any party can cancel and refund the escrow if an anomaly is detected.
          </p>

          <div className="border border-[#1E2433] bg-[#0D1017] rounded-sm overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#121620] text-stellar-yellow uppercase text-[10px] border-b border-[#1E2433]">
                <tr>
                  <th className="p-3">Exposure Band</th>
                  <th className="p-3">Tier Identification</th>
                  <th className="p-3">Quorum Mandate</th>
                  <th className="p-3">Observation Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2433] text-zinc-300">
                <tr>
                  <td className="p-3 font-bold text-white">5,000 XLM or less / Stablecoins</td>
                  <td className="p-3 text-emerald-400 font-bold">FastPath</td>
                  <td className="p-3">1-of-1 (Treasurer Initializer)</td>
                  <td className="p-3 text-stellar-muted">Direct observation (2h - 12h)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">5,000 – 10,000 XLM</td>
                  <td className="p-3 text-amber-400 font-bold">StandardObserving</td>
                  <td className="p-3">At least 1 Co-Signer Required</td>
                  <td className="p-3 text-stellar-muted">Awaiting approval to Observing</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Greater than 10,000 XLM</td>
                  <td className="p-3 text-red-400 font-bold">GuardianRequired</td>
                  <td className="p-3">2 Co-Signers + 1 Guardian Mandated</td>
                  <td className="p-3 text-stellar-muted">Strict multi-sig quorum gate</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Any (ML Anomaly 75/100 or higher)</td>
                  <td className="p-3 text-red-500 font-bold">Quarantined</td>
                  <td className="p-3">Co-Signer Override or Guardian Dismissal</td>
                  <td className="p-3 text-stellar-muted">Auto-refunds upon timelock expiry</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#121620] border border-[#232938] p-3.5 rounded-sm space-y-1.5">
            <span className="text-white font-bold text-xs uppercase flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-stellar-yellow" />
              Guaranteed Escrow Auto-Refund
            </span>
            <p className="text-[11px] text-stellar-muted leading-relaxed">
              If any co-signer rejects the transaction, if the sender cancels, or if the observation timelock matures without the required co-signer signatures present on-chain, the contract immediately releases the escrowed tokens <strong>straight back to the treasury wallet</strong>. Funds are never lost or stuck permanently in the contract.
            </p>
          </div>
        </section>

        {/* Section 4: Autonomous Keeper Crank */}
        <section id="keeper-crank" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Terminal className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              4. Autonomous Keeper Crank: Two-Step vs Automatic
            </h2>
          </div>
          <p className="leading-relaxed">
            Soroban smart contracts are reactive and cannot execute operations on their own clock. Stellar Sentinel uses an autonomous Python keeper bot (soroban_subscriber.py) operating as a decentralized crank. Users do not need to manually confirm or approve transactions a second time once created. Once the observation window has safely matured and all signatures (if mandated) have been gathered, the backend bot automatically submits execute_intent on-chain:
          </p>

          <div className="bg-[#0D1017] border border-[#1E2433] p-4 rounded-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Maturation &amp; Settlement Path
                </div>
                <p className="text-[11px] text-stellar-muted leading-relaxed">
                  When current time is greater than or equal to observation_until and co-signer criteria are satisfied, the keeper bot calls execute_intent. Tokens are disbursed directly to the recipient address and an on-chain event is published.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Unapproved / Anomaly Refund Path
                </div>
                <p className="text-[11px] text-stellar-muted leading-relaxed">
                  If mandatory co-signers did not approve before deadline expiration, or if an unresolved quarantine flag exists, calling execute_intent automatically reverses the escrow, returning 100% of tokens to the sender treasury.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: AI-ML Risk Telemetry */}
        <section id="ai-sentinel" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <BrainCircuit className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              5. AI-ML Sentinel Telemetry &amp; Risk Scorer
            </h2>
          </div>
          <p className="leading-relaxed">
            Every payment intent is ingested by an autonomous Python machine learning telemetry pipeline (risk_scorer.py). The engine evaluates four primary dimensions to detect corporate exfiltration and anomalous transfers:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#0D1017] p-3.5 border border-[#1E2433] rounded-sm space-y-1.5">
              <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> 1. Global Treasury Entropy Anomaly
              </span>
              <p className="text-[10px] text-stellar-muted leading-relaxed">
                Calculates the moving baseline of the treasury's last 25 executed transfers. A volume spike <strong>greater than 30x the baseline</strong> triggers a +50 penalty and mandates multi-sig approval.
              </p>
            </div>

            <div className="bg-[#0D1017] p-3.5 border border-[#1E2433] rounded-sm space-y-1.5">
              <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 2. Post-Cosign Frequency Clustering
              </span>
              <p className="text-[10px] text-stellar-muted leading-relaxed">
                Checks clustering in the last 12 disbursements. If <strong>9 or more out of 12</strong> transfers are routed to the same wallet without co-signer validation, the engine flags a +48 anomaly penalty.
              </p>
            </div>

            <div className="bg-[#0D1017] p-3.5 border border-[#1E2433] rounded-sm space-y-1.5">
              <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 3. GST Corporate Registry &amp; Wallet Trust
              </span>
              <p className="text-[10px] text-stellar-muted leading-relaxed">
                Cross-references the counterparty against verified GST organizations. Verified entities receive trusted operational status, while independent wallets mandate co-signers on transfer #2.
              </p>
            </div>

            <div className="bg-[#0D1017] p-3.5 border border-[#1E2433] rounded-sm space-y-1.5">
              <span className="text-stellar-yellow font-bold uppercase text-[10px] flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" /> 4. Relative Counterparty Volume Surge
              </span>
              <p className="text-[10px] text-stellar-muted leading-relaxed">
                Tracks the recipient's historical 8-transfer average. If the current amount spikes <strong>25x or higher over historical baseline</strong>, it forces an automated quarantine.
              </p>
            </div>
          </div>

          <div className="bg-[#121620] border border-stellar-yellow/30 p-4 rounded-sm text-[11px] space-y-2">
            <strong className="text-white block mb-1">Mathematical Composite Scoring Formula:</strong>
            <div className="text-stellar-yellow font-mono text-xs py-1">
              RiskScore = w1 · V + w2 · (1 - T) + w3 · D + w4 · H
            </div>
            <p className="text-stellar-muted text-[10px]">
              Where V is velocity deviation, T is counterparty trust score, D is time-of-day risk, and H is memo hash entropy.
            </p>
            <div className="pt-2 border-t border-[#1E2433] text-[11px] text-zinc-300">
              <span className="text-red-400 font-bold">Composite Quarantine Threshold: </span>
              If the calculated composite risk score is <strong>75.0 / 100 or higher</strong>, the intent is placed into QUARANTINED status, requiring an explicit co-signer signature override or guardian review before it can ever disburse.
            </div>
          </div>
        </section>

        {/* Section 6: Invoicing & Email Dispatch */}
        <section id="invoicing-email" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <Mail className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              6. Corporate Invoicing &amp; Google Apps Script
            </h2>
          </div>
          <p className="leading-relaxed">
            Every treasury lifecycle event synchronizes through Google Apps Script webhooks (google-apps-script.js) for real-time compliance alerting and invoice dispatch across four distinct states:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0D1017] border border-[#1E2433] p-3.5 rounded-sm">
              <span className="text-stellar-yellow font-bold text-[10px] uppercase block mb-1">
                Step 1: Intent Creation Email
              </span>
              <p className="text-[10px] text-stellar-muted">
                Dispatched immediately to the treasurer upon intent submission, confirming the amount, currency, recipient address, ML score, and timelock window.
              </p>
            </div>

            <div className="bg-[#0D1017] border border-[#1E2433] p-3.5 rounded-sm">
              <span className="text-amber-400 font-bold text-[10px] uppercase block mb-1">
                Step 2: Co-Signer Mandate Notice
              </span>
              <p className="text-[10px] text-stellar-muted">
                If co-signers are designated or mandated by volume/risk thresholds, automated notifications are dispatched directly to the co-signers' registered email addresses with deep links to sign.
              </p>
            </div>

            <div className="bg-[#0D1017] border border-emerald-500/30 bg-emerald-950/10 p-3.5 rounded-sm">
              <span className="text-emerald-400 font-bold text-[10px] uppercase block mb-1">
                Step 3: Settlement Tax Invoice &amp; PDF Dispatch
              </span>
              <p className="text-[10px] text-stellar-muted">
                When payment is executed/settled, the system generates an official corporate PDF Tax Invoice with GSTIN details, on-chain tx hash, and transaction note, emailing it to <strong>both the treasurer and the recipient entity</strong>.
              </p>
            </div>

            <div className="bg-[#0D1017] border border-red-500/30 bg-red-950/10 p-3.5 rounded-sm">
              <span className="text-red-400 font-bold text-[10px] uppercase block mb-1">
                Step 4: Anomaly Refund Alert
              </span>
              <p className="text-[10px] text-stellar-muted">
                Sent strictly to internal treasury officers when an intent is cancelled or quarantined; suppressed for the counterparty. If cancelled or refunded, no invoice is ever sent to the counterparty.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Error Code Matrix */}
        <section id="error-matrix" className="scroll-mt-36 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1E2433] pb-2">
            <AlertTriangle className="w-5 h-5 text-stellar-yellow" />
            <h2 className="text-lg font-bold text-white tracking-wide uppercase font-sans">
              7. Soroban Contract Diagnostic Error Matrix
            </h2>
          </div>
          <p className="leading-relaxed">
            Standard contract errors defined in errors.rs and returned by Soroban simulation or consensus:
          </p>

          <div className="border border-[#1E2433] rounded-sm overflow-hidden">
            <table className="w-full text-left font-mono text-[11px] bg-[#0D1017]">
              <thead className="bg-[#121620] text-stellar-yellow text-[10px] uppercase border-b border-[#1E2433]">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Error Identifier</th>
                  <th className="p-2.5">Diagnostic Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2433] text-zinc-300">
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#10</td>
                  <td className="p-2.5 text-white">EmergencyFrozen</td>
                  <td className="p-2.5 text-stellar-muted">Contract operations paused by protocol admin emergency key.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#12</td>
                  <td className="p-2.5 text-white">InvalidIntentParameters</td>
                  <td className="p-2.5 text-stellar-muted">Observation timelock must be between 2 Hours (7,200s) and 12 Hours (43,200s). Amount must be greater than 0.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#13</td>
                  <td className="p-2.5 text-white">ObservationWindowActive</td>
                  <td className="p-2.5 text-stellar-muted">Settlement attempted before timelock has matured. Await keeper crank.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#14</td>
                  <td className="p-2.5 text-white">IntentAlreadyTerminal</td>
                  <td className="p-2.5 text-stellar-muted">Intent is already executed, cancelled, or refunded. Cannot re-execute.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#15</td>
                  <td className="p-2.5 text-white">IntentIsQuarantined</td>
                  <td className="p-2.5 text-stellar-muted">Quarantined by ML Sentinel. Requires Co-Signer override or Guardian dismissal.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#16</td>
                  <td className="p-2.5 text-white">CosignerRequired</td>
                  <td className="p-2.5 text-stellar-muted">Disbursements greater than 5,000 XLM require at least 1 co-signer; greater than 10,000 XLM requires 2 co-signers and 1 guardian.</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-stellar-yellow font-bold">#20</td>
                  <td className="p-2.5 text-white">AmountExceedsPerTxLimit</td>
                  <td className="p-2.5 text-stellar-muted">Transfer volume exceeds the maximum per-transaction ceiling configured in protocol policy.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Documentation;