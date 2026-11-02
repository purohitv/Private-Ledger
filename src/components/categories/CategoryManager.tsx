import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Check, Bookmark } from 'lucide-react';
import { Category, CategoryBreakdownItem, Currency } from '../../types.ts';

interface CategoryManagerProps {
  categories: Category[];
  categoryBreakdown: CategoryBreakdownItem[];
  currency: Currency;
  onAddCategory: (data: { name: string; color: string; budget: number }) => Promise<void>;
  onUpdateCategory: (id: string, data: { name: string; color: string; budget: number }) => Promise<void>;
  onDeleteCategory: (id: string, reassignTo?: string) => Promise<void>;
}

const HERITAGE_PALETTE = [
  '#1f3d2b', // Forest Green
  '#2d5a3f', // British Racing Green
  '#b58c49', // Antique Gold
  '#8c533e', // Terracotta Clay
  '#374b5c', // Slate Navy
  '#6b2c37', // Deep Burgundy
  '#6d5c48', // Tweed Taupe
  '#33383f', // Oxford Charcoal
  '#5a7261', // Muted Sage
  '#5d3e53', // Vintage Plum
  '#966c3b', // Warm Ochre
  '#4a382e', // Aged Walnut
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  categoryBreakdown,
  currency,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState(HERITAGE_PALETTE[0]);
  const [budget, setBudget] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatAmount = (num: any) => {
    const n = typeof num === 'number' ? num : parseFloat(num?.budget ?? num?.total ?? num) || 0;
    if (currency.code === 'INR') {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setColor(HERITAGE_PALETTE[Math.floor(Math.random() * HERITAGE_PALETTE.length)]);
    setBudget('0');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || HERITAGE_PALETTE[0]);
    setBudget(cat.budget ? cat.budget.toString() : '0');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required');
      return;
    }
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      setFormError('Monthly budget must be zero or a positive figure');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: name.trim(),
          color,
          budget: numBudget,
        });
      } else {
        await onAddCategory({
          name: name.trim(),
          color,
          budget: numBudget,
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to record category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateDelete = (cat: Category) => {
    setDeletingCategory(cat);
    setDeleteError(null);
    const availableTargets = categories.filter((c) => c.id !== cat.id);
    setReassignTarget(availableTargets[0]?.name || '');
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDeleteCategory(deletingCategory.id, reassignTarget || undefined);
      setDeletingCategory(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to remove category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#fdfcf9] p-5 rounded-lg border border-[#e5dfd4] shadow-xs">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#8c7e6c] block mb-1">
            Accounts &amp; Allocations
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1b3829] tracking-tight">Ledger Categories</h2>
          <p className="text-xs text-[#716556] mt-0.5">
            Configure accounts, monthly expenditure allocations, and heritage color identifiers
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1b3829] hover:bg-[#142a1e] text-[#fdfcf9] text-xs font-semibold rounded tracking-wide shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const breakdown = categoryBreakdown.find((b) => b.category === cat.name);
          const totalSpent = breakdown?.total || 0;
          const expenseCount = breakdown?.count || 0;
          const hasBudget = cat.budget > 0;
          const budgetPercent = hasBudget ? Math.round((totalSpent / cat.budget) * 100) : 0;
          const isOverBudget = hasBudget && totalSpent > cat.budget;

          return (
            <div
              key={cat.id}
              className="bg-[#fdfcf9] rounded-lg border border-[#e5dfd4] p-5 shadow-xs flex flex-col justify-between hover:border-[#cbbfad] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-[#1b3829]/15"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="text-base font-serif font-bold text-[#1b3829] truncate">{cat.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-[#8c7e6c] hover:text-[#1b3829] hover:bg-[#f4efe6] rounded transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleInitiateDelete(cat)}
                      className="p-1.5 text-[#8c7e6c] hover:text-[#842e3b] hover:bg-[#f9ecee] rounded transition-colors"
                      title="Remove Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f7f4ed] rounded border border-[#ebe4d8] text-xs mb-3.5">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c7e6c]">Disbursed</span>
                    <div className="text-sm font-semibold font-mono text-[#1b3829] tabular-nums mt-0.5">
                      {currency.symbol}{formatAmount(totalSpent)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#8c7e6c]">Entries</span>
                    <div className="text-sm font-semibold font-mono text-[#54483a] tabular-nums mt-0.5">
                      {expenseCount} {expenseCount === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </div>

                {/* Budget Allocation Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#716556]">
                      Allocation:{' '}
                      <strong className="text-[#2c261e] font-mono font-medium">
                        {hasBudget ? `${currency.symbol}${formatAmount(cat.budget)}` : 'Unrestricted'}
                      </strong>
                    </span>
                    {hasBudget && (
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums ${
                          isOverBudget ? 'text-[#842e3b]' : 'text-[#1b3829]'
                        }`}
                      >
                        {budgetPercent}%
                      </span>
                    )}
                  </div>
                  {hasBudget && (
                    <div className="w-full h-1.5 bg-[#ebe4d8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-[#842e3b]' : 'bg-[#1b3829]'
                        }`}
                        style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                      />
                    </div>
                  )}
                  {isOverBudget && (
                    <p className="text-[11px] text-[#842e3b] font-medium pt-0.5">
                      Allocation exceeded by {currency.symbol}
                      {formatAmount(totalSpent - cat.budget)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#112217]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfcf9] rounded-lg shadow-xl border border-[#e5dfd4] max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5dfd4] bg-[#f7f4ed]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#b58c49]" />
                <h3 className="text-base font-serif font-bold text-[#1b3829]">
                  {editingCategory ? 'Modify Category' : 'Create Ledger Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#8c7e6c] hover:text-[#1b3829] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded bg-[#fdf0f2] border border-[#f3ccd1] text-xs text-[#842e3b] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#842e3b]" />
                <span>{typeof formError === 'object' ? JSON.stringify(formError) : String(formError ?? '')}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Category Title <span className="text-[#842e3b]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel, Investments, Dining, Books"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#d6cec0] rounded focus:outline-none focus:border-[#1b3829] font-sans"
                />
              </div>

              {/* Color Selection with Heritage Palette */}
              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-2">
                  Heritage Shade (for graphs and markers)
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {HERITAGE_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform border border-black/10 ${
                        color === c ? 'scale-110 ring-2 ring-[#1b3829] ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-[#d6cec0] p-0.5 bg-white"
                    title="Custom hex color"
                  />
                </div>
              </div>

              {/* Monthly Allocation */}
              <div>
                <label className="block text-xs font-semibold text-[#2c261e] mb-1">
                  Monthly Budget Allocation ({currency.symbol}){' '}
                  <span className="text-[#8c7e6c] font-normal">(0 = no cap)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8c7e6c] text-xs font-mono font-semibold">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-[#d6cec0] rounded font-mono tabular-nums focus:outline-none focus:border-[#1b3829]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5dfd4]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-medium text-[#54483a] bg-[#f4efe6] hover:bg-[#ebe4d8] rounded transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-[#fdfcf9] bg-[#1b3829] hover:bg-[#142a1e] rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Recording...' : editingCategory ? 'Update Account' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-[#112217]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fdfcf9] rounded-lg shadow-xl border border-[#e5dfd4] max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-[#1b3829]">
              Remove &quot;{deletingCategory.name}&quot;?
            </h3>

            {deleteError && (
              <div className="p-3 bg-[#fdf0f2] text-[#842e3b] border border-[#f3ccd1] text-xs rounded">
                {typeof deleteError === 'object' ? JSON.stringify(deleteError) : String(deleteError ?? '')}
              </div>
            )}

            {(() => {
              const breakdown = categoryBreakdown.find((b) => b.category === deletingCategory.name);
              const count = breakdown?.count || 0;
              const otherCategories = categories.filter((c) => c.id !== deletingCategory.id);

              return (
                <div className="space-y-3 text-xs">
                  {count > 0 ? (
                    <div className="p-3.5 bg-[#fbf6ea] border border-[#e8d8b5] rounded text-[#6b4e18] space-y-2">
                      <p className="font-semibold">
                        This category has {count} recorded expense entries.
                      </p>
                      <p>
                        To ensure your ledger remains balanced, specify a replacement account for these records:
                      </p>
                      <select
                        value={reassignTarget}
                        onChange={(e) => setReassignTarget(e.target.value)}
                        className="w-full p-2 bg-white border border-[#d6cec0] rounded font-medium text-[#1b3829] focus:outline-none"
                      >
                        {otherCategories.map((c) => (
                          <option key={c.id} value={c.name}>
                            Reassign to: {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-[#54483a]">
                      No recorded expenses are assigned to this category. It will be permanently removed from your ledger.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-[#54483a] bg-[#f4efe6] hover:bg-[#ebe4d8] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#842e3b] hover:bg-[#68242f] rounded transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
