import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart as PieChartIcon,
  Tags,
  X,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types.ts';

interface SidebarProps {
  activeTab: 'dashboard' | 'expenses' | 'analytics' | 'categories';
  setActiveTab: (tab: 'dashboard' | 'expenses' | 'analytics' | 'categories') => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onOpenAddExpense: () => void;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  onOpenAddExpense,
  currentUser,
  onOpenProfile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Metrics & Allocation',
    },
    {
      id: 'expenses',
      label: 'Transactions',
      icon: Receipt,
      description: 'Records & Filtering',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChartIcon,
      description: 'Charts & Distributions',
    },
    {
      id: 'categories',
      label: 'Allocations',
      icon: Tags,
      description: 'Categories & Budgets',
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'SP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0f1a14]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#112217] text-[#f4efe6] border-r border-[#1e3829] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#1e3829]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#1b3829] border border-[#c5a265] flex items-center justify-center font-serif font-bold text-[#d8be8d] text-base shadow-sm">
              ☧
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider font-serif text-[#f7f4ed] leading-tight">
                PRIVATE LEDGER
              </div>
              <div className="text-[10px] text-[#8ea396] font-medium tracking-wide">
                Personal Wealth &amp; Spending
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-[#8ea396] hover:text-[#f7f4ed] rounded-sm cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action: Record Entry */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenAddExpense();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1e3a2b] hover:bg-[#254634] active:bg-[#183124] text-[#f7f4ed] border border-[#315641] rounded-sm text-xs font-semibold shadow-xs transition-colors tracking-wide cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#c5a265]" />
            <span>Record Entry</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-[#6e8577] uppercase tracking-widest font-mono">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1b3627] text-[#f7f4ed] font-medium border-l-2 border-[#c5a265]'
                    : 'text-[#9cb2a5] hover:bg-[#162c1f] hover:text-[#f7f4ed]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#c5a265]' : 'text-[#6e8577]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium leading-none font-serif tracking-wide">{item.label}</div>
                  <div className="text-[10px] text-[#6e8577] mt-1 truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer: User Account & Security badge */}
        <div className="p-3 border-t border-[#1e3829] space-y-2">
          {currentUser && onOpenProfile && (
            <button
              onClick={() => {
                onOpenProfile();
                setIsOpen(false);
              }}
              className="w-full p-2.5 rounded-sm bg-[#162a1e] hover:bg-[#1f3929] text-left transition-colors flex items-center gap-2.5 border border-[#213e2d] cursor-pointer"
              title="Click to view profile, income & account settings"
            >
              <div className="w-8 h-8 rounded-full bg-[#1b3829] border border-[#c5a265] text-[#d8b87b] flex items-center justify-center font-serif text-xs font-bold shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#f7f4ed] truncate font-serif">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#8ea396] truncate font-mono">
                  {currentUser.email}
                </div>
              </div>
            </button>
          )}

          <div className="px-3 py-2 rounded-sm bg-[#0e1c13] border border-[#1a3424] flex items-center gap-2 text-[10px] text-[#7d9486]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c5a265] shrink-0" />
            <span className="truncate">Encrypted Private Ledger • PostgreSQL</span>
          </div>
        </div>
      </aside>
    </>
  );
};
