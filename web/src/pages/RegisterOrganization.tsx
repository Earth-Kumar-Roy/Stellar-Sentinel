import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Mail, User, Send, Check, Wallet, Lock, Phone, AlertCircle } from 'lucide-react';
import { AppsScriptService } from '../services/appsScript';
import { WalletService } from '../services/wallet';
import { supabase } from '../config/supabase';
import type { OrgMember } from '../types';

interface RegisterOrganizationProps {
  initialWalletAddress?: string | null;
  onRegistered: (member: OrgMember) => void;
  onCancel: () => void;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const RegisterOrganization: React.FC<RegisterOrganizationProps> = ({
  initialWalletAddress,
  onRegistered,
  onCancel,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [availableOrgs, setAvailableOrgs] = useState<string[]>([]);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [wallet, setWallet] = useState(initialWalletAddress || '');
  const [orgName, setOrgName] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<OrgMember['role']>('Treasurer');
  const [gstNumber, setGstNumber] = useState('');

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch organizations that have fewer than 3 members (not full)
  useEffect(() => {
    async function fetchValidOrgs() {
      const { data, error } = await supabase
        .from('organization_members')
        .select('org_name, status');

      if (!error && data) {
        // Group and count active/pending members per organization
        const orgCounts: Record<string, number> = {};
        data.forEach((item) => {
          if (item.status !== 'rejected') {
            orgCounts[item.org_name] = (orgCounts[item.org_name] || 0) + 1;
          }
        });

        // Filter out orgs with 3 or more members
        const openOrgs = Object.keys(orgCounts).filter((org) => orgCounts[org] < 3);
        setAvailableOrgs(openOrgs);
      }
    }
    fetchValidOrgs();
  }, []);

  const handleConnectWalletDirect = async () => {
    try {
      const addr = await WalletService.requestConnection();
      setWallet(addr);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not retrieve address from Freighter');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrg = mode === 'create' ? orgName.trim() : selectedOrg;

    if (!wallet || wallet.trim().length !== 56 || !wallet.startsWith('G')) {
      alert('A valid 56-character Stellar public key (G...) is required.');
      return;
    }

    if (!targetOrg) {
      alert('Please specify or select a valid organization name.');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Checking credential availability...');

    try {
      // 1. Pre-check uniqueness of Email and Wallet Address in Supabase
      const { data: existingMembers, error: checkError } = await supabase
        .from('organization_members')
        .select('email, wallet_address')
        .or(`email.eq.${email.trim().toLowerCase()},wallet_address.eq.${wallet.trim()}`);

      if (checkError) throw checkError;

      if (existingMembers && existingMembers.length > 0) {
        const matchedEmail = existingMembers.some((m) => m.email.toLowerCase() === email.trim().toLowerCase());
        const matchedWallet = existingMembers.some((m) => m.wallet_address === wallet.trim());

        if (matchedEmail && matchedWallet) {
          alert('Both this Corporate Email and Stellar Wallet Address are already registered in the system.');
        } else if (matchedEmail) {
          alert('This Corporate Email is already registered with an existing organization account.');
        } else {
          alert('This Stellar Wallet Address is already bound to an organization profile.');
        }
        setIsLoading(false);
        setStatusMessage(null);
        return;
      }

      // 2. If joining an existing org, make sure the specific role isn't already taken
      if (mode === 'join') {
        const { data: roleCheck, error: roleError } = await supabase
          .from('organization_members')
          .select('role')
          .eq('org_name', targetOrg)
          .eq('role', role)
          .neq('status', 'rejected');

        if (roleError) throw roleError;

        if (roleCheck && roleCheck.length > 0) {
          alert(`The role of "${role}" is already filled for ${targetOrg}. Each organization can only have one Treasurer, one Guardian, and one Signer.`);
          setIsLoading(false);
          setStatusMessage(null);
          return;
        }
      }

      setStatusMessage('Dispatching verification code via Google Apps Script...');
      await AppsScriptService.sendRegistrationOtp(email.trim(), fullName.trim(), targetOrg);
      setStep(2);
      setStatusMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to validate credentials or deliver OTP';
      alert(msg);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Validating passcode and committing identity records...');

    const targetOrg = mode === 'create' ? orgName.trim() : selectedOrg;
    const assignedRole = mode === 'create' ? 'Treasurer' : role;
    const memberStatus = mode === 'create' ? 'active' : 'pending'; // Treasurers active immediately; others need approval

    try {
      const verifyRes = await AppsScriptService.verifyRegistrationOtp(email.trim(), otp.trim());
      if (!verifyRes.valid) {
        alert(verifyRes.message || 'Invalid or expired verification code.');
        setIsLoading(false);
        setStatusMessage(null);
        return;
      }

      const passwordHash = await hashPassword(password);

      const newMember = {
        org_name: targetOrg,
        wallet_address: wallet.trim(),
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() ? phone.trim() : null,
        role: assignedRole,
        status: memberStatus,
        password_hash: passwordHash,
        is_verified: true,
        gst_number: mode === 'create' && gstNumber.trim() ? gstNumber.trim().toUpperCase() : null,
      };

      const { data, error } = await supabase
        .from('organization_members')
        .insert([newMember])
        .select()
        .single();

      if (error) {
        throw new Error(`[${error.code || 'DB_ERROR'}] ${error.message}`);
      }

      if (mode === 'create') {
        alert('Organization registered successfully as Treasurer.');
      } else {
        alert('Join request submitted successfully. Awaiting Treasurer approval.');
      }

      onRegistered(data as OrgMember);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Registration failed: ${msg}`);
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full bg-[#121620] border border-[#232938] p-8 card-polygon my-6 font-mono text-xs">
      <div className="flex items-center gap-3 border-b border-[#232938] pb-4 mb-6">
        <div className="w-10 h-10 border border-stellar-yellow bg-stellar-yellow/10 text-stellar-yellow flex items-center justify-center btn-polygon font-mono">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">ORGANIZATION ONBOARDING</h2>
          <p className="text-stellar-muted text-[11px]">
            Configure your organizational vault role: Treasurer or Security Signer/Guardian.
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => { setMode('create'); setRole('Treasurer'); }}
            className={`flex-1 py-2.5 font-bold border btn-polygon transition-all ${
              mode === 'create'
                ? 'bg-stellar-yellow text-black border-stellar-yellow'
                : 'bg-[#0B0D13] text-stellar-muted border-[#232938]'
            }`}
          >
            Create New Org (Treasurer)
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); setRole('Signer'); }}
            className={`flex-1 py-2.5 font-bold border btn-polygon transition-all ${
              mode === 'join'
                ? 'bg-stellar-yellow text-black border-stellar-yellow'
                : 'bg-[#0B0D13] text-stellar-muted border-[#232938]'
            }`}
          >
            Join Existing Org (Guardian / Signer)
          </button>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-stellar-muted uppercase mb-1">
              Designated Stellar Wallet (G...)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                maxLength={56}
                value={wallet}
                onChange={(e) => setWallet(e.target.value.trim())}
                placeholder="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-stellar-yellow focus:border-stellar-yellow outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleConnectWalletDirect}
                className="px-3 py-2 border border-[#232938] hover:border-stellar-yellow bg-[#121620] text-stellar-muted hover:text-white flex items-center gap-1.5 btn-polygon shrink-0"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>AUTOFILL</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mode === 'create' ? (
              <div>
                <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Legal Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Stellar Labs Pvt Ltd"
                  className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Select Organization ({availableOrgs.length} Available)
                </label>
                <select
                  required
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
                >
                  <option value="">-- Choose Open Organization --</option>
                  {availableOrgs.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
                {availableOrgs.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> All existing organizations are at full capacity (3/3 roles filled).
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stellarlabs.org"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
              />
            </div>

            <div>
              <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Portal Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
              />
            </div>

            <div>
              <label className="block text-stellar-muted uppercase mb-1">Assigned Role</label>
              {mode === 'create' ? (
                <input
                  type="text"
                  disabled
                  value="Treasurer (Master Controller)"
                  className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-stellar-yellow opacity-80 cursor-not-allowed"
                />
              ) : (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as OrgMember['role'])}
                  className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
                >
                  <option value="Signer">Signer</option>
                  <option value="Guardian">Guardian</option>
                </select>
              )}
            </div>
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-stellar-muted uppercase mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> GST Number (Optional)
              </label>
              <input
                type="text"
                maxLength={20}
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="27AABCU9603R1ZM"
                className="w-full bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none uppercase"
              />
            </div>
          )}

          {statusMessage && (
            <p className="text-xs text-stellar-yellow animate-pulse pt-2">{statusMessage}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#232938]">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-[#232938] text-stellar-muted hover:text-white btn-polygon"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isLoading || (mode === 'join' && availableOrgs.length === 0)}
              className="px-6 py-2.5 bg-stellar-yellow text-black font-bold flex items-center gap-2 btn-polygon hover:bg-stellar-gold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'PROCESSING...' : 'DISPATCH OTP VERIFICATION'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFinalizeRegistration} className="space-y-4">
          <div className="bg-[#0B0D13] border border-[#232938] p-4 card-polygon space-y-2">
            <p className="text-stellar-muted">
              A 6-digit verification passcode has been dispatched to:
            </p>
            <p className="text-stellar-yellow font-bold text-sm">{email}</p>
          </div>

          <div>
            <label className="block text-stellar-muted uppercase mb-1">Enter 6-Digit Passcode</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              placeholder="123456"
              className="w-full tracking-widest text-center text-lg bg-[#0B0D13] border border-[#232938] px-3 py-2 text-white focus:border-stellar-yellow outline-none"
            />
          </div>

          {statusMessage && (
            <p className="text-xs text-stellar-yellow animate-pulse pt-2">{statusMessage}</p>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-[#232938]">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isLoading}
              className="text-stellar-muted hover:text-white"
            >
              &larr; Back to Form
            </button>
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="px-6 py-2.5 bg-stellar-yellow text-black font-bold flex items-center gap-2 btn-polygon hover:bg-stellar-gold"
            >
              <Check className="w-3.5 h-3.5" />
              {isLoading ? 'COMMITTING...' : mode === 'create' ? 'VERIFY & REGISTER ORG' : 'SUBMIT PENDING JOIN REQUEST'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};