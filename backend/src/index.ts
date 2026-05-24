import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, saveDatabase } from './db/database.js';
import { analyzeMarket } from './services/analyzer.js';
import { loadSettings, saveSettings, type AppSettings } from './services/settings.js';
import { createMarketRouter } from './api/routes.js';
import { sendStartupMessage } from './services/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

let cronJob: cron.ScheduledTask | null = null;

function startCronJob(settings: AppSettings) {
  if (cronJob) {
    cronJob.stop();
  }

  cronJob = cron.schedule(`*/${settings.checkIntervalMinutes} * * * *`, async () => {
    console.log(`\n⏰ Running scheduled market analysis (${new Date().toISOString()})...`);
    await analyzeMarket({
      symbol: settings.symbol,
      rsiOversold: settings.rsiOversold,
      rsiOverbought: settings.rsiOverbought,
      alertsEnabled: settings.alertsEnabled,
    });
    saveDatabase();
  });

  console.log(`✅ Scheduler active - checking every ${settings.checkIntervalMinutes} minutes for ${settings.symbol}`);
}

async function main() {
  console.log('🚀 NotiTrade Backend starting...');

  await initDatabase();
  console.log('✅ Database initialized');

  const settings = loadSettings();
  console.log(`📋 Settings loaded: ${settings.symbol}, interval: ${settings.checkIntervalMinutes}min`);

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
  app.use(express.json());

  app.use('/api', createMarketRouter());

  if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.get('/api/settings', (_req, res) => {
    res.json(loadSettings());
  });

  app.put('/api/settings', (req, res) => {
    try {
      const newSettings: Partial<AppSettings> = req.body;
      const current = loadSettings();
      const updated = { ...current, ...newSettings };
      saveSettings(updated);

      if (newSettings.checkIntervalMinutes || newSettings.symbol) {
        startCronJob(updated);
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  console.log(`📊 Running initial market analysis...`);
  const initialResult = await analyzeMarket({
    symbol: settings.symbol,
    rsiOversold: settings.rsiOversold,
    rsiOverbought: settings.rsiOverbought,
    alertsEnabled: settings.alertsEnabled,
  });

  await sendStartupMessage(settings, {
    price: initialResult.price,
    rsi: initialResult.rsi,
    ma50: initialResult.ma50,
    ma200: initialResult.ma200,
    fearGreed: initialResult.fearGreed,
  });

  startCronJob(settings);

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('📡 Backend is ready. Press Ctrl+C to stop.');
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
