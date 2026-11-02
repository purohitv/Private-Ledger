import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Expense, Category, Currency, PaymentMethod, SUPPORTED_PAYMENT_METHODS } from '../../types.ts';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
  expenseToEdit?: Expense | null;
  categories: Category[];
  currency: Currency;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  categories,
  currency,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setDate(expenseToEdit.date ? expenseToEdit.date.split('T')[0] : '');
      setCategory(expenseToEdit.category);
      setDescription(expenseToEdit.description || '');
      setPaymentMethod(expenseToEdit.paymentMethod || 'UPI');
    } else {
      setTitle('');
      setAmount('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setCategory(categories[0]?.name || '');
      setDescription('');
      setPaymentMethod('UPI');
    }
    setErrors({});
    setServerError(null);
  }, [expenseToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Payee or title is required';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    if (!category.trim()) {
      newErrors.category = 'Please assign an allocation category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setServerError(null);
      await onSubmit({
        title: title.trim(),
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        category: category.trim(),
        description: description.trim(),
        paymentMethod,
      });
      onClose();
    } catch (err: any) {
      setServerError(err?.message || 'Failed to record entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#101b14]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#ffffff] rounded-sm shadow-xl border border-[#d8d1c4] max-w-lg w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5dfd4] bg-[#faf8f4]">
          <div>
            <h2 className="text-base font-bold text-[#1c221e] font-serif tracking-wide">
              {expenseToEdit ? 'Amend Ledger Entry' : 'Record New Entry'}
            </h2>
            <p className="text-xs text-[#736e67]">
              {expenseToEdit
                ? 'Update transaction record in your private ledger'
                : 'Enter disbursement details and allocation category'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#736e67] hover:text-[#1c221e] rounded-xs hover:bg-[#efe9de] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Notice */}
        {serverError && (
          <div className="mx-6 mt-4 p-3 rounded-xs bg-[#faeded] border border-[#e8c1c4] text-xs text-[#6d252a] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#6d252a]" />
            <span>{typeof serverError === 'object' ? JSON.stringify(serverError) : String(serverError ?? '')}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Expense Name */}
          <div>
            <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
              Payee / Title <span className="text-[#8c2a32]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fortnum &amp; Mason, Harrods, Monthly Estate Dues, Dining"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full px-3 py-2 text-sm bg-[#faf8f4] border rounded-xs focus:outline-none focus:ring-1 ${
                errors.title
                  ? 'border-[#a8323c] focus:ring-[#a8323c]'
                  : 'border-[#d8d1c4] focus:ring-[#1b3829] focus:border-[#1b3829]'
              }`}
            />
            {errors.title && <p className="text-xs text-[#8c2a32] mt-1">{errors.title}</p>}
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
                Amount ({currency.symbol}) <span className="text-[#8c2a32]">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#736e67] text-xs font-semibold">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full pl-8 pr-3 py-2 text-sm bg-[#faf8f4] border rounded-xs tabular-nums focus:outline-none focus:ring-1 ${
                    errors.amount
                      ? 'border-[#a8323c] focus:ring-[#a8323c]'
                      : 'border-[#d8d1c4] focus:ring-[#1b3829] focus:border-[#1b3829]'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-[#8c2a32] mt-1">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
                Date <span className="text-[#8c2a32]">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full px-3 py-2 text-sm bg-[#faf8f4] border rounded-xs focus:outline-none focus:ring-1 ${
                  errors.date
                    ? 'border-[#a8323c] focus:ring-[#a8323c]'
                    : 'border-[#d8d1c4] focus:ring-[#1b3829] focus:border-[#1b3829]'
                }`}
              />
              {errors.date && <p className="text-xs text-[#8c2a32] mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
                Category <span className="text-[#8c2a32]">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  className={`w-full px-3 py-2 text-sm bg-[#faf8f4] border rounded-xs focus:outline-none focus:ring-1 appearance-none ${
                    errors.category
                      ? 'border-[#a8323c] focus:ring-[#a8323c]'
                      : 'border-[#d8d1c4] focus:ring-[#1b3829] focus:border-[#1b3829]'
                  }`}
                >
                  <option value="" disabled>
                    Select an allocation
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#736e67] text-xs">
                  ▼
                </div>
              </div>
              {errors.category && <p className="text-xs text-[#8c2a32] mt-1">{errors.category}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
                Payment Instrument
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] focus:border-[#1b3829] appearance-none font-medium text-[#2c332e]"
                >
                  {SUPPORTED_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#736e67] text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#2c332e] mb-1 font-serif tracking-wide">
              Reference Notes <span className="text-[#8c857b] font-normal font-sans">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add journal notes, voucher reference, or invoice details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#faf8f4] border border-[#d8d1c4] rounded-xs focus:outline-none focus:ring-1 focus:ring-[#1b3829] focus:border-[#1b3829]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5dfd4]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#5a554e] bg-[#f4efe6] hover:bg-[#e9e3d7] rounded-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-[#f7f4ed] bg-[#1a3828] hover:bg-[#132c1f] rounded-xs shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 tracking-wide font-serif"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{expenseToEdit ? 'Save Changes' : 'Confirm Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
