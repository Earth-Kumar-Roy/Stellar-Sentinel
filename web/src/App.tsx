import React, { useState } from 'react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { useOrganization } from './hooks/useOrganization';
import { useDualTransactions } from './hooks/useDualTransactions';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, type ActiveTab } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { MakePayment } from './pages/MakePayment';
import { OrganizationDisplay } from './pages/OrganizationDisplay';
import { OrganizationSearch } from './pages/OrganizationSearch';
import { RegisterOrganization } from './pages/RegisterOrganization';
import { OngoingIntents } from './pages/OngoingIntents';
import { CompanyTransactionHistory } from './pages/CompanyTransactionHistory';
import { DirectTransfer } from './pages/DirectTransfer';
import { WalletActivityFeed } from './pages/WalletActivityFeed';
import { InvoiceExplorer } from './pages/InvoiceExplorer';
import { Documentation } from './pages/Documentation';
import { supabase } from './config/supabase';
import type { OrgMember } from './types';
import { 
  ShieldAlert, 
  Building2, 
  AlertTriangle 
} from 'lucide-react';

export default function App() {
  const { 
    walletAddress, 
    isConnecting, 
    connectWallet, 
    disconnectWallet 
  } = useWallet();

  const { 
    member, 
    isLoading: isOrgLoading, 
    isRegistered, 
    refreshOrganization 
  } = useOrganization(walletAddress);

  const dualTxResult = useDualTransactions(walletAddress);
  const intents = dualTxResult.intents || [];
  const quarantinedCount = (dualTxResult as any).quarantinedCount ?? (dualTxResult as any).quarantineCount ?? 0;
  
  // Safe resolver ensuring onRefresh is always a valid () => void callable
  const refreshTransactions = () => {
    if (typeof (dualTxResult as any).refreshDualTransactions === 'function') {
      (dualTxResult as any).refreshDualTransactions();
    } else if (typeof (dualTxResult as any).refreshTransactions === 'function') {
      (dualTxResult as any).refreshTransactions();
    } else if (typeof (dualTxResult as any).refresh === 'function') {
      (dualTxResult as any).refresh();
    }
  };

  const [currentTab, setCurrentTab] = useState<ActiveTab | 'landing'>('dashboard');
  const [showCredModal, setShowCredModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [requiredWallet, setRequiredWallet] = useState<string | null>(null);
  const [prefilledRecipient, setPrefilledRecipient] = useState<string>('');

  const handleCredLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', loginEmail.trim())
      .maybeSingle();

    if (error || !data) {
      const proceed = confirm(
        'No verified entity found with this corporate email. Would you like to register a new organization now?'
      );
      if (proceed) {
        setShowCredModal(false);
        setCurrentTab('register');
      }
      return;
    }

    const matchedMember = data as OrgMember;
    setRequiredWallet(matchedMember.wallet_address);
    setShowCredModal(false);

    if (walletAddress && walletAddress !== matchedMember.wallet_address) {
      alert(`Connected wallet does not match registered account ${matchedMember.wallet_address.slice(0, 6)}...`);
    } else if (!walletAddress) {
      await connectWallet();
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'make-payment') {
      setPrefilledRecipient('');
    }
    setCurrentTab(tab);
  };

  const handleSelectPayeeFromSearch = (recipientWallet: string) => {
    setPrefilledRecipient(recipientWallet);
    setCurrentTab('make-payment');
  };

  const isWalletMismatch = Boolean(
    requiredWallet && walletAddress && requiredWallet !== walletAddress
  );

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F1F4F9] flex flex-col font-sans selection:bg-stellar-yellow selection:text-black">
      <Navbar
        member={member}
        wallet={walletAddress}
        onConnectWallet={connectWallet}
        onDisconnect={() => {
          disconnectWallet();
          setRequiredWallet(null);
          setCurrentTab('dashboard');
        }}
        isConnecting={isConnecting}
      />

      {/* 1. STRICT IDENTITY MISMATCH GUARD */}
      {isWalletMismatch && requiredWallet && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#161214] border border-red-900/60 p-8 card-polygon text-center font-mono">
            <div className="w-12 h-12 border border-red-500 text-red-400 mx-auto mb-4 flex items-center justify-center btn-polygon bg-red-500/10">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">STRICT IDENTITY MISMATCH</h2>
            <p className="text-stellar-muted text-xs mb-4">
              Your corporate session requires the specified address. Swapping to an unauthorized key is forbidden.
            </p>
            <div className="bg-black/60 border border-red-900/40 p-3 text-left text-[11px] mb-6 space-y-2">
              <div><span className="text-stellar-muted">Required:</span> <span className="text-stellar-yellow break-all">{requiredWallet}</span></div>
              <div><span className="text-stellar-muted">Detected:</span> <span className="text-red-400 break-all">{walletAddress}</span></div>
            </div>
            <button
              type="button"
              onClick={() => {
                disconnectWallet();
                setRequiredWallet(null);
              }}
              className="px-6 py-2.5 bg-stellar-yellow text-black font-bold text-xs btn-polygon hover:bg-stellar-gold cursor-pointer"
            >
              DISCONNECT &amp; RETRY
            </button>
          </div>
        </div>
      )}

      {/* 2. REGISTRATION WORKFLOW */}
      {currentTab === 'register' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <RegisterOrganization
            initialWalletAddress={walletAddress}
            onRegistered={() => {
              refreshOrganization();
              setCurrentTab('dashboard');
            }}
            onCancel={() => {
              setCurrentTab(walletAddress ? 'dashboard' : 'landing');
            }}
          />
        </div>
      )}

      {/* 3. PUBLIC DOCUMENTATION TAB (Accessible With or Without Wallet) */}
      {currentTab === 'docs' && !walletAddress && (
        <div className="flex-1">
          <Documentation onBack={() => setCurrentTab('landing')} />
        </div>
      )}

      {/* 4. PUBLIC LANDING PAGE (Unconnected State) */}
      {!walletAddress && !isWalletMismatch && currentTab !== 'register' && currentTab !== 'docs' && (
        <LandingPage
          walletAddress={walletAddress}
          onConnectWallet={connectWallet}
          onOpenLoginModal={() => setShowCredModal(true)}
          onNavigateToRegister={() => setCurrentTab('register')}
          onNavigateToDocs={() => setCurrentTab('docs')}
          onLaunchVault={() => setCurrentTab('dashboard')}
          isConnecting={isConnecting}
        />
      )}

      {/* 5. ONBOARDING REQUIRED ALERT FOR UNREGISTERED WALLET */}
      {walletAddress && !isOrgLoading && !isRegistered && currentTab !== 'register' && !isWalletMismatch && (
        <div className="flex-1 flex items-center justify-center p-6 font-mono">
          <div className="max-w-lg w-full bg-[#121620] border border-[#232938] p-8 card-polygon text-center">
            <div className="w-12 h-12 border border-stellar-yellow text-stellar-yellow mx-auto mb-4 flex items-center justify-center btn-polygon bg-stellar-yellow/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">ORGANIZATION ONBOARDING REQUIRED</h2>
            <p className="text-stellar-muted text-xs mb-6 leading-relaxed">
              Target address <span className="text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</span> is not associated with an approved entity. Treasury operations remain locked until compliance onboarding is satisfied.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentTab('register')}
                className="px-6 py-2.5 bg-stellar-yellow text-black font-bold text-xs flex items-center gap-2 btn-polygon hover:bg-stellar-gold cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                REGISTER AS NEW ORG
              </button>
              <button
                type="button"
                onClick={disconnectWallet}
                className="px-6 py-2.5 border border-[#232938] hover:border-white font-mono text-xs text-stellar-muted hover:text-white btn-polygon cursor-pointer"
              >
                DISCONNECT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AUTHENTICATED APP CONSOLE (SIDEBAR + MAIN DASHBOARD) */}
      {walletAddress && !isWalletMismatch && isRegistered && currentTab !== 'register' && (
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
          <Sidebar
            currentTab={currentTab as ActiveTab}
            onSelectTab={handleSelectTab}
            quarantineCount={quarantinedCount}
            userRole={member?.role}
          />

          <main className="flex-1 p-6 overflow-y-auto">
            {currentTab === 'dashboard' && member && (
              <Dashboard
                member={member}
                currentWallet={walletAddress}
                intents={intents}
                quarantineCount={quarantinedCount}
                onNavigateToPayment={() => {
                  setPrefilledRecipient('');
                  setCurrentTab('make-payment');
                }}
                onNavigateToQuarantine={() => setCurrentTab('quarantined')}
                onRefreshTransactions={refreshTransactions}
              />
            )}

            {currentTab === 'make-payment' && (
              <MakePayment
                currentWallet={walletAddress}
                initialRecipient={prefilledRecipient}
                onPaymentSuccess={() => {
                  setPrefilledRecipient('');
                  refreshTransactions();
                }}
                onNavigateHome={() => {
                  setPrefilledRecipient('');
                  setCurrentTab('dashboard');
                }}
                senderName={member?.full_name}
                senderRole={member?.role}
                orgName={member?.org_name}
              />
            )}

            {currentTab === 'quarantined' && (
              <OngoingIntents
                intents={intents}
                currentWallet={walletAddress}
                userRole={member?.role}
                userOrgName={member?.org_name}
                onRefresh={refreshTransactions}
              />
            )}

            {currentTab === 'history' && member && (
              <CompanyTransactionHistory currentMember={member} />
            )}

            {currentTab === 'invoices' && (
              <InvoiceExplorer 
                currentWallet={walletAddress}
                orgName={member?.org_name}
              />
            )}

            {currentTab === 'wallet-activity' && (
              <WalletActivityFeed walletAddress={walletAddress} />
            )}

            {currentTab === 'direct-transfer' && (
              <DirectTransfer currentWallet={walletAddress} />
            )}

            {currentTab === 'search' && (
              <OrganizationDisplay
                currentMember={member}
                currentWallet={walletAddress}
                onMemberUpdated={refreshOrganization}
              />
            )}

            {(currentTab as string) === 'org-search' && (
              <OrganizationSearch
                userRole={member?.role}
                currentWallet={walletAddress}
                currentOrgName={member?.org_name}
                onSelectPayee={handleSelectPayeeFromSearch}
              />
            )}

            {currentTab === 'docs' && (
              <Documentation onBack={() => setCurrentTab('dashboard')} />
            )}
          </main>
        </div>
      )}

      {/* 7. CREDENTIAL ACCESS MODAL */}
      {showCredModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs">
          <div className="bg-[#121620] border border-[#232938] max-w-md w-full p-6 card-polygon space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stellar-yellow" />
              ORGANIZATION CREDENTIAL ACCESS
            </h2>
            <p className="text-stellar-muted text-[11px]">
              Submit your corporate email address to retrieve your authorized wallet binding.
            </p>
            <form onSubmit={handleCredLogin} className="space-y-4">
              <div>
                <label className="block text-stellar-muted uppercase text-[10px] mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@stellarlabs.org"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCredModal(false);
                    setCurrentTab('register');
                  }}
                  className="text-stellar-yellow hover:underline text-[11px] cursor-pointer"
                >
                  Need to register entity?
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCredModal(false)}
                    className="px-4 py-2 border border-[#232938] text-stellar-muted hover:text-white btn-polygon cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stellar-yellow text-black font-bold btn-polygon hover:bg-stellar-gold cursor-pointer"
                  >
                    VERIFY &amp; CONNECT
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}