import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { initDatabase, saveDatabase } from './db/database';
import { analyzeMarket } from './services/analyzer';
import { createMarketRouter } from './api/routes';

const PORT = process.env.PORT || 3001;
const CHECK_INTERVAL_MINUTES = process.env.CHECK_INTERVAL_MINUTES || '15';

async function main() {
  console.log('🚀 NotiTrade Backend starting...');

  await initDatabase();
  console.log('✅ Database initialized');

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.use('/api', createMarketRouter());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  console.log(`📊 Running initial market analysis...`);
  await analyzeMarket('BTCUSDT');

  cron.schedule(`*/${CHECK_INTERVAL_MINUTES} * * * *`, async () => {
    console.log(`\n⏰ Running scheduled market analysis (${new Date().toISOString()})...`);
    await analyzeMarket('BTCUSDT');
    saveDatabase();
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Scheduler active - checking every ${CHECK_INTERVAL_MINUTES} minutes`);
    console.log('📡 Backend is ready. Press Ctrl+C to stop.');
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
