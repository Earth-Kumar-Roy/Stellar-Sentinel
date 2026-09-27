import React from 'react';
import {
  LayoutDashboard,
  Send,
  Building2,
  Clock,
  History,
  Wallet,
  Activity,
  Users,
  Compass,
  FileText,
  BookOpen,
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'make-payment' 
  | 'register' 
  | 'quarantined' 
  | 'search' 
  | 'org-search' 
  | 'history' 
  | 'invoices'
  | 'direct-transfer' 
  | 'wallet-activity'
  | 'docs';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  quarantineCount?: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  quarantineCount = 0,
  userRole,
}) => {
  const isTreasurer = userRole?.toLowerCase() === 'treasurer';

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    highlight?: boolean;
  }> = isTreasurer
    ? [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'make-payment', label: 'Disburse Intent', icon: Send },
        {
          id: 'quarantined',
          label: 'Ongoing Queue',
          icon: Clock,
          badge: quarantineCount > 0 ? quarantineCount : undefined,
          highlight: quarantineCount > 0,
        },
        { id: 'history', label: 'Company History', icon: History },
        { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
        { id: 'org-search', label: 'Org Explorer', icon: Compass },
        { id: 'search', label: 'My Organization', icon: Users },
        { id: 'wallet-activity', label: 'Wallet History', icon: Activity },
        { id: 'register', label: 'Entity Registration', icon: Building2 },
        { id: 'docs', label: 'Documentation', icon: BookOpen },
      ]
    : [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        {
          id: 'quarantined',
          label: 'Ongoing Queue',
          icon: Clock,
          badge: quarantineCount > 0 ? quarantineCount : undefined,
          highlight: quarantineCount > 0,
        },
        { id: 'history', label: 'Company History', icon: History },
        { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
        { id: 'org-search', label: 'Org Explorer', icon: Compass },
        { id: 'search', label: 'My Organization', icon: Users },
        { id: 'wallet-activity', label: 'Wallet History', icon: Activity },
        { id: 'direct-transfer', label: 'Direct P2P Transfer', icon: Wallet },
        { id: 'register', label: 'Entity Registration', icon: Building2 },
        { id: 'docs', label: 'Documentation', icon: BookOpen },
      ];

  return (
    <aside className="w-64 border-r border-[#232938] bg-[#07090E] p-4 flex flex-col justify-between shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono text-stellar-muted uppercase tracking-wider">
          {isTreasurer ? 'Treasury Navigation' : 'Signer/Guardian Control'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 font-mono text-xs tracking-wide btn-polygon transition-all ${
                isActive
                  ? 'bg-stellar-yellow text-black font-bold shadow-sm'
                  : 'text-stellar-muted hover:text-white hover:bg-[#121620] border border-transparent hover:border-[#232938]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-stellar-muted'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-black text-stellar-yellow'
                      : item.highlight
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-[#232938] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {userRole && (
        <div className="p-3 bg-[#121620] border border-[#232938] card-polygon mt-4">
          <div className="text-[10px] font-mono text-stellar-muted uppercase">Signed In Role</div>
          <div className="text-xs font-mono text-stellar-yellow font-bold capitalize mt-0.5">
            {userRole}
          </div>
        </div>
      )}
    </aside>
  );
};