import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dataStore } from '../data/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'private_ledger_offline_dev_secret_key_2026';

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '30d' });
};

const getUserIdFromAuthHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.id || null;
  } catch (err) {
    return null;
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, monthlyIncome, currencyCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await dataStore.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await dataStore.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 50000,
      currencyCode: currencyCode || 'INR',
    });

    const token = generateToken(newUser.id, newUser.email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        monthlyIncome: newUser.monthlyIncome,
        currencyCode: newUser.currencyCode,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error creating account' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await dataStore.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or credentials' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        currencyCode: user.currencyCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error signing in' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuthHeader(req);
    let user = null;

    if (userId) {
      user = await dataStore.getUserById(userId);
    }

    // If no user found by token, fall back to default owner user so offline localhost is always ready
    if (!user) {
      user = await dataStore.getUserByEmail('sakshipawar@gmail.com');
    }

    if (!user) {
      // Create default if missing
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      user = await dataStore.createUser({
        name: 'Sakshi Pawar',
        email: 'sakshipawar@gmail.com',
        passwordHash,
        monthlyIncome: 75000,
        currencyCode: 'INR',
      });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        currencyCode: user.currencyCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error retrieving profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuthHeader(req) || 'user_default_owner';
    const { name, monthlyIncome, currencyCode } = req.body;

    const updated = await dataStore.updateUser(userId, {
      ...(name && { name: name.trim() }),
      ...(monthlyIncome !== undefined && { monthlyIncome: Number(monthlyIncome) }),
      ...(currencyCode && { currencyCode: String(currencyCode) }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sync monthly income to dataStore settings if updated
    if (monthlyIncome !== undefined) {
      await dataStore.setMonthlyIncome(Number(monthlyIncome));
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        monthlyIncome: updated.monthlyIncome,
        currencyCode: updated.currencyCode,
        createdAt: updated.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error updating profile' });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuthHeader(req) || 'user_default_owner';
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await dataStore.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dataStore.updateUser(userId, { passwordHash });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Error changing password' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Signed out successfully',
  });
};
