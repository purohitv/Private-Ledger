export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Credit Card';

export const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
];

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number;
  currencyCode: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  _id?: string;
  title: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  category: string;
  description: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  color: string;
  budget: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
  budget: number;
  color: string;
  icon: string;
}

export interface PaymentMethodBreakdownItem {
  method: PaymentMethod;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface BudgetComparisonItem {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  isOver: boolean;
  percentUsed: number;
  color: string;
}

export interface MonthlyTrendItem {
  monthKey: string;
  label: string;
  shortLabel: string;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalCount: number;
  monthlyIncome: number;
  netSavings: number;
  savingsRate: number;
  totalBudget: number;
  currentMonth: {
    key: string;
    label: string;
    total: number;
    changePercent: number;
    prevMonthTotal: number;
    averageDaily: number;
  };
  categoryBreakdown: CategoryBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  budgetComparison: BudgetComparisonItem[];
  monthlyTrend: MonthlyTrendItem[];
  recentExpenses: Expense[];
  highestExpense: {
    title: string;
    amount: number;
    category: string;
  };
}

export interface PostgresStatus {
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected' | 'local_fallback';
  databaseName?: string;
  host?: string;
  port?: number;
  user?: string;
  errorMessage?: string;
  lastChecked: string;
}

export interface SystemStatus {
  appName: string;
  projectType: string;
  technologyStack: {
    frontend: string;
    charts: string;
    backend: string;
    database: string;
  };
  postgres?: PostgresStatus;
  database: {
    isConnected: boolean;
    connectionState: 'connected' | 'connecting' | 'disconnected' | 'local_fallback';
    databaseName?: string;
    host?: string;
    port?: number;
    user?: string;
    uriMasked?: string;
    errorMessage?: string;
    lastChecked: string;
  };
  stats: {
    totalExpensesCount: number;
    totalCategoriesCount: number;
  };
}

export type Currency = {
  symbol: string;
  code: string;
  label: string;
};

export const SUPPORTED_CURRENCIES: Currency[] = [
  { symbol: '₹', code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { symbol: '$', code: 'USD', label: 'USD ($) - US Dollar' },
  { symbol: '€', code: 'EUR', label: 'EUR (€) - Euro' },
  { symbol: '£', code: 'GBP', label: 'GBP (£) - British Pound' },
];
