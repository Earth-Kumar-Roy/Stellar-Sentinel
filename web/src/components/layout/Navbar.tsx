import React, { useState, useEffect } from 'react';
import { LogOut, Wallet, ShieldCheck, Bell, Coins } from 'lucide-react';
import { Horizon } from '@stellar/stellar-sdk';
import type { OrgMember } from '../../types';

interface NavbarProps {
  member: OrgMember | null;
  wallet: string | null;
  onConnectWallet: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  member,
  wallet,
  onConnectWallet,
  onDisconnect,
  isConnecting,
}) => {
  const [balances, setBalances] = useState<{ xlm: string; usdc: string; eurc: string }>({
    xlm: '0.00',
    usdc: '0.00',
    eurc: '0.00',
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchBalances() {
      if (!wallet) return;
      try {
        const server = new Horizon.Server('https://horizon-testnet.stellar.org');
        const account = await server.loadAccount(wallet);
        
        let xlmVal = '0.00';
        let usdcVal = '0.00';
        let eurcVal = '0.00';

        account.balances.forEach((b: any) => {
          if (b.asset_type === 'native') {
            xlmVal = parseFloat(b.balance).toFixed(2);
          } else if (b.asset_code) {
            const code = b.asset_code.toUpperCase();
            if (code === 'USDC') {
              usdcVal = parseFloat(b.balance).toFixed(2);
            } else if (code === 'EURC') {
              eurcVal = parseFloat(b.balance).toFixed(2);
            }
          }
        });

        if (isMounted) {
          setBalances({
            xlm: xlmVal,
            usdc: usdcVal,
            eurc: eurcVal,
          });
        }
      } catch {
        if (isMounted) {
          setBalances({ xlm: '0.00', usdc: '0.00', eurc: '0.00' });
        }
      }
    }

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000); // Poll live balances every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [wallet]);

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <header className="border-b border-[#232938] bg-[#0B0D13]/95 backdrop-blur sticky top-0 z-50 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stellar-yellow flex items-center justify-center font-bold text-black text-lg btn-polygon">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-base text-white">
              STELLAR<span className="text-stellar-yellow">SENTINEL</span>
            </span>
            <span className="text-[10px] text-stellar-muted tracking-tight">
              TREASURY DEFENSE SYSTEM
            </span>
          </div>
          <span className="hidden sm:inline-block ml-2 text-[10px] uppercase px-2 py-0.5 border border-stellar-yellow/40 text-stellar-yellow bg-stellar-yellow/10">
            TESTNET
          </span>
        </div>

        {/* Right Section Actions */}
        <div className="flex items-center gap-3">
          {member && wallet ? (
            <>
              {/* All Asset Balances & Role Indicator Badge */}
              <div className="hidden lg:flex items-center gap-3 bg-[#121620] border border-[#232938] px-3 py-1.5 card-polygon text-xs">
                <div className="flex items-center gap-1.5 text-stellar-yellow" title="Stellar Lumens">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="font-bold">{balances.xlm} XLM</span>
                </div>

                <div className="h-4 w-[1px] bg-[#232938]" />

                <div className="flex items-center gap-1 text-emerald-400" title="USD Coin">
                  <span className="font-bold">{balances.usdc} USDC</span>
                </div>

                <div className="h-4 w-[1px] bg-[#232938]" />

                <div className="flex items-center gap-1 text-sky-400" title="Euro Coin">
                  <span className="font-bold">{balances.eurc} EURC</span>
                </div>

                <div className="h-4 w-[1px] bg-[#232938]" />
                
                <div className="uppercase text-[10px] bg-stellar-yellow/10 border border-stellar-yellow/30 text-stellar-yellow px-2 py-0.5 font-bold">
                  {member.role}
                </div>
              </div>

              {/* Mobile/Compact Balance View */}
              <div className="flex md:hidden items-center gap-1.5 bg-[#121620] border border-[#232938] px-2.5 py-1.5 card-polygon text-xs text-stellar-yellow">
                <Coins className="w-3.5 h-3.5" />
                <span className="font-bold">{balances.xlm}</span>
              </div>

              {/* Notification Ping Icon */}
              <button
                type="button"
                className="p-2 border border-[#232938] text-stellar-muted hover:text-stellar-yellow bg-[#121620] btn-polygon transition-colors cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* Verified Identity Block */}
              <div className="flex items-center gap-2 bg-[#121620] border border-[#232938] px-3 py-1.5 card-polygon">
                <ShieldCheck className="w-4 h-4 text-stellar-yellow" />
                <div className="text-right">
                  <div className="text-xs text-stellar-yellow font-bold uppercase leading-none">
                    {member.org_name}
                  </div>
                  <div className="text-[11px] text-stellar-muted leading-tight mt-1">
                    {formatAddress(wallet)}
                  </div>
                </div>
              </div>

              {/* Disconnect Action */}
              <button
                type="button"
                onClick={onDisconnect}
                className="p-2 border border-[#232938] hover:border-red-500/50 hover:text-red-400 bg-[#121620] text-stellar-muted btn-polygon transition-colors cursor-pointer"
                title="Disconnect Wallet"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              disabled={isConnecting}
              className="px-5 py-2 bg-stellar-yellow text-black font-bold text-xs tracking-wider flex items-center gap-2 btn-polygon hover:bg-stellar-gold cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'CONNECTING...' : 'CONNECT FREIGHTER'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;