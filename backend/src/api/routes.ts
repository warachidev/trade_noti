import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDatabase, saveDatabase } from '../db/database';
import { getChartData, analyzeMarket } from '../services/analyzer';
import { loadSettings } from '../services/settings';

const router = express.Router();

export function createMarketRouter(): express.Router {
  router.post('/analyze', async (_req, res) => {
    try {
      const settings = loadSettings();
      const result = await analyzeMarket({
        symbol: settings.symbol,
        rsiOversold: settings.rsiOversold,
        rsiOverbought: settings.rsiOverbought,
        alertsEnabled: settings.alertsEnabled,
      });
      saveDatabase();
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error running manual analysis:', error);
      res.status(500).json({ error: 'Failed to run analysis' });
    }
  });

  router.get('/market-status', async (_req, res) => {
    try {
      const db = getDatabase();

      const snapshot = db.exec(`
        SELECT * FROM market_snapshots
        ORDER BY timestamp DESC
        LIMIT 1
      `);

      if (snapshot.length === 0 || snapshot[0].values.length === 0) {
        return res.json({
          symbol: 'BTCUSDT',
          price: null,
          rsi: null,
          ma50: null,
          ma200: null,
          fearGreed: null,
          isBullish: null,
          lastUpdate: null,
        });
      }

      const columns = snapshot[0].columns;
      const row = snapshot[0].values[0];
      const data: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        data[col] = row[i];
      });

      const ma50 = data.ma50 as number | null;
      const ma200 = data.ma200 as number | null;

      res.json({
        symbol: data.symbol,
        price: data.price,
        rsi: data.rsi,
        ma50,
        ma200,
        fearGreed: data.fear_greed,
        isBullish: ma50 !== null && ma200 !== null ? ma50 > ma200 : null,
        lastUpdate: data.timestamp,
      });
    } catch (error) {
      console.error('Error fetching market status:', error);
      res.status(500).json({ error: 'Failed to fetch market status' });
    }
  });

  router.get('/alerts', async (_req, res) => {
    try {
      const db = getDatabase();

      const alerts = db.exec(`
        SELECT id, symbol, type, message, timestamp
        FROM alerts
        ORDER BY timestamp DESC
        LIMIT 50
      `);

      if (alerts.length === 0) {
        return res.json([]);
      }

      const columns = alerts[0].columns;
      const formattedAlerts = alerts[0].values.map((row) => {
        const alert: Record<string, unknown> = {};
        columns.forEach((col, i) => {
          alert[col] = row[i];
        });
        return alert;
      });

      res.json(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  router.get('/chart-data', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const interval = (req.query.interval as string) || '1d';
      const limit = parseInt(req.query.limit as string) || 200;

      const chartData = await getChartData(symbol, interval, limit);
      res.json(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  });

  return router;
}
