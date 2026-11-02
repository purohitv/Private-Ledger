import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  CalendarDays,
  TrendingDown,
  Award,
  Plus,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  PiggyBank,
  Edit3,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Compass,
  User,
} from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { StatCard } from './components/dashboard/StatCard.tsx';
import { RecentExpenses } from './components/dashboard/RecentExpenses.tsx';
import { MonthlyBarChart } from './components/analytics/MonthlyBarChart.tsx';
import { CategoryPieChart } from './components/analytics/CategoryPieChart.tsx';
import { PaymentModeChart } from './components/analytics/PaymentModeChart.tsx';
import { BudgetVsActualChart } from './components/analytics/BudgetVsActualChart.tsx';
import { ExpenseTable } from './components/expenses/ExpenseTable.tsx';
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal.tsx';
import { CategoryManager } from './components/categories/CategoryManager.tsx';
import { UserProfileModal } from './components/profile/UserProfileModal.tsx';
import {
  Expense,
  Category,
  ExpenseSummary,
  SystemStatus,
  Currency,
  PaymentMethod,
  UserProfile,
  SUPPORTED_CURRENCIES,
} from './types.ts';
import * as api from './api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'analytics' | 'categories'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]); // INR default

  // User Profile & Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Data state
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(75000);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Income edit inline state
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('75000');

  // Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const formatAmount = (num: any) => {
    let n = 0;
    if (typeof num === 'number') {
      n = isNaN(num) ? 0 : num;
    } else if (typeof num === 'string') {
      const parsed = parseFloat(num);
      n = isNaN(parsed) ? 0 : parsed;
    } else if (num && typeof num === 'object') {
      const candidate = num.amount ?? num.total ?? num.budget ?? num.income ?? 0;
      const parsed = parseFloat(candidate);
      n = isNaN(parsed) ? 0 : parsed;
    }
    if (currency.code === 'INR') {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Master refresh function
  const loadAllData = useCallback(async () => {
    try {
      const [sumData, expData, catData, incData, sysData, userData] = await Promise.all([
        api.fetchSummary(),
        api.fetchExpenses(),
        api.fetchCategories(),
        api.fetchMonthlyIncome().catch(() => 75000),
        api.fetchSystemStatus().catch(() => null),
        api.fetchCurrentUser().catch(() => null),
      ]);
      setSummary(sumData);
      setExpenses(expData);
      setCategories(catData);
      const parsedInc = typeof incData === 'number' ? incData : Number((incData as any)?.income ?? incData) || 75000;
      setMonthlyIncome(parsedInc);
      setIncomeInput(String(parsedInc));
      if (sysData) setSystemStatus(sysData);

      if (userData) {
        setCurrentUser(userData);
        if (userData.currencyCode) {
          const matched = SUPPORTED_CURRENCIES.find((c) => c.code === userData.currencyCode);
          if (matched) setCurrency(matched);
        }
      }
    } catch (err: any) {
      console.error('Error loading ledger data:', err);
      const msg = typeof err === 'string' ? err : err?.message || 'Unable to retrieve data from server';
      showToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers for User Profile
  const handleUserUpdated = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    const parsedInc = typeof updatedUser.monthlyIncome === 'number' ? updatedUser.monthlyIncome : Number(updatedUser.monthlyIncome) || 50000;
    setMonthlyIncome(parsedInc);
    setIncomeInput(String(parsedInc));
    if (updatedUser.currencyCode) {
      const matched = SUPPORTED_CURRENCIES.find((c) => c.code === updatedUser.currencyCode);
      if (matched) setCurrency(matched);
    }
    showToast('success', `Profile updated for ${updatedUser.name}`);
    loadAllData();
  };

  const handleLogout = async () => {
    await api.logoutUser();
    setCurrentUser(null);
    setIsProfileModalOpen(false);
    showToast('success', 'Signed out. Operating in private guest session.');
    await loadAllData();
  };

  // Handlers for Expenses
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (formData: {
    title: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    paymentMethod: PaymentMethod;
  }) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, formData);
      showToast('success', `Updated "${formData.title}"`);
    } else {
      await api.createExpense(formData);
      showToast('success', `Recorded entry: ${currency.symbol}${formData.amount.toFixed(2)} for ${formData.title}`);
    }
    await loadAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    showToast('success', 'Transaction entry removed');
    await loadAllData();
  };

  const handleClearAllExpenses = async () => {
    const res = await api.clearAllExpenses();
    showToast('success', res.message || 'All records cleared. Ledger is now blank.');
    await loadAllData();
  };

  // Handlers for Categories
  const handleAddCategory = async (data: { name: string; color: string; budget: number }) => {
    await api.createCategory(data);
    showToast('success', `Account "${data.name}" added`);
    await loadAllData();
  };

  const handleUpdateCategory = async (
    id: string,
    data: { name: string; color: string; budget: number }
  ) => {
    await api.updateCategory(id, data);
    showToast('success', `Account "${data.name}" updated`);
    await loadAllData();
  };

  const handleDeleteCategory = async (id: string, reassignTo?: string) => {
    await api.deleteCategory(id, reassignTo);
    showToast('success', 'Category account removed');
    await loadAllData();
  };

  // Handler for Monthly Allocation
  const handleSaveIncome = async () => {
    const val = parseFloat(incomeInput);
    if (isNaN(val) || val < 0) {
      showToast('error', 'Please enter a valid monthly allocation figure');
      return;
    }
    try {
      const updated = await api.updateMonthlyIncome(val);
      setMonthlyIncome(updated);
      setIsEditingIncome(false);
      showToast('success', `Monthly allocation updated to ${currency.symbol}${formatAmount(updated)}`);
      await loadAllData();
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update allocation');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f2] flex flex-col antialiased text-[#2c261e]">
      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg border text-xs font-medium tracking-wide ${
              toast.type === 'success'
                ? 'bg-[#1b3829] text-[#fbfaf6] border-[#294d3a]'
                : 'bg-[#842e3b] text-[#fbfaf6] border-[#9c3948]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#d8b87b] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{typeof toast.message === 'object' ? JSON.stringify(toast.message) : String(toast.message ?? '')}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-[#d6cec0] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-row min-h-screen">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onOpenAddExpense={handleOpenAddExpense}
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <Navbar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onOpenAddExpense={handleOpenAddExpense}
            activeTab={activeTab}
            currency={currency}
            onSelectCurrency={setCurrency}
            currentUser={currentUser}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />

          {/* Main Body Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[#1b3829]" />
                <p className="text-xs font-serif text-[#716556]">Accessing ledger vault &amp; profile...</p>
              </div>
            ) : (
              <>
                {/* 1. DASHBOARD OVERVIEW TAB */}
                {activeTab === 'dashboard' && summary && (
                  <div className="space-y-6">
                    {/* Top Capital & Allocation Banner */}
                    <div className="bg-[#112217] text-[#fbfaf6] p-6 rounded-lg border border-[#1b3829] shadow-sm flex flex-wrap items-center justify-between gap-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#1b3829]/30 to-transparent pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-[#1b3829] text-[#d8b87b] border border-[#2a4d3a]">
                            Capital Management
                          </span>
                          <span className="text-[#a49989] text-xs font-mono">• {summary.currentMonth.label}</span>
                          {currentUser && (
                            <span className="text-[#d8b87b] text-xs font-serif italic">
                              (Managed by {currentUser.name})
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#fbfaf6] tracking-tight">
                          Monthly Allocation: {currency.symbol}{formatAmount(monthlyIncome)}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#d6cec0] mt-1.5 font-sans">
                          <span>
                            Disbursed:{' '}
                            <strong className="text-white font-mono">{currency.symbol}{formatAmount(summary.currentMonth.total)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Surplus Balance:{' '}
                            <strong className={`font-mono ${summary.netSavings >= 0 ? 'text-[#a3c9a8]' : 'text-[#f0a8a8]'}`}>
                              {currency.symbol}{formatAmount(summary.netSavings)}
                            </strong>{' '}
                            ({summary.savingsRate}% surplus rate)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 relative z-10">
                        {isEditingIncome ? (
                          <div className="flex items-center gap-1.5 bg-[#1b3829] p-1.5 rounded border border-[#2d523e]">
                            <span className="text-xs font-bold pl-2 text-[#d8b87b] font-mono">{currency.symbol}</span>
                            <input
                              type="number"
                              value={incomeInput}
                              onChange={(e) => setIncomeInput(e.target.value)}
                              className="w-28 px-2 py-1 text-xs bg-[#fdfcf9] text-[#1b3829] rounded font-mono font-semibold focus:outline-none"
                            />
                            <button
                              onClick={handleSaveIncome}
                              className="p-1.5 bg-[#d8b87b] hover:bg-[#c4a162] text-[#112217] rounded transition-colors"
                              title="Commit Allocation"
                            >
                              <Check className="w-3.5 h-3.5 font-bold" />
                            </button>
                            <button
                              onClick={() => setIsEditingIncome(false)}
                              className="p-1.5 bg-[#274837] hover:bg-[#345c47] text-[#ebe4d8] rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsEditingIncome(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1b3829] hover:bg-[#254934] text-[#ebe4d8] text-xs font-medium rounded border border-[#2d523e] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#d8b87b]" />
                            <span>Adjust Allocation</span>
                          </button>
                        )}

                        <button
                          onClick={handleOpenAddExpense}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#b58c49] hover:bg-[#9e793d] text-[#112217] text-xs font-semibold rounded shadow-xs transition-colors tracking-wide"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Record Entry</span>
                        </button>
                      </div>
                    </div>

                    {/* Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Expenses */}
                      <StatCard
                        title="All-Time Disbursements"
                        value={`${currency.symbol}${formatAmount(summary.totalExpenses)}`}
                        subtitle={summary.totalCount === 0 ? 'No recorded entries' : `${summary.totalCount} ledger entries`}
                        icon={Wallet}
                      />

                      {/* Current Month Expenses */}
                      <StatCard
                        title={`${summary.currentMonth.label}`}
                        value={`${currency.symbol}${formatAmount(summary.currentMonth.total)}`}
                        badge={{
                          text: `${summary.currentMonth.changePercent >= 0 ? '+' : ''}${
                            summary.currentMonth.changePercent
                          }% vs prior`,
                          isPositive: summary.currentMonth.changePercent <= 0,
                          isNeutral: summary.currentMonth.changePercent === 0,
                        }}
                        icon={CalendarDays}
                      />

                      {/* Net Month Savings */}
                      <StatCard
                        title="Period Net Surplus"
                        value={`${currency.symbol}${formatAmount(summary.netSavings)}`}
                        subtitle={summary.netSavings >= 0 ? `${summary.savingsRate}% surplus margin` : 'Allocation deficit'}
                        badge={{
                          text: summary.netSavings >= 0 ? 'Surplus' : 'Deficit',
                          isPositive: summary.netSavings >= 0,
                        }}
                        icon={PiggyBank}
                      />

                      {/* Top Single Expense */}
                      <StatCard
                        title="Highest Entry"
                        value={`${currency.symbol}${formatAmount(summary.highestExpense.amount)}`}
                        subtitle={summary.highestExpense.amount > 0 ? summary.highestExpense.title : 'None recorded'}
                        icon={Award}
                      />
                    </div>

                    {/* Graphs Row: Monthly Bar Chart & Category Pie Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-[#fdfcf9] p-5 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <MonthlyBarChart
                          data={summary.monthlyTrend}
                          currency={currency}
                          height={280}
                        />
                      </div>

                      <div className="bg-[#fdfcf9] p-5 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <CategoryPieChart
                          data={summary.categoryBreakdown}
                          currency={currency}
                          totalExpenses={summary.totalExpenses}
                        />
                      </div>
                    </div>

                    {/* Middle Grid: Payment Mode Chart & Budget Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#fdfcf9] p-5 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <PaymentModeChart
                          data={summary.paymentMethodBreakdown}
                          currency={currency}
                          totalExpenses={summary.totalExpenses}
                        />
                      </div>

                      <div className="bg-[#fdfcf9] p-5 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <BudgetVsActualChart
                          data={summary.budgetComparison}
                          currency={currency}
                        />
                      </div>
                    </div>

                    {/* Bottom Split: Recent Transactions & Account Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <RecentExpenses
                          expenses={summary.recentExpenses}
                          categories={categories}
                          currency={currency}
                          onViewAll={() => setActiveTab('expenses')}
                          onEditExpense={handleOpenEditExpense}
                          onDeleteExpense={handleDeleteExpense}
                        />
                      </div>

                      {/* Accounts & Ledger Summary Card */}
                      <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono tracking-widest uppercase text-[#8c7e6c]">
                              Accounts Summary
                            </span>
                            <button
                              onClick={() => setActiveTab('categories')}
                              className="text-xs font-semibold text-[#1b3829] hover:underline"
                            >
                              Manage &rarr;
                            </button>
                          </div>
                          <h3 className="text-base font-serif font-bold text-[#1b3829] mb-3">
                            Account Balances &amp; Budgets
                          </h3>
                          <p className="text-xs text-[#716556] mb-4">
                            Track designated accounts against their monthly expenditure guidelines.
                          </p>

                          <div className="space-y-2.5">
                            {summary.categoryBreakdown.slice(0, 4).map((cat) => {
                              const hasBudget = cat.budget > 0;
                              const pct = hasBudget ? Math.min(100, Math.round((cat.total / cat.budget) * 100)) : 0;
                              return (
                                <div
                                  key={cat.category}
                                  className="p-3 bg-[#f7f4ed] rounded border border-[#e5dfd4] space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                      />
                                      <span className="font-serif font-semibold text-[#1b3829]">{cat.category}</span>
                                    </div>
                                    <span className="font-mono font-semibold text-[#2c261e] tabular-nums">
                                      {currency.symbol}{formatAmount(cat.total)}
                                    </span>
                                  </div>
                                  {hasBudget && (
                                    <div className="w-full h-1 bg-[#ebe4d8] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#1b3829] rounded-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[#e5dfd4]">
                          <button
                            onClick={handleOpenAddExpense}
                            className="w-full py-2.5 bg-[#f4efe6] hover:bg-[#ebe4d8] text-[#1b3829] border border-[#d6cec0] rounded text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add New Ledger Entry</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ALL EXPENSES TABLE TAB */}
                {activeTab === 'expenses' && (
                  <ExpenseTable
                    expenses={expenses}
                    categories={categories}
                    currency={currency}
                    onEditExpense={handleOpenEditExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onClearAllExpenses={handleClearAllExpenses}
                    onOpenAddExpense={handleOpenAddExpense}
                  />
                )}

                {/* 3. DEDICATED ANALYTICS & GRAPHS TAB */}
                {activeTab === 'analytics' && summary && (
                  <div className="space-y-6">
                    <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#8c7e6c] block mb-1">
                          Financial Intelligence
                        </span>
                        <h2 className="text-xl font-serif font-bold text-[#1b3829] tracking-tight">
                          Disbursement Analytics &amp; Visual Charts
                        </h2>
                        <p className="text-xs text-[#716556] mt-0.5">
                          Visual intelligence &amp; metrics: Multi-month trends, category allocation breakdown, payment channels, and budget tracking
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#716556]">Cumulative Recorded:</span>
                        <span className="text-base font-serif font-bold text-[#1b3829] font-mono tabular-nums">
                          {currency.symbol}{formatAmount(summary.totalExpenses)}
                        </span>
                      </div>
                    </div>

                    {/* 4-Chart Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <MonthlyBarChart
                          data={summary.monthlyTrend}
                          currency={currency}
                          height={300}
                        />
                      </div>
                      <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <CategoryPieChart
                          data={summary.categoryBreakdown}
                          currency={currency}
                          totalExpenses={summary.totalExpenses}
                        />
                      </div>
                      <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <PaymentModeChart
                          data={summary.paymentMethodBreakdown}
                          currency={currency}
                          totalExpenses={summary.totalExpenses}
                        />
                      </div>
                      <div className="bg-[#fdfcf9] p-6 rounded-lg border border-[#e5dfd4] shadow-xs">
                        <BudgetVsActualChart
                          data={summary.budgetComparison}
                          currency={currency}
                        />
                      </div>
                    </div>

                    {/* Detailed Category Breakdown Table */}
                    <div className="bg-[#fdfcf9] rounded-lg border border-[#e5dfd4] shadow-xs overflow-hidden">
                      <div className="p-6 border-b border-[#e5dfd4] flex items-center justify-between bg-[#f7f4ed]">
                        <div>
                          <h3 className="text-base font-serif font-bold text-[#1b3829]">
                            Account Expenditure &amp; Budget Allocation
                          </h3>
                          <p className="text-xs text-[#716556] mt-0.5">
                            Comprehensive ledger metrics table detailing transaction volume and allocation standing
                          </p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#f4efe6] border-b border-[#e5dfd4] text-[10px] font-mono font-semibold text-[#8c7e6c] uppercase tracking-wider">
                              <th className="py-3 px-4">Account Category</th>
                              <th className="py-3 px-4 text-center">Entries</th>
                              <th className="py-3 px-4 text-right">Disbursed Total</th>
                              <th className="py-3 px-4 text-right">Ledger Share</th>
                              <th className="py-3 px-4 text-right">Monthly Cap</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e5dfd4]">
                            {summary.categoryBreakdown.map((cat) => (
                              <tr key={cat.category} className="hover:bg-[#f7f4ed] transition-colors">
                                <td className="py-3 px-4 font-serif font-semibold text-[#1b3829] flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-[#1b3829]/20"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                  <span>{cat.category}</span>
                                </td>
                                <td className="py-3 px-4 text-center text-[#54483a] font-mono tabular-nums">
                                  {cat.count}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold font-mono text-[#1b3829] tabular-nums">
                                  {currency.symbol}{formatAmount(cat.total)}
                                </td>
                                <td className="py-3 px-4 text-right text-[#716556] font-mono tabular-nums">
                                  {cat.percentage}%
                                </td>
                                <td className="py-3 px-4 text-right text-[#716556] font-mono tabular-nums">
                                  {cat.budget > 0
                                    ? `${currency.symbol}${formatAmount(cat.budget)}`
                                    : 'Unrestricted'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CATEGORIES MANAGER TAB */}
                {activeTab === 'categories' && summary && (
                  <CategoryManager
                    categories={categories}
                    categoryBreakdown={summary.categoryBreakdown}
                    currency={currency}
                    onAddCategory={handleAddCategory}
                    onUpdateCategory={handleUpdateCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Add / Edit Expense Modal Dialog */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        expenseToEdit={editingExpense}
        categories={categories}
        currency={currency}
      />

      {/* User Profile & Authentication Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={handleUserUpdated}
        onLogout={handleLogout}
        currency={currency}
        onSelectCurrency={setCurrency}
      />
    </div>
  );
}
