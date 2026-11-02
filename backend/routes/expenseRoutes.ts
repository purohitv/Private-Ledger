import { Router } from 'express';
import {
  getExpenses,
  getExpenseSummary,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  clearAllExpenses,
  getMonthlyIncome,
  setMonthlyIncome,
} from '../controllers/expenseController.ts';

const router = Router();

// Summary & Aggregations
router.get('/summary', getExpenseSummary);

// Monthly Income / Allocation
router.get('/income', getMonthlyIncome);
router.post('/income', setMonthlyIncome);

// Clear All
router.delete('/clear-all', clearAllExpenses);

// Standard CRUD
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
