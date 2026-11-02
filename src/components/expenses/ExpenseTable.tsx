import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Edit2,
  Trash2,
  Calendar,
  RotateCcw,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { Expense, Category, Currency, PaymentMethod, SUPPORTED_PAYMENT_METHODS } from '../../types.ts';

interface ExpenseTableProps {
  expenses: Expense[];
  categories: Category[];
  currency: Currency;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onClearAllExpenses: () => Promise<void>;
  onOpenAddExpense: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  categories,
  currency,
  onEditExpense,
  onDeleteExpense,
  onClearAllExpenses,
  onOpenAddExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc'>('date-desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Delete confirmation state
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear all confirmation state
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Quick Date Presets
  const handleSetThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${y}-${m}-01`;
    const lastDayNum = new Date(y, now.getMonth() + 1, 0).getDate();
    const lastDay = `${y}-${m}-${String(lastDayNum).padStart(2, '0')}`;
    setStartDate(firstDay);
    setEndDate(lastDay);
    setCurrentPage(1);
  };

  const handleSetLast30Days = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedPaymentMethod !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (minAmount && parseFloat(minAmount) > 0) count++;
    return count;
  }, [searchTerm, selectedCategory, selectedPaymentMethod, startDate, endDate, minAmount]);

  const filteredExpenses = useMemo(() => {
    const minAmt = parseFloat(minAmount);

    return expenses
      .filter((e) => {
        const matchesSearch =
          !searchTerm ||
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;

        const matchesPayment =
          selectedPaymentMethod === 'all' ||
          (e.paymentMethod || 'UPI') === selectedPaymentMethod;

        const matchesMinAmount = isNaN(minAmt) || minAmt <= 0 || e.amount >= minAmt;

        let matchesDate = true;
        if (e.date) {
          const expDateOnly = e.date.split('T')[0];
          if (startDate && expDateOnly < startDate) matchesDate = false;
          if (endDate && expDateOnly > endDate) matchesDate = false;
        }

        return matchesSearch && matchesCat && matchesPayment && matchesMinAmount && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, startDate, endDate, minAmount, sortBy]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const formatAmount = (num: any) => {
    const n = typeof num === 'number' ? num : parseFloat(num?.amount ?? num) || 0;
    if (currency.code === 'INR') {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Payee / Title', 'Amount', 'Date', 'Category', 'Payment Instrument', 'Description'];
    const rows = filteredExpenses.map((e) => [
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.date.split('T')[0],
      `"${e.category}"`,
      `"${e.paymentMethod || 'UPI'}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `private_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (catName: string) => {
    const found = categories.find((c) => c.name === catName);
    return found?.color || '#524f4b';
  };

  const getPaymentBadge = (method?: string) => {
    const m = method || 'UPI';
    switch (m) {
      case 'UPI':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-[#edf4ee] text-[#1b3d2b] border border-[#bed7c3]">
            UPI
          </span>
        );
      case 'Cash':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-[#f6f2e9] text-[#6d5c48] border border-[#e2d6c1]">
            Cash
          </span>
        );
      case 'Bank Transfer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-[#eef3f7] text-[#374b5c] border border-[#c6d6e3]">
            Bank Wire
          </span>
        );
      case 'Debit Card':
      case 'Credit Card':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-[#f9edf0] text-[#6b2c37] border border-[#e5c3ca]">
            {m}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-[#f4efe6] text-[#4d4841] border border-[#e4dcce]">
            {m}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-[#ffffff] p-4 sm:p-5 rounded-sm border border-[#e5dfd4] shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#1b3829]" />
            <h3 className="text-xs font-bold text-[#1c221e] uppercase tracking-wider font-mono">
              Journal Filtering
            </h3>
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-[#f4efe6] text-[#524e47] border border-[#dfd6c5]">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 text-xs text-[#716c65] hover:text-[#1c221e] font-serif transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Primary Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8c857b]" />
            <input
              type="text"
              placeholder="Search payee or note..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829]"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] appearance-none font-medium text-[#2c332e]"
            >
              <option value="all">All Allocations ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8c857b] text-xs">
              ▼
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] appearance-none font-medium text-[#2c332e]"
            >
              <option value="all">All Payment Instruments</option>
              {SUPPORTED_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8c857b] text-xs">
              ▼
            </div>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] appearance-none font-medium text-[#2c332e]"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
              <option value="name-asc">Payee / Title (A-Z)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8c857b] text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="p-3 bg-[#faf8f4] rounded-xs border border-[#ece6db] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-[#3b3832] font-serif flex items-center gap-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#1b3829]" />
              <span>Interval:</span>
            </span>

            {/* Start Date */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-[#716c65] font-serif">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs bg-[#ffffff] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] text-[#2c332e]"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-[#716c65] font-serif">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs bg-[#ffffff] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] text-[#2c332e]"
              />
            </div>

            {/* Min Amount */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-[#716c65] font-serif">Min</label>
              <input
                type="number"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-20 px-2 py-1 text-xs bg-[#ffffff] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] text-[#2c332e] tabular-nums"
              />
            </div>

            {(startDate || endDate || minAmount) && (
              <button
                onClick={handleClearDateRange}
                className="text-[11px] text-[#716c65] hover:text-[#1c221e] underline ml-1 font-serif"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[#8c857b] font-serif">Period:</span>
            <button
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 bg-[#ffffff] hover:bg-[#f4efe6] text-[#3b3832] border border-[#d8d1c4] rounded-xs text-[11px] font-medium transition-colors"
            >
              Current Month
            </button>
            <button
              onClick={handleSetLast30Days}
              className="px-2.5 py-1 bg-[#ffffff] hover:bg-[#f4efe6] text-[#3b3832] border border-[#d8d1c4] rounded-xs text-[11px] font-medium transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Filter Summary & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0ece4] text-xs text-[#716c65]">
          <div className="flex items-center gap-2">
            <span>
              Entries: <strong className="text-[#1c221e] font-serif">{filteredExpenses.length}</strong> of{' '}
              {expenses.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Subtotal:{' '}
              <strong className="text-[#1c221e] font-serif tabular-nums">
                {currency.symbol}{formatAmount(totalFilteredAmount)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4efe6] hover:bg-[#e9e3d7] text-[#3b3832] border border-[#d8d1c4] font-medium rounded-xs transition-colors disabled:opacity-40"
              title="Export displayed ledger entries to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {expenses.length > 0 && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fcf5f5] hover:bg-[#f9ecec] text-[#78282d] border border-[#e5c3ca] font-medium rounded-xs transition-colors"
                title="Clear ledger entries"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Ledger</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table Container */}
      <div className="bg-[#ffffff] rounded-sm border border-[#e5dfd4] shadow-2xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7b766f] space-y-2">
            <Receipt className="w-10 h-10 text-[#c5bdaf] mx-auto mb-2 stroke-1" />
            <h3 className="text-sm font-semibold text-[#2c332e] font-serif">
              {activeFiltersCount > 0 ? 'No transactions match filter criteria' : 'The ledger contains no recorded entries'}
            </h3>
            <p className="text-xs text-[#8c857b] max-w-sm mx-auto">
              {activeFiltersCount > 0
                ? 'Try broadening your interval, clearing minimum limits, or resetting filters.'
                : 'Your ledger is ready for your personal input. Click below to record your first transaction.'}
            </p>
            <div className="pt-2">
              {activeFiltersCount > 0 ? (
                <button
                  onClick={handleResetAllFilters}
                  className="px-4 py-2 bg-[#f4efe6] hover:bg-[#eae3d5] text-[#3b3832] border border-[#d8d1c4] text-xs font-semibold rounded-xs transition-colors"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={onOpenAddExpense}
                  className="px-4 py-2 bg-[#1a3828] hover:bg-[#132c1f] text-[#f7f5ed] border border-[#142c1f] text-xs font-semibold rounded-xs transition-colors shadow-xs tracking-wide font-serif"
                >
                  Record First Entry
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8f4] border-b border-[#e5dfd4] text-[10px] font-semibold text-[#7c7871] uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payee / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2eee7] text-xs">
                {paginatedExpenses.map((expense) => {
                  const dateStr = expense.date ? new Date(expense.date).toLocaleDateString(currency.code === 'INR' ? 'en-IN' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }) : 'N/A';
                  const catColor = getCategoryColor(expense.category);

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-[#faf8f4] transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-[#6e6a64] font-mono text-[11px] tabular-nums">
                        {dateStr}
                      </td>

                      {/* Payee / Title */}
                      <td className="py-3 px-4 font-semibold text-[#1c221e] max-w-xs truncate font-serif text-[13px]">
                        {expense.title}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="text-[#3b3832] font-medium">{expense.category}</span>
                        </div>
                      </td>

                      {/* Instrument */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPaymentBadge(expense.paymentMethod)}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-[#757069] max-w-sm truncate">
                        {expense.description || <span className="text-[#c4bcaf] italic">—</span>}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-bold text-[#1c221e] whitespace-nowrap tabular-nums font-serif text-sm">
                        {currency.symbol}{formatAmount(expense.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditExpense(expense)}
                            className="p-1 text-[#8c857b] hover:text-[#1b3829] hover:bg-[#f2ece2] rounded-xs transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(expense)}
                            className="p-1 text-[#8c857b] hover:text-[#78282d] hover:bg-[#fbf0f0] rounded-xs transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#e5dfd4] bg-[#faf8f4] text-xs">
            <span className="text-[#7c7871] font-serif">
              Page <strong className="font-semibold text-[#1c221e]">{currentPage}</strong> of{' '}
              <strong className="font-semibold text-[#1c221e]">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-xs border border-[#d8d1c4] bg-[#ffffff] hover:bg-[#f4efe6] disabled:opacity-30 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-xs border border-[#d8d1c4] bg-[#ffffff] hover:bg-[#f4efe6] disabled:opacity-30 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-[#101b14]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-sm shadow-xl border border-[#d8d1c4] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#78282d]">
              <div className="w-9 h-9 rounded-sm bg-[#faeded] border border-[#e5c3ca] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#78282d]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1c221e] font-serif">Delete Ledger Entry?</h3>
                <p className="text-xs text-[#716c65]">This removal is permanent.</p>
              </div>
            </div>

            <div className="p-3 bg-[#faf8f4] rounded-xs text-xs space-y-1 border border-[#e5dfd4]">
              <div className="flex justify-between">
                <span className="text-[#716c65]">Entry:</span>
                <span className="font-semibold text-[#1c221e] font-serif">{expenseToDelete.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716c65]">Amount:</span>
                <span className="font-semibold text-[#1c221e] tabular-nums font-serif">
                  {currency.symbol}{formatAmount(expenseToDelete.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716c65]">Allocation:</span>
                <span className="font-semibold text-[#3b3832]">{expenseToDelete.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-[#5a554e] bg-[#f4efe6] hover:bg-[#e9e3d7] rounded-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-[#ffffff] bg-[#78282d] hover:bg-[#631e23] rounded-xs transition-colors disabled:opacity-50 font-serif tracking-wide"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#101b14]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-sm shadow-xl border border-[#d8d1c4] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#78282d]">
              <div className="w-9 h-9 rounded-sm bg-[#faeded] border border-[#e5c3ca] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#78282d]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1c221e] font-serif">Clear All Transactions?</h3>
                <p className="text-xs text-[#716c65]">Start with a fresh, blank ledger</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#faf8f4] rounded-xs text-xs space-y-2 border border-[#e5dfd4]">
              <p className="text-[#423e38] leading-relaxed">
                You are about to delete all <strong className="text-[#1c221e] font-bold">{expenses.length}</strong> transaction entries from storage.
              </p>
              <div className="pt-2 border-t border-[#e5dfd4] text-[#1b3d2b] font-medium flex items-center gap-1.5 font-serif">
                <span>✓</span>
                <span>All {categories.length} categories and their budget allocations will remain preserved.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                disabled={isClearingAll}
                className="px-4 py-2 text-xs font-medium text-[#5a554e] bg-[#f4efe6] hover:bg-[#e9e3d7] rounded-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsClearingAll(true);
                    await onClearAllExpenses();
                    setIsClearConfirmOpen(false);
                  } catch (err) {
                    console.error('Failed to clear expenses:', err);
                  } finally {
                    setIsClearingAll(false);
                  }
                }}
                disabled={isClearingAll}
                className="px-4 py-2 text-xs font-semibold text-[#ffffff] bg-[#78282d] hover:bg-[#631e23] rounded-xs transition-colors disabled:opacity-50 font-serif tracking-wide"
              >
                {isClearingAll ? 'Clearing Entries...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
