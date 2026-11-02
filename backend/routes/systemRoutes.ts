import { Router } from 'express';
import {
  getSystemStatus,
  configurePostgres,
  syncToPostgresDatabase,
  getSQLSchemaScript,
  resetData,
  exportAllData,
} from '../controllers/systemController.ts';

const router = Router();

router.get('/status', getSystemStatus);
router.post('/postgres-connect', configurePostgres);
router.post('/mysql-connect', configurePostgres); // compatibility
router.post('/sync-postgres', syncToPostgresDatabase);
router.post('/sync-mysql', syncToPostgresDatabase); // compatibility
router.get('/schema-sql', getSQLSchemaScript);
router.post('/reset', resetData);
router.get('/export', exportAllData);

export default router;
