import { Expense, Category, ExpenseSummary, SystemStatus, PaymentMethod, UserProfile } from './types.ts';

const API_BASE = '/api';

// EXPENSES
export async function fetchExpenses(filter?: {
  search?: string;
  category?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
}): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filter?.search) params.append('search', filter.search);
  if (filter?.category && filter.category !== 'all') params.append('category', filter.category);
  if (filter?.paymentMethod && filter.paymentMethod !== 'all') params.append('paymentMethod', filter.paymentMethod);
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  if (filter?.month) params.append('month', filter.month);

  const url = `${API_BASE}/expenses${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch transactions');
  return json.data;
}

export async function fetchSummary(): Promise<ExpenseSummary> {
  const res = await fetch(`${API_BASE}/expenses/summary`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch summary calculations');
  return json.data;
}

export async function createExpense(data: {
  title: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  paymentMethod?: PaymentMethod;
}): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    const errorMsg = json.errors ? Object.values(json.errors).join(', ') : json.message;
    throw new Error(errorMsg || 'Failed to record transaction');
  }
  return json.data;
}

export async function updateExpense(
  id: string,
  data: {
    title?: string;
    amount?: number;
    date?: string;
    category?: string;
    description?: string;
    paymentMethod?: PaymentMethod;
  }
): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    const errorMsg = json.errors ? Object.values(json.errors).join(', ') : json.message;
    throw new Error(errorMsg || 'Failed to update transaction');
  }
  return json.data;
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to delete transaction');
}

export async function clearAllExpenses(): Promise<{ deletedCount: number; message: string }> {
  const res = await fetch(`${API_BASE}/expenses/clear-all`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to clear transactions');
  return json;
}

// Monthly Budget / Allocation
export async function fetchMonthlyIncome(): Promise<number> {
  const res = await fetch(`${API_BASE}/expenses/income`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch monthly allocation');
  return json.income;
}

export async function updateMonthlyIncome(income: number): Promise<number> {
  const res = await fetch(`${API_BASE}/expenses/income`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ income }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update monthly allocation');
  return json.income;
}

// CATEGORIES
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch categories');
  return json.data;
}

export async function createCategory(data: {
  name: string;
  color?: string;
  budget?: number;
  icon?: string;
}): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    const errorMsg = json.errors ? Object.values(json.errors).join(', ') : json.message;
    throw new Error(errorMsg || 'Failed to create category');
  }
  return json.data;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: string;
    budget?: number;
    icon?: string;
  }
): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    const errorMsg = json.errors ? Object.values(json.errors).join(', ') : json.message;
    throw new Error(errorMsg || 'Failed to update category');
  }
  return json.data;
}

export async function deleteCategory(id: string, reassignTo?: string): Promise<void> {
  const url = `${API_BASE}/categories/${id}${reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : ''}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to delete category');
}

// System & Data Management
export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system/status`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch system status');
  return json;
}

export async function resetDemoData(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/system/reset`, {
    method: 'POST',
  });
  return res.json();
}

export function exportLedgerBackup(): void {
  const link = document.createElement('a');
  link.href = `${API_BASE}/system/export`;
  link.download = `private_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// AUTHENTICATION & USER PROFILE
export function getAuthToken(): string | null {
  return localStorage.getItem('ledger_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('ledger_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('ledger_auth_token');
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to fetch user');
  if (json.token) setAuthToken(json.token);
  return json.user;
}

export async function loginUser(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Login failed');
  if (json.token) setAuthToken(json.token);
  return json;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  monthlyIncome?: number;
  currencyCode?: string;
}): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Registration failed');
  if (json.token) setAuthToken(json.token);
  return json;
}

export async function updateUserProfile(data: {
  name?: string;
  monthlyIncome?: number;
  currencyCode?: string;
}): Promise<UserProfile> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to update profile');
  return json.user;
}

export async function updateUserPassword(data: {
  currentPassword?: string;
  newPassword: string;
}): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to change password');
}

export async function logoutUser(): Promise<void> {
  clearAuthToken();
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
}
