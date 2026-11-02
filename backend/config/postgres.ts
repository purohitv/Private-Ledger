import pg from 'pg';
const { Pool } = pg;

export interface PostgresConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
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

let pool: pg.Pool | null = null;
let isConnected = false;
let isConnecting = false;
let lastError: string | null = null;

let currentConfig: PostgresConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  host: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.PGPORT || process.env.POSTGRES_PORT) || 5432,
  user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '',
  database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'expense_tracker',
};

export const getPostgresStatus = (): PostgresStatus => {
  let connectionState: PostgresStatus['connectionState'] = 'disconnected';
  if (isConnected) {
    connectionState = 'connected';
  } else if (isConnecting) {
    connectionState = 'connecting';
  } else {
    connectionState = 'local_fallback';
  }

  return {
    isConnected,
    connectionState,
    databaseName: currentConfig.database || 'expense_tracker',
    host: currentConfig.host || 'localhost',
    port: currentConfig.port || 5432,
    user: currentConfig.user || 'postgres',
    errorMessage: lastError || undefined,
    lastChecked: new Date().toISOString(),
  };
};

/**
 * Initializes PostgreSQL tables with proper data types and indexes
 */
const initializeTables = async (dbPool: pg.Pool) => {
  const client = await dbPool.connect();
  try {
    // 1. Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(20) NOT NULL DEFAULT '#1f3d2b',
        budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        icon VARCHAR(50) DEFAULT 'Tag',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        date DATE NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        payment_method VARCHAR(50) DEFAULT 'UPI',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
    `);

    // 3. System settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL
      );
    `);

    // 4. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
        currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
  } finally {
    client.release();
  }
};

/**
 * Connect to PostgreSQL instance
 */
export const connectPostgres = async (
  newConfig?: PostgresConfig
): Promise<{ success: boolean; message: string }> => {
  if (newConfig) {
    currentConfig = {
      ...currentConfig,
      ...newConfig,
    };
  }

  isConnecting = true;
  lastError = null;

  try {
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    const poolConfig: pg.PoolConfig = currentConfig.connectionString
      ? {
          connectionString: currentConfig.connectionString,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 10000,
        }
      : {
          host: currentConfig.host,
          port: currentConfig.port,
          user: currentConfig.user,
          password: currentConfig.password,
          database: currentConfig.database,
          connectionTimeoutMillis: 3000,
          idleTimeoutMillis: 10000,
        };

    const newPool = new Pool(poolConfig);

    // Test connection with a fast probe query
    const client = await newPool.connect();
    await client.query('SELECT 1');
    client.release();

    // Connected! Initialize schemas
    pool = newPool;
    await initializeTables(pool);

    isConnected = true;
    console.log(`[PostgreSQL] Successfully connected to PostgreSQL database "${currentConfig.database || 'expense_tracker'}"`);
    return {
      success: true,
      message: `Connected successfully to PostgreSQL database "${currentConfig.database || 'expense_tracker'}"`,
    };
  } catch (error: any) {
    isConnected = false;
    lastError = error?.message || 'Failed to connect to PostgreSQL server';
    console.info(
      `[PostgreSQL] Notice: PostgreSQL not active on localhost:5432 (${lastError}). Seamlessly running in zero-config offline mode.`
    );
    return {
      success: false,
      message: `PostgreSQL not connected (${lastError}). Offline engine is active.`,
    };
  } finally {
    isConnecting = false;
  }
};

/**
 * Execute a query on PostgreSQL
 */
export const queryPostgres = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  if (!pool || !isConnected) {
    throw new Error('PostgreSQL is not connected');
  }
  const result = await pool.query(sql, params);
  return result.rows as T[];
};

export const isPostgresActive = (): boolean => isConnected;
