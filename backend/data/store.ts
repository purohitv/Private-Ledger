import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { queryPostgres, isPostgresActive } from '../config/postgres.ts';

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  category: string;
  description: string;
  paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Credit Card';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
  budget: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  monthlyIncome: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Muted Old Money heritage categories (British Forest, Warm Terracotta, Slate Navy, etc.)
const DEFAULT_CATEGORIES: Array<Omit<CategoryRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Food & Dining', color: '#8c533e', budget: 15000, icon: 'Utensils' },
  { name: 'Housing & Estate', color: '#1f3d2b', budget: 35000, icon: 'Home' },
  { name: 'Travel & Commute', color: '#374b5c', budget: 8000, icon: 'Car' },
  { name: 'Utilities & Bills', color: '#6d5c48', budget: 6000, icon: 'Zap' },
  { name: 'Leisure & Culture', color: '#6b2c37', budget: 10000, icon: 'Film' },
  { name: 'Health & Wellness', color: '#405a49', budget: 5000, icon: 'HeartPulse' },
  { name: 'Education & Literature', color: '#8f733b', budget: 6000, icon: 'GraduationCap' },
  { name: 'Tailoring & Shopping', color: '#524f4b', budget: 10000, icon: 'ShoppingBag' },
];

class DataStore {
  private memoryData: {
    monthlyIncome: number;
    categories: CategoryRecord[];
    expenses: ExpenseRecord[];
    users: UserRecord[];
  } = {
    monthlyIncome: 0,
    categories: [],
    expenses: [],
    users: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryData.monthlyIncome = parsed.monthlyIncome || 0;
        this.memoryData.categories = parsed.categories || [];
        this.memoryData.expenses = parsed.expenses || [];
        this.memoryData.users = parsed.users || [];

        if (this.memoryData.categories.length === 0 || this.memoryData.users.length === 0) {
          this.seedBlankDefaults();
        }
      } else {
        this.seedBlankDefaults();
      }
    } catch (e) {
      console.error('[DataStore] Error reading local db.json:', e);
      this.seedBlankDefaults();
    }
  }

  public seedBlankDefaults() {
    const nowStr = new Date().toISOString();
    this.memoryData.monthlyIncome = 75000;
    this.memoryData.categories = DEFAULT_CATEGORIES.map((c, i) => ({
      ...c,
      id: `cat_${Date.now()}_${i}`,
      createdAt: nowStr,
      updatedAt: nowStr,
    }));
    // Blank slate: 0 transactions initially
    this.memoryData.expenses = [];

    // Seed default user account (Sakshi Pawar)
    if (this.memoryData.users.length === 0) {
      this.memoryData.users = [
        {
          id: 'user_default_owner',
          name: 'Sakshi Pawar',
          email: 'sakshipawar@gmail.com',
          passwordHash: bcrypt.hashSync('password123', 10),
          monthlyIncome: 75000,
          currencyCode: 'INR',
          createdAt: nowStr,
          updatedAt: nowStr,
        },
      ];
    } else {
      const owner = this.memoryData.users.find((u) => u.email === 'sakshipawar@gmail.com');
      if (owner && (!owner.passwordHash || !owner.passwordHash.startsWith('$2'))) {
        owner.passwordHash = bcrypt.hashSync('password123', 10);
      }
    }
    this.saveToFile();
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error saving to db.json:', err);
    }
  }

  // Monthly Budget / Allocation
  public async getMonthlyIncome(): Promise<number> {
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>(
          'SELECT setting_value FROM system_settings WHERE setting_key = $1 LIMIT 1',
          ['monthly_income']
        );
        if (rows && rows.length > 0) {
          const val = parseFloat(rows[0].setting_value);
          if (!isNaN(val)) {
            this.memoryData.monthlyIncome = val;
            return val;
          }
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getMonthlyIncome notice:', err);
      }
    }
    return this.memoryData.monthlyIncome;
  }

  public async setMonthlyIncome(amount: number): Promise<number> {
    const validAmount = Math.max(0, Number(amount) || 0);
    this.memoryData.monthlyIncome = validAmount;
    this.saveToFile();

    if (isPostgresActive()) {
      try {
        await queryPostgres(
          `INSERT INTO system_settings (setting_key, setting_value)
           VALUES ($1, $2)
           ON CONFLICT (setting_key)
           DO UPDATE SET setting_value = EXCLUDED.setting_value`,
          ['monthly_income', String(validAmount)]
        );
      } catch (err) {
        console.warn('[DataStore] PostgreSQL setMonthlyIncome notice:', err);
      }
    }

    return validAmount;
  }

  // CATEGORIES
  public async getCategories(): Promise<CategoryRecord[]> {
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>('SELECT * FROM categories ORDER BY created_at ASC');
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            budget: parseFloat(r.budget) || 0,
            icon: r.icon || 'Tag',
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getCategories fallback to local store:', err);
      }
    }
    return this.memoryData.categories;
  }

  public async getCategoryById(id: string): Promise<CategoryRecord | null> {
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>('SELECT * FROM categories WHERE id = $1 LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            color: r.color,
            budget: parseFloat(r.budget) || 0,
            icon: r.icon || 'Tag',
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getCategoryById error:', err);
      }
    }
    return this.memoryData.categories.find((c) => c.id === id) || null;
  }

  public async createCategory(data: { name: string; color?: string; budget?: number; icon?: string }): Promise<CategoryRecord> {
    const nowStr = new Date().toISOString();
    const id = `cat_${Date.now()}`;
    const newCat: CategoryRecord = {
      id,
      name: data.name.trim(),
      color: data.color || '#1f3d2b',
      budget: Number(data.budget) || 0,
      icon: data.icon || 'Tag',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (isPostgresActive()) {
      try {
        await queryPostgres(
          'INSERT INTO categories (id, name, color, budget, icon) VALUES ($1, $2, $3, $4, $5)',
          [newCat.id, newCat.name, newCat.color, newCat.budget, newCat.icon]
        );
      } catch (err) {
        console.warn('[DataStore] PostgreSQL createCategory error, fallback to local store:', err);
      }
    }

    this.memoryData.categories.push(newCat);
    this.saveToFile();
    return newCat;
  }

  public async updateCategory(
    id: string,
    data: { name?: string; color?: string; budget?: number; icon?: string }
  ): Promise<CategoryRecord | null> {
    const nowStr = new Date().toISOString();
    let updated: CategoryRecord | null = null;

    const idx = this.memoryData.categories.findIndex((c) => c.id === id);
    let oldName = '';
    if (idx !== -1) {
      oldName = this.memoryData.categories[idx].name;
      this.memoryData.categories[idx] = {
        ...this.memoryData.categories[idx],
        ...(data.name && { name: data.name.trim() }),
        ...(data.color && { color: data.color }),
        ...(data.budget !== undefined && { budget: Number(data.budget) }),
        ...(data.icon && { icon: data.icon }),
        updatedAt: nowStr,
      };
      updated = this.memoryData.categories[idx];

      if (data.name && data.name.trim() !== oldName) {
        const newName = data.name.trim();
        this.memoryData.expenses = this.memoryData.expenses.map((e) =>
          e.category === oldName ? { ...e, category: newName, updatedAt: nowStr } : e
        );
      }
    }

    if (isPostgresActive()) {
      try {
        const sets: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        if (data.name) {
          sets.push(`name = $${pIdx++}`);
          params.push(data.name.trim());
        }
        if (data.color) {
          sets.push(`color = $${pIdx++}`);
          params.push(data.color);
        }
        if (data.budget !== undefined) {
          sets.push(`budget = $${pIdx++}`);
          params.push(Number(data.budget));
        }
        if (data.icon) {
          sets.push(`icon = $${pIdx++}`);
          params.push(data.icon);
        }

        if (sets.length > 0) {
          params.push(id);
          await queryPostgres(`UPDATE categories SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${pIdx}`, params);
        }

        if (data.name && oldName && data.name.trim() !== oldName) {
          await queryPostgres('UPDATE expenses SET category = $1 WHERE category = $2', [data.name.trim(), oldName]);
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL updateCategory error:', err);
      }
    }

    this.saveToFile();
    return updated;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const initLen = this.memoryData.categories.length;
    this.memoryData.categories = this.memoryData.categories.filter((c) => c.id !== id);
    this.saveToFile();

    if (isPostgresActive()) {
      try {
        await queryPostgres('DELETE FROM categories WHERE id = $1', [id]);
      } catch (err) {
        console.warn('[DataStore] PostgreSQL deleteCategory error:', err);
      }
    }

    return this.memoryData.categories.length < initLen;
  }

  // EXPENSES
  public async getExpenses(filter?: {
    search?: string;
    category?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    month?: string; // YYYY-MM
  }): Promise<ExpenseRecord[]> {
    if (isPostgresActive()) {
      try {
        let sql = 'SELECT * FROM expenses WHERE 1=1';
        const params: any[] = [];
        let pIdx = 1;

        if (filter?.category && filter.category !== 'all') {
          sql += ` AND category = $${pIdx++}`;
          params.push(filter.category);
        }
        if (filter?.paymentMethod && filter.paymentMethod !== 'all') {
          sql += ` AND payment_method = $${pIdx++}`;
          params.push(filter.paymentMethod);
        }
        if (filter?.search) {
          sql += ` AND (LOWER(title) LIKE $${pIdx} OR LOWER(description) LIKE $${pIdx})`;
          params.push(`%${filter.search.toLowerCase()}%`);
          pIdx++;
        }
        if (filter?.month) {
          sql += ` AND to_char(date, 'YYYY-MM') = $${pIdx++}`;
          params.push(filter.month);
        }
        if (filter?.startDate) {
          sql += ` AND date >= $${pIdx++}`;
          params.push(filter.startDate);
        }
        if (filter?.endDate) {
          sql += ` AND date <= $${pIdx++}`;
          params.push(filter.endDate);
        }

        sql += ' ORDER BY date DESC, created_at DESC';

        const rows = await queryPostgres<any>(sql, params);
        if (rows) {
          return rows.map((r) => {
            const rawDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
            return {
              id: r.id,
              title: r.title,
              amount: parseFloat(r.amount) || 0,
              date: rawDate,
              category: r.category,
              description: r.description || '',
              paymentMethod: r.payment_method || 'UPI',
              createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
              updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getExpenses fallback to local:', err);
      }
    }

    let list = [...this.memoryData.expenses];

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))
      );
    }
    if (filter?.category && filter.category !== 'all') {
      list = list.filter((e) => e.category === filter.category);
    }
    if (filter?.paymentMethod && filter.paymentMethod !== 'all') {
      list = list.filter((e) => e.paymentMethod === filter.paymentMethod);
    }
    if (filter?.month) {
      list = list.filter((e) => e.date.startsWith(filter.month!));
    }
    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter((e) => new Date(e.date).getTime() >= start);
    }
    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime();
      list = list.filter((e) => new Date(e.date).getTime() <= end);
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public async getExpenseById(id: string): Promise<ExpenseRecord | null> {
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>('SELECT * FROM expenses WHERE id = $1 LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          const rawDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
          return {
            id: r.id,
            title: r.title,
            amount: parseFloat(r.amount) || 0,
            date: rawDate,
            category: r.category,
            description: r.description || '',
            paymentMethod: r.payment_method || 'UPI',
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getExpenseById error:', err);
      }
    }
    return this.memoryData.expenses.find((e) => e.id === id) || null;
  }

  public async createExpense(data: {
    title: string;
    amount: number;
    date: string;
    category: string;
    description?: string;
    paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Credit Card';
  }): Promise<ExpenseRecord> {
    const nowStr = new Date().toISOString();
    const id = `exp_${Date.now()}`;
    const rawDate = data.date ? data.date.split('T')[0] : nowStr.split('T')[0];
    const paymentMethodVal = data.paymentMethod || 'UPI';

    const newExp: ExpenseRecord = {
      id,
      title: data.title.trim(),
      amount: Number(data.amount),
      date: rawDate,
      category: data.category.trim(),
      description: data.description?.trim() || '',
      paymentMethod: paymentMethodVal,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (isPostgresActive()) {
      try {
        await queryPostgres(
          'INSERT INTO expenses (id, title, amount, date, category, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [newExp.id, newExp.title, newExp.amount, newExp.date, newExp.category, newExp.description, newExp.paymentMethod]
        );
      } catch (err) {
        console.warn('[DataStore] PostgreSQL createExpense error, fallback to local store:', err);
      }
    }

    this.memoryData.expenses.unshift(newExp);
    this.saveToFile();
    return newExp;
  }

  public async updateExpense(
    id: string,
    data: {
      title?: string;
      amount?: number;
      date?: string;
      category?: string;
      description?: string;
      paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Credit Card';
    }
  ): Promise<ExpenseRecord | null> {
    const nowStr = new Date().toISOString();
    let updated: ExpenseRecord | null = null;

    const idx = this.memoryData.expenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const rawDate = data.date ? data.date.split('T')[0] : this.memoryData.expenses[idx].date;
      this.memoryData.expenses[idx] = {
        ...this.memoryData.expenses[idx],
        ...(data.title && { title: data.title.trim() }),
        ...(data.amount !== undefined && { amount: Number(data.amount) }),
        ...(data.date && { date: rawDate }),
        ...(data.category && { category: data.category.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        updatedAt: nowStr,
      };
      updated = this.memoryData.expenses[idx];
    }

    if (isPostgresActive()) {
      try {
        const sets: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        if (data.title) {
          sets.push(`title = $${pIdx++}`);
          params.push(data.title.trim());
        }
        if (data.amount !== undefined) {
          sets.push(`amount = $${pIdx++}`);
          params.push(Number(data.amount));
        }
        if (data.date) {
          sets.push(`date = $${pIdx++}`);
          params.push(data.date.split('T')[0]);
        }
        if (data.category) {
          sets.push(`category = $${pIdx++}`);
          params.push(data.category.trim());
        }
        if (data.description !== undefined) {
          sets.push(`description = $${pIdx++}`);
          params.push(data.description.trim());
        }
        if (data.paymentMethod) {
          sets.push(`payment_method = $${pIdx++}`);
          params.push(data.paymentMethod);
        }

        if (sets.length > 0) {
          params.push(id);
          await queryPostgres(`UPDATE expenses SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${pIdx}`, params);
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL updateExpense error:', err);
      }
    }

    this.saveToFile();
    return updated;
  }

  public async deleteExpense(id: string): Promise<boolean> {
    const initLen = this.memoryData.expenses.length;
    this.memoryData.expenses = this.memoryData.expenses.filter((e) => e.id !== id);
    this.saveToFile();

    if (isPostgresActive()) {
      try {
        await queryPostgres('DELETE FROM expenses WHERE id = $1', [id]);
      } catch (err) {
        console.warn('[DataStore] PostgreSQL deleteExpense error:', err);
      }
    }

    return this.memoryData.expenses.length < initLen;
  }

  public async clearAllExpenses(): Promise<{ deletedCount: number }> {
    let deletedCount = this.memoryData.expenses.length;

    if (isPostgresActive()) {
      try {
        await queryPostgres('DELETE FROM expenses');
      } catch (err) {
        console.warn('[DataStore] PostgreSQL clearAllExpenses error:', err);
      }
    }

    this.memoryData.expenses = [];
    this.saveToFile();
    return { deletedCount };
  }

  public async syncToPostgres(): Promise<{ syncedCategories: number; syncedExpenses: number }> {
    if (!isPostgresActive()) {
      throw new Error('PostgreSQL server is not connected');
    }

    let syncedCategories = 0;
    let syncedExpenses = 0;

    for (const cat of this.memoryData.categories) {
      await queryPostgres(
        `INSERT INTO categories (id, name, color, budget, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.name, cat.color, cat.budget, cat.icon || 'Tag']
      );
      syncedCategories++;
    }

    for (const exp of this.memoryData.expenses) {
      await queryPostgres(
        `INSERT INTO expenses (id, title, amount, date, category, description, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [exp.id, exp.title, exp.amount, exp.date.split('T')[0], exp.category, exp.description || '', exp.paymentMethod || 'UPI']
      );
      syncedExpenses++;
    }

    if (this.memoryData.monthlyIncome > 0) {
      await queryPostgres(
        `INSERT INTO system_settings (setting_key, setting_value)
         VALUES ($1, $2)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value`,
        ['monthly_income', String(this.memoryData.monthlyIncome)]
      );
    }

    return { syncedCategories, syncedExpenses };
  }

  // Summary aggregation
  public async getSummary() {
    const expenses = await this.getExpenses();
    const categories = await this.getCategories();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let totalExpenses = 0;
    let currentMonthTotal = 0;
    let prevMonthTotal = 0;
    let highestExpense = { title: 'None', amount: 0, category: '—' };

    // Category breakdown map (all-time)
    const categoryMap: Record<string, { total: number; count: number }> = {};
    // Current month category breakdown map for monthly budget utilization
    const currentMonthCategoryMap: Record<string, { total: number; count: number }> = {};
    for (const c of categories) {
      categoryMap[c.name] = { total: 0, count: 0 };
      currentMonthCategoryMap[c.name] = { total: 0, count: 0 };
    }

    // Heritage Old Money payment method palette (non-neon)
    const paymentMap: Record<string, { total: number; count: number; color: string }> = {
      UPI: { total: 0, count: 0, color: '#1f3d2b' }, // Forest Green
      Cash: { total: 0, count: 0, color: '#6d5c48' }, // Antique Bronze
      'Bank Transfer': { total: 0, count: 0, color: '#374b5c' }, // Slate Navy
      'Debit Card': { total: 0, count: 0, color: '#8f733b' }, // Aged Gold
      'Credit Card': { total: 0, count: 0, color: '#6b2c37' }, // Deep Burgundy
    };

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalExpenses += amt;

      if (amt > highestExpense.amount) {
        highestExpense = { title: exp.title, amount: amt, category: exp.category };
      }

      if (exp.date.startsWith(currentMonthPrefix)) {
        currentMonthTotal += amt;
        if (!currentMonthCategoryMap[exp.category]) {
          currentMonthCategoryMap[exp.category] = { total: 0, count: 0 };
        }
        currentMonthCategoryMap[exp.category].total += amt;
        currentMonthCategoryMap[exp.category].count += 1;
      } else if (exp.date.startsWith(prevMonthPrefix)) {
        prevMonthTotal += amt;
      }

      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { total: 0, count: 0 };
      }
      categoryMap[exp.category].total += amt;
      categoryMap[exp.category].count += 1;

      const method = exp.paymentMethod || 'UPI';
      if (!paymentMap[method]) {
        paymentMap[method] = { total: 0, count: 0, color: '#524f4b' };
      }
      paymentMap[method].total += amt;
      paymentMap[method].count += 1;
    }

    const categoryBreakdown = Object.keys(categoryMap)
      .map((catName) => {
        const matchedCat = categories.find((c) => c.name === catName);
        const data = categoryMap[catName];
        const percentage = totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0;
        return {
          category: catName,
          total: Math.round(data.total * 100) / 100,
          count: data.count,
          percentage: Math.round(percentage * 10) / 10,
          budget: matchedCat?.budget || 0,
          color: matchedCat?.color || '#524f4b',
          icon: matchedCat?.icon || 'Tag',
        };
      })
      .sort((a, b) => b.total - a.total);

    const paymentMethodBreakdown = Object.keys(paymentMap)
      .map((m) => {
        const item = paymentMap[m];
        const percentage = totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 1000) / 10 : 0;
        return {
          method: m as any,
          total: Math.round(item.total * 100) / 100,
          count: item.count,
          percentage,
          color: item.color,
        };
      })
      .filter((m) => m.count > 0 || totalExpenses === 0)
      .sort((a, b) => b.total - a.total);

    const budgetComparison = categories.map((cat) => {
      const spent = currentMonthCategoryMap[cat.name]?.total || 0;
      const budget = cat.budget || 0;
      const remaining = budget > 0 ? budget - spent : 0;
      const isOver = budget > 0 && spent > budget;
      const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      return {
        category: cat.name,
        budget,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        isOver,
        percentUsed,
        color: cat.color || '#1f3d2b',
      };
    });

    const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
    const monthlyIncome = await this.getMonthlyIncome();
    const netSavings = Math.round((monthlyIncome - currentMonthTotal) * 100) / 100;
    const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

    const monthlyTrend: Array<{
      monthKey: string;
      label: string;
      shortLabel: string;
      total: number;
      count: number;
    }> = [];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const label = `${monthNames[m]} ${y}`;
      const shortLabel = `${monthNames[m].slice(0, 3)} '${String(y).slice(-2)}`;

      const monthExpenses = expenses.filter((e) => e.date.startsWith(key));
      const monthSum = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      monthlyTrend.push({
        monthKey: key,
        label,
        shortLabel,
        total: Math.round(monthSum * 100) / 100,
        count: monthExpenses.length,
      });
    }

    let monthlyChangePercent = 0;
    if (prevMonthTotal > 0) {
      monthlyChangePercent = Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 1000) / 10;
    }

    const currentDayOfMonth = Math.max(now.getDate(), 1);
    const averageDailyExpense = Math.round((currentMonthTotal / currentDayOfMonth) * 100) / 100;

    return {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalCount: expenses.length,
      monthlyIncome,
      netSavings,
      savingsRate,
      totalBudget,
      currentMonth: {
        key: currentMonthPrefix,
        label: `${monthNames[currentMonth]} ${currentYear}`,
        total: Math.round(currentMonthTotal * 100) / 100,
        changePercent: monthlyChangePercent,
        prevMonthTotal: Math.round(prevMonthTotal * 100) / 100,
        averageDaily: averageDailyExpense,
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      budgetComparison,
      monthlyTrend,
      recentExpenses: expenses.slice(0, 8),
      highestExpense,
    };
  }

  // USER AUTHENTICATION & PROFILES
  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            passwordHash: r.password_hash,
            monthlyIncome: parseFloat(r.monthly_income) || 50000,
            currencyCode: r.currency_code || 'INR',
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getUserByEmail fallback to local:', err);
      }
    }
    return this.memoryData.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  public async getUserById(id: string): Promise<UserRecord | null> {
    if (isPostgresActive()) {
      try {
        const rows = await queryPostgres<any>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            passwordHash: r.password_hash,
            monthlyIncome: parseFloat(r.monthly_income) || 50000,
            currencyCode: r.currency_code || 'INR',
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString(),
          };
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL getUserById fallback to local:', err);
      }
    }
    return this.memoryData.users.find((u) => u.id === id) || null;
  }

  public async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    monthlyIncome?: number;
    currencyCode?: string;
  }): Promise<UserRecord> {
    const nowStr = new Date().toISOString();
    const id = `user_${Date.now()}`;
    const cleanEmail = data.email.trim().toLowerCase();
    const newUser: UserRecord = {
      id,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      monthlyIncome: data.monthlyIncome !== undefined ? Number(data.monthlyIncome) : 50000,
      currencyCode: data.currencyCode || 'INR',
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (isPostgresActive()) {
      try {
        await queryPostgres(
          'INSERT INTO users (id, name, email, password_hash, monthly_income, currency_code) VALUES ($1, $2, $3, $4, $5, $6)',
          [newUser.id, newUser.name, newUser.email, newUser.passwordHash, newUser.monthlyIncome, newUser.currencyCode]
        );
      } catch (err) {
        console.warn('[DataStore] PostgreSQL createUser fallback to local:', err);
      }
    }

    this.memoryData.users.push(newUser);
    this.saveToFile();
    return newUser;
  }

  public async updateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
      monthlyIncome?: number;
      currencyCode?: string;
    }
  ): Promise<UserRecord | null> {
    const nowStr = new Date().toISOString();
    let updated: UserRecord | null = null;

    const idx = this.memoryData.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.memoryData.users[idx] = {
        ...this.memoryData.users[idx],
        ...(data.name && { name: data.name.trim() }),
        ...(data.email && { email: data.email.trim().toLowerCase() }),
        ...(data.passwordHash && { passwordHash: data.passwordHash }),
        ...(data.monthlyIncome !== undefined && { monthlyIncome: Number(data.monthlyIncome) }),
        ...(data.currencyCode && { currencyCode: data.currencyCode }),
        updatedAt: nowStr,
      };
      updated = this.memoryData.users[idx];
    }

    if (isPostgresActive()) {
      try {
        const sets: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        if (data.name) {
          sets.push(`name = $${pIdx++}`);
          params.push(data.name.trim());
        }
        if (data.email) {
          sets.push(`email = $${pIdx++}`);
          params.push(data.email.trim().toLowerCase());
        }
        if (data.passwordHash) {
          sets.push(`password_hash = $${pIdx++}`);
          params.push(data.passwordHash);
        }
        if (data.monthlyIncome !== undefined) {
          sets.push(`monthly_income = $${pIdx++}`);
          params.push(Number(data.monthlyIncome));
        }
        if (data.currencyCode) {
          sets.push(`currency_code = $${pIdx++}`);
          params.push(data.currencyCode);
        }

        if (sets.length > 0) {
          params.push(id);
          await queryPostgres(`UPDATE users SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${pIdx}`, params);
        }
      } catch (err) {
        console.warn('[DataStore] PostgreSQL updateUser fallback to local:', err);
      }
    }

    this.saveToFile();
    return updated;
  }
}

export const dataStore = new DataStore();
