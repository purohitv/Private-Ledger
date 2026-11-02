import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getPostgresStatus, connectPostgres, PostgresConfig } from '../config/postgres.ts';
import { dataStore } from '../data/store.ts';

export const getSystemStatus = async (_req: Request, res: Response) => {
  try {
    const postgresStatus = getPostgresStatus();
    const categories = await dataStore.getCategories();
    const expenses = await dataStore.getExpenses();

    res.json({
      success: true,
      appName: 'Private Ledger',
      projectType: 'Personal Expense & Asset Ledger',
      technologyStack: {
        frontend: 'React 19 + TypeScript + Vite + Tailwind CSS',
        charts: 'Chart.js 4 + react-chartjs-2',
        backend: 'Node.js + Express.js',
        database: 'PostgreSQL 14+ (with 100% offline local store fallback)',
      },
      postgres: postgresStatus,
      // For backwards compatibility
      database: {
        isConnected: postgresStatus.isConnected,
        connectionState: postgresStatus.connectionState,
        databaseName: postgresStatus.databaseName,
        host: postgresStatus.host,
        errorMessage: postgresStatus.errorMessage,
        lastChecked: postgresStatus.lastChecked,
      },
      stats: {
        totalExpensesCount: expenses.length,
        totalCategoriesCount: categories.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Server error fetching status' });
  }
};

export const configurePostgres = async (req: Request, res: Response) => {
  try {
    const { connectionString, host, port, user, password, database }: PostgresConfig = req.body;

    const result = await connectPostgres({
      connectionString: connectionString ? String(connectionString).trim() : undefined,
      host: host ? String(host).trim() : 'localhost',
      port: port ? Number(port) : 5432,
      user: user !== undefined ? String(user).trim() : 'postgres',
      password: password !== undefined ? String(password) : '',
      database: database ? String(database).trim() : 'expense_tracker',
    });

    const status = getPostgresStatus();

    if (result.success) {
      try {
        await dataStore.syncToPostgres();
      } catch (syncErr) {
        console.warn('[System] Auto-sync to PostgreSQL notice:', syncErr);
      }
    }

    res.json({
      success: result.success,
      message: result.message,
      postgres: status,
      database: {
        isConnected: status.isConnected,
        connectionState: status.connectionState,
        databaseName: status.databaseName,
        host: status.host,
        errorMessage: status.errorMessage,
        lastChecked: status.lastChecked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to configure PostgreSQL connection',
    });
  }
};

export const syncToPostgresDatabase = async (_req: Request, res: Response) => {
  try {
    const status = getPostgresStatus();
    if (!status.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Cannot sync: PostgreSQL is not currently connected. Local offline data store is currently serving all queries.',
      });
    }

    const result = await dataStore.syncToPostgres();
    res.json({
      success: true,
      message: `Synchronized ${result.syncedCategories} categories and ${result.syncedExpenses} expenses to PostgreSQL.`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Error synchronizing to PostgreSQL',
    });
  }
};

export const getSQLSchemaScript = async (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'backend', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.json({ success: true, sql });
    }
    res.json({ success: true, sql: '-- PostgreSQL Schema created automatically by application.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to read schema SQL' });
  }
};

export const resetData = async (_req: Request, res: Response) => {
  try {
    dataStore.seedBlankDefaults();
    if (getPostgresStatus().isConnected) {
      await dataStore.clearAllExpenses();
    }
    res.json({
      success: true,
      message: 'Ledger cleared to clean blank slate with default categories.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Error clearing ledger',
    });
  }
};

export const exportAllData = async (_req: Request, res: Response) => {
  try {
    const categories = await dataStore.getCategories();
    const expenses = await dataStore.getExpenses();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=private-ledger-backup.json');
    res.json({
      exportedAt: new Date().toISOString(),
      appName: 'Private Ledger',
      categories,
      expenses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Export failed' });
  }
};
