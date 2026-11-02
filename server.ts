import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectPostgres } from './backend/config/postgres.ts';
import expenseRoutes from './backend/routes/expenseRoutes.ts';
import categoryRoutes from './backend/routes/categoryRoutes.ts';
import systemRoutes from './backend/routes/systemRoutes.ts';
import authRoutes from './backend/routes/authRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Security hardening
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Body parsing middleware
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Initialize PostgreSQL connection (falls back cleanly to 100% offline local store if PostgreSQL is not running on localhost)
  connectPostgres().catch((err) => {
    console.info('[Server] PostgreSQL initial probe:', err?.message || err);
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/system', systemRoutes);

  // Health check route
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Private Ledger with PostgreSQL & Zero-Config Offline Storage API',
    });
  });

  // Serve frontend
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In development, mount Vite's dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Private Ledger Server running on port ${PORT}`);
    console.log(`[Server] API endpoints mounted at http://localhost:${PORT}/api/expenses`);
  });
}

startServer().catch((error) => {
  console.error('[Server] Fatal server startup error:', error);
  process.exit(1);
});
