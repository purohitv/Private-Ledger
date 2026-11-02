import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { Currency, SUPPORTED_CURRENCIES, UserProfile } from '../../types.ts';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAddExpense: () => void;
  activeTab: string;
  currency: Currency;
  onSelectCurrency: (c: Currency) => void;
  currentUser: UserProfile | null;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenAddExpense,
  activeTab,
  currency,
  onSelectCurrency,
  currentUser,
  onOpenProfile,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Financial Overview';
      case 'expenses':
        return 'Transaction Ledger';
      case 'analytics':
        return 'Visual Analytics';
      case 'categories':
        return 'Allocations & Budgets';
      default:
        return 'Ledger';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-[#ffffff] border-b border-[#e5dfd4] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-[#4a4f4b] hover:text-[#1c221e] hover:bg-[#f4efe6] rounded-md transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#797c76] font-medium font-mono">
            <span>Private Ledger</span>
            <span>/</span>
            <span className="text-[#1c221e] font-semibold">{activeTab}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#1c221e] font-serif leading-tight">
            {getTabTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Currency switcher, Add Transaction, Monogram Profile button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Selector */}
        <div className="relative">
          <select
            value={currency.code}
            onChange={(e) => {
              const selected = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
              if (selected) onSelectCurrency(selected);
            }}
            className="appearance-none bg-[#faf8f4] border border-[#d8d1c3] hover:border-[#bbaea0] text-xs font-semibold text-[#2c332e] py-1.5 pl-3 pr-7 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#1b3829] cursor-pointer transition-colors"
            title="Display Currency"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8c857b] text-[10px]">
            ▼
          </div>
        </div>

        {/* Add Transaction Button */}
        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 py-1.5 px-3.5 bg-[#1a3828] hover:bg-[#132c1f] text-[#f7f5ed] border border-[#142c1f] text-xs font-semibold rounded-sm shadow-xs transition-colors tracking-wide cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#d4b47a]" />
          <span>New Entry</span>
        </button>

        {/* User Profile Monogram Button */}
        <div className="flex items-center pl-2 border-l border-[#e5dfd4]">
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-[#1b3829] hover:bg-[#254634] border border-[#c5a265] text-[#e8d5b5] flex items-center justify-center font-serif text-xs font-bold shadow-2xs transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#1b3829] cursor-pointer"
            title={`Account: ${currentUser?.name || 'Sakshi Pawar'} (Click to view profile & allocations)`}
          >
            {getInitials(currentUser?.name)}
          </button>
        </div>
      </div>
    </header>
  );
};
