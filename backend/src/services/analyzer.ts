import { fetchRawKlines, fetchKlines } from '../api/binance.js';
import { fetchFearGreedIndex } from '../api/feargreed.js';
import { sendAlert } from '../services/telegram.js';
import { getDatabase, saveDatabase } from '../db/database.js';
import { SMA, RSI } from 'technicalindicators';

interface AnalysisResult {
  symbol: string;
  price: number;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  fearGreed: number | null;
  isBullish: boolean | null;
  alert: string | null;
}

interface AnalyzeMarketOptions {
  symbol?: string;
  rsiOversold?: number;
  rsiOverbought?: number;
  alertsEnabled?: boolean;
}

export async function analyzeMarket(options: AnalyzeMarketOptions = {}): Promise<AnalysisResult> {
  const {
    symbol = 'BTCUSDT',
    rsiOversold = 30,
    rsiOverbought = 70,
    alertsEnabled = true,
  } = options;

  const result: AnalysisResult = {
    symbol,
    price: 0,
    ma50: null,
    ma200: null,
    rsi: null,
    fearGreed: null,
    isBullish: null,
    alert: null,
  };

  try {
    const dailyPrices = await fetchKlines(symbol, '1d', 210);
    const hourlyPrices = await fetchKlines(symbol, '1h', 20);

    result.price = dailyPrices[dailyPrices.length - 1];

    const ma50Data = SMA.calculate({ period: 50, values: dailyPrices });
    const ma200Data = SMA.calculate({ period: 200, values: dailyPrices });

    result.ma50 = ma50Data.length > 0 ? ma50Data[ma50Data.length - 1] : null;
    result.ma200 = ma200Data.length > 0 ? ma200Data[ma200Data.length - 1] : null;

    result.isBullish =
      result.ma50 !== null && result.ma200 !== null ? result.ma50 > result.ma200 : null;

    const rsiData = RSI.calculate({ period: 14, values: hourlyPrices });
    result.rsi = rsiData.length > 0 ? rsiData[rsiData.length - 1] : null;

    const fngData = await fetchFearGreedIndex(1);
    result.fearGreed = fngData.length > 0 ? fngData[0].value : null;

    const db = getDatabase();

    db.run(`
      INSERT INTO market_snapshots (symbol, price, rsi, ma50, ma200, fear_greed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [symbol, result.price, result.rsi, result.ma50, result.ma200, result.fearGreed]);

    if (alertsEnabled && result.isBullish && result.rsi !== null && result.rsi < rsiOversold) {
      const trend = '📈 Tendencia Alcista';
      const tvLink = `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
      result.alert = `🟢 <b>ALERTA DE COMPRA</b>

${symbol} está en sobreventa dentro de una tendencia alcista.
<b>Precio:</b> $${result.price.toLocaleString()}
<b>RSI:</b> ${result.rsi.toFixed(1)} (Umbral: ${rsiOversold})
<b>MA50:</b> $${result.ma50?.toFixed(0)}
<b>MA200:</b> $${result.ma200?.toFixed(0)}
<b>Tendencia:</b> ${trend}

🔍 <a href="${tvLink}">Ver en TradingView</a>`;
      await sendAlert(result.alert);
      db.run(`
        INSERT INTO alerts (symbol, type, message)
        VALUES (?, 'BUY', ?)
      `, [symbol, result.alert]);
    } else if (alertsEnabled && !result.isBullish && result.rsi !== null && result.rsi > rsiOverbought) {
      const trend = '📉 Tendencia Bajista';
      const tvLink = `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
      result.alert = `🔴 <b>ALERTA DE VENTA</b>

${symbol} está sobrecomprado en un mercado bajista.
<b>Precio:</b> $${result.price.toLocaleString()}
<b>RSI:</b> ${result.rsi.toFixed(1)} (Umbral: ${rsiOverbought})
<b>MA50:</b> $${result.ma50?.toFixed(0)}
<b>MA200:</b> $${result.ma200?.toFixed(0)}
<b>Tendencia:</b> ${trend}

🔍 <a href="${tvLink}">Ver en TradingView</a>`;
      await sendAlert(result.alert);
      db.run(`
        INSERT INTO alerts (symbol, type, message)
        VALUES (?, 'SELL', ?)
      `, [symbol, result.alert]);
    }

    saveDatabase();

    return result;
  } catch (error) {
    console.error(`❌ Error analyzing ${symbol}:`, error);
    return result;
  }
}

export async function getChartData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 200) {
  const displayLimit = limit;
  const fetchLimit = Math.max(limit + 200, 500);

  const rawKlines = await fetchRawKlines(symbol, interval, fetchLimit);
  const closePrices = rawKlines.map((k) => parseFloat(k.close));

  const ma50Data = SMA.calculate({ period: 50, values: closePrices });
  const ma200Data = SMA.calculate({ period: 200, values: closePrices });

  const displayKlines = rawKlines.slice(-displayLimit);
  const displayCandles = displayKlines.map((kline) => ({
    time: Math.floor(kline.openTime / 1000),
    open: parseFloat(kline.open),
    high: parseFloat(kline.high),
    low: parseFloat(kline.low),
    close: parseFloat(kline.close),
  }));

  const volume = displayKlines.map((kline) => ({
    time: Math.floor(kline.openTime / 1000),
    value: parseFloat(kline.volume),
    color: parseFloat(kline.close) >= parseFloat(kline.open) ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
  }));

  const totalCandles = rawKlines.length;
  const displayStartIndex = totalCandles - displayLimit;

  const ma50Series: Array<{ time: number; value: number }> = [];
  const ma200Series: Array<{ time: number; value: number }> = [];

  for (let i = displayStartIndex; i < totalCandles; i++) {
    const time = Math.floor(rawKlines[i].openTime / 1000);

    const ma50Index = i - 49;
    if (ma50Index >= 0 && ma50Index < ma50Data.length) {
      ma50Series.push({ time, value: ma50Data[ma50Index] });
    }

    const ma200Index = i - 199;
    if (ma200Index >= 0 && ma200Index < ma200Data.length) {
      ma200Series.push({ time, value: ma200Data[ma200Index] });
    }
  }

  return { candles: displayCandles, volume, ma50: ma50Series, ma200: ma200Series };
}
