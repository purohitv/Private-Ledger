import { Request, Response } from 'express';
import { dataStore } from '../data/store.ts';

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { search, category, paymentMethod, startDate, endDate, month } = req.query;
    const expenses = await dataStore.getExpenses({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      paymentMethod: typeof paymentMethod === 'string' ? paymentMethod : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      month: typeof month === 'string' ? month : undefined,
    });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error fetching expenses' });
  }
};

export const getExpenseSummary = async (_req: Request, res: Response) => {
  try {
    const summary = await dataStore.getSummary();
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error calculating expense summary' });
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const expense = await dataStore.getExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error fetching expense' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { title, amount, date, category, description, paymentMethod } = req.body;

    const errors: Record<string, string> = {};
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Title / Payee is required';
    } else if (title.trim().length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    const numAmount = Number(amount);
    if (amount === undefined || amount === null || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Amount must be a positive number greater than 0';
    }

    if (!date) {
      errors.date = 'Date is required';
    } else {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        errors.date = 'Invalid date provided';
      }
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.category = 'Category is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const validPaymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Debit Card', 'Credit Card'];
    const chosenMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'UPI';

    const newExpense = await dataStore.createExpense({
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      date: new Date(date).toISOString(),
      category: category.trim(),
      description: description ? String(description).trim() : '',
      paymentMethod: chosenMethod,
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: newExpense,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error creating expense' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, amount, date, category, description, paymentMethod } = req.body;

    const existing = await dataStore.getExpenseById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const errors: Record<string, string> = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        errors.title = 'Title cannot be empty';
      } else if (title.trim().length > 100) {
        errors.title = 'Title must be 100 characters or less';
      }
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        errors.amount = 'Amount must be greater than 0';
      }
    }

    if (date !== undefined) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        errors.date = 'Invalid date provided';
      }
    }

    if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
      errors.category = 'Category cannot be empty';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const validPaymentMethods = ['UPI', 'Cash', 'Bank Transfer', 'Debit Card', 'Credit Card'];
    const validMethod = paymentMethod && validPaymentMethods.includes(paymentMethod) ? paymentMethod : undefined;

    const updated = await dataStore.updateExpense(id, {
      ...(title !== undefined && { title: title.trim() }),
      ...(amount !== undefined && { amount: Math.round(Number(amount) * 100) / 100 }),
      ...(date !== undefined && { date: new Date(date).toISOString() }),
      ...(category !== undefined && { category: category.trim() }),
      ...(description !== undefined && { description: String(description).trim() }),
      ...(validMethod && { paymentMethod: validMethod }),
    });

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error updating expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dataStore.deleteExpense(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found or already deleted' });
    }
    res.json({ success: true, message: 'Transaction removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error deleting expense' });
  }
};

export const clearAllExpenses = async (_req: Request, res: Response) => {
  try {
    const result = await dataStore.clearAllExpenses();
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} transaction records. Categories & allocations remain preserved.`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Server error clearing expenses',
    });
  }
};

// Monthly Budget / Allocation
export const getMonthlyIncome = async (_req: Request, res: Response) => {
  try {
    const income = await dataStore.getMonthlyIncome();
    res.json({ success: true, income: Number(income) || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Error fetching monthly budget' });
  }
};

export const setMonthlyIncome = async (req: Request, res: Response) => {
  try {
    const { income } = req.body;
    const num = Number(income);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ success: false, message: 'Budget must be a non-negative number' });
    }
    const updated = await dataStore.setMonthlyIncome(num);
    res.json({ success: true, message: 'Monthly budget updated successfully', income: Number(updated) || 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Error setting monthly budget' });
  }
};
