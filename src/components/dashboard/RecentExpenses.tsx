import React from 'react';
import { ArrowRight, Edit2, Trash2, Receipt } from 'lucide-react';
import { Expense, Category, Currency } from '../../types.ts';

interface RecentExpensesProps {
  expenses: Expense[];
  categories: Category[];
  currency: Currency;
  onViewAll: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  expenses,
  categories,
  currency,
  onViewAll,
  onEditExpense,
  onDeleteExpense,
}) => {
  const getCategoryColor = (catName: string) => {
    const found = categories.find((c) => c.name === catName);
    return found?.color || '#524f4b';
  };

  const formatAmount = (num: any) => {
    const n = typeof num === 'number' ? num : parseFloat(num?.amount ?? num) || 0;
    if (currency.code === 'INR') {
      return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-[#ffffff] rounded-sm border border-[#e5dfd4] shadow-2xs overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-[#ece6db] bg-[#faf8f4] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#1c221e] font-serif tracking-wide">
            Recent Journal Entries
          </h3>
          <p className="text-xs text-[#736e67]">Chronological log of recent disbursements</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-[#1b3829] hover:text-[#12281d] font-serif transition-colors"
        >
          <span>View Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#7b766f] space-y-2">
            <Receipt className="w-8 h-8 text-[#c5bdaf] mx-auto mb-1 stroke-1" />
            <p className="font-serif text-sm font-semibold text-[#3d3a35]">No ledger transactions recorded yet</p>
            <p className="text-[11px] text-[#8c857b] max-w-sm mx-auto">
              Your ledger is completely blank and ready for real records. Click &quot;New Entry&quot; to log your first expenditure.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ece4]">
            {expenses.map((expense) => {
              const dateStr = expense.date
                ? new Date(expense.date).toLocaleDateString(currency.code === 'INR' ? 'en-IN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '';
              const catColor = getCategoryColor(expense.category);

              return (
                <div
                  key={expense.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#faf8f4] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1c221e] truncate font-serif">
                        {expense.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#716c65] mt-0.5">
                        <span>{expense.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-mono text-[10px]">{dateStr}</span>
                        <span aria-hidden="true">·</span>
                        <span className="px-1.5 py-0.2 bg-[#f4efe6] text-[#4d4841] border border-[#e4dcce] rounded-xs text-[10px] font-mono">
                          {expense.paymentMethod || 'UPI'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#1c221e] tabular-nums font-serif">
                        {currency.symbol}{formatAmount(expense.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditExpense(expense)}
                        className="p-1 text-[#79746d] hover:text-[#1b3829] hover:bg-[#f2ece2] rounded-xs transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-1 text-[#79746d] hover:text-[#6a252a] hover:bg-[#f9ecec] rounded-xs transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
