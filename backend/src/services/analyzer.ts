import { fetchRawKlines, fetchKlines, type RawKline } from '../api/binance.js';
import { fetchFearGreedIndex } from '../api/feargreed.js';
import { sendAlert } from '../services/telegram.js';
import { getDatabase, saveDatabase } from '../db/database.js';
import { SMA, RSI } from 'technicalindicators';

export type DivergenceType = 'bullish' | 'bearish' | null;
export type VolumeTrendType = 'increasing' | 'decreasing' | 'spike' | 'normal' | null;
export type PriceVsMaType = 'above' | 'below' | null;
export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface VolumeAnalysis {
  trend: VolumeTrendType;
  currentVolume: number;
  averageVolume: number;
  isSpike: boolean;
  spikeMultiplier: number;
}

export interface DivergenceAnalysis {
  type: DivergenceType;
  strength: number;
  description: string;
}

export interface SignalScore {
  type: SignalType;
  confidence: number;
  factors: string[];
  invalidationLevel: number | null;
  riskRewardRatio: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
}

export interface AnalysisResult {
  symbol: string;
  price: number;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  fearGreed: number | null;
  isBullish: boolean | null;
  alert: string | null;
  priceVsMa200: PriceVsMaType;
  volume: VolumeAnalysis;
  divergence: DivergenceAnalysis;
  shortSignal: SignalScore;
  longSignal: SignalScore;
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
    priceVsMa200: null,
    volume: { trend: null, currentVolume: 0, averageVolume: 0, isSpike: false, spikeMultiplier: 0 },
    divergence: { type: null, strength: 0, description: 'No divergence detected' },
    shortSignal: { type: 'NEUTRAL', confidence: 0, factors: [], invalidationLevel: null, riskRewardRatio: null, stopLoss: null, takeProfit: null },
    longSignal: { type: 'NEUTRAL', confidence: 0, factors: [], invalidationLevel: null, riskRewardRatio: null, stopLoss: null, takeProfit: null },
  };

  try {
    const dailyPrices = await fetchKlines(symbol, '1d', 210);
    const hourlyPrices = await fetchKlines(symbol, '1h', 20);
    const hourlyKlines = await fetchRawKlines(symbol, '1h', 50);
    const dailyKlines = await fetchRawKlines(symbol, '1d', 210);

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

    result.priceVsMa200 = result.ma200 !== null
      ? (result.price > result.ma200 ? 'above' : 'below')
      : null;

    result.volume = analyzeVolume(hourlyKlines);

    result.divergence = detectDivergence(hourlyKlines);

    result.shortSignal = evaluateShortSignal(result, rsiOverbought);
    result.longSignal = evaluateLongSignal(result, rsiOversold);

    const db = getDatabase();

    db.run(`
      INSERT INTO market_snapshots (symbol, price, rsi, ma50, ma200, fear_greed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [symbol, result.price, result.rsi, result.ma50, result.ma200, result.fearGreed]);

    if (alertsEnabled && result.longSignal.type === 'STRONG_BUY') {
      const tvLink = `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
      result.alert = `🟢 <b>ALERTA DE COMPRA FUERTE</b>

${symbol} muestra confluencia alcista.
<b>Precio:</b> $${result.price.toLocaleString()}
<b>RSI:</b> ${result.rsi?.toFixed(1)} (Sobreventa)
<b>MA50:</b> $${result.ma50?.toFixed(0)}
<b>MA200:</b> $${result.ma200?.toFixed(0)}
<b>Miedo/Codicia:</b> ${result.fearGreed}/100
<b>Confianza:</b> ${result.longSignal.confidence}%
<b>Stop Loss:</b> $${result.longSignal.stopLoss?.toLocaleString()}
<b>Take Profit:</b> $${result.longSignal.takeProfit?.toLocaleString()}
<b>R:R:</b> ${result.longSignal.riskRewardRatio?.toFixed(1)}:1

${result.divergence.type === 'bullish' ? `⚡ <b>Divergencia Alcista Detectada</b>\n${result.divergence.description}\n` : ''}🔍 <a href="${tvLink}">Ver en TradingView</a>`;
      await sendAlert(result.alert);
      db.run(`
        INSERT INTO alerts (symbol, type, message)
        VALUES (?, 'BUY', ?)
      `, [symbol, result.alert]);
    } else if (alertsEnabled && result.shortSignal.type === 'STRONG_SELL') {
      const tvLink = `https://www.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
      result.alert = `🔴 <b>ALERTA DE VENTA FUERTE</b>

${symbol} muestra confluencia bajista.
<b>Precio:</b> $${result.price.toLocaleString()}
<b>RSI:</b> ${result.rsi?.toFixed(1)} (Sobrecompra)
<b>MA50:</b> $${result.ma50?.toFixed(0)}
<b>MA200:</b> $${result.ma200?.toFixed(0)}
<b>Miedo/Codicia:</b> ${result.fearGreed}/100
<b>Confianza:</b> ${result.shortSignal.confidence}%
<b>Stop Loss:</b> $${result.shortSignal.stopLoss?.toLocaleString()}
<b>Take Profit:</b> $${result.shortSignal.takeProfit?.toLocaleString()}
<b>R:R:</b> ${result.shortSignal.riskRewardRatio?.toFixed(1)}:1

${result.divergence.type === 'bearish' ? `⚡ <b>Divergencia Bajista Detectada</b>\n${result.divergence.description}\n` : ''}🔍 <a href="${tvLink}">Ver en TradingView</a>`;
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

function analyzeVolume(klines: RawKline[]): VolumeAnalysis {
  const volumes = klines.map((k) => parseFloat(k.volume));
  const recentVolumes = volumes.slice(-5);
  const olderVolumes = volumes.slice(-20, -5);

  const currentVolume = volumes[volumes.length - 1];
  const averageVolume = olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length;
  const recentAverage = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;

  const spikeMultiplier = averageVolume > 0 ? currentVolume / averageVolume : 0;
  const isSpike = spikeMultiplier > 2.0;

  let trend: VolumeTrendType = 'normal';
  if (isSpike) {
    trend = 'spike';
  } else if (recentAverage > averageVolume * 1.3) {
    trend = 'increasing';
  } else if (recentAverage < averageVolume * 0.7) {
    trend = 'decreasing';
  }

  return { trend, currentVolume, averageVolume, isSpike, spikeMultiplier };
}

function detectDivergence(klines: RawKline[]): DivergenceAnalysis {
  const closes = klines.map((k) => parseFloat(k.close));
  const rsiValues = RSI.calculate({ period: 14, values: closes });

  if (rsiValues.length < 30) {
    return { type: null, strength: 0, description: 'Insufficient data for divergence analysis' };
  }

  const lookback = 20;
  const recentCloses = closes.slice(-lookback);
  const recentRsi = rsiValues.slice(-lookback);

  const priceMin = Math.min(...recentCloses);
  const priceMax = Math.max(...recentCloses);
  const rsiMin = Math.min(...recentRsi);
  const rsiMax = Math.max(...recentRsi);

  const priceMinIndex = recentCloses.indexOf(priceMin);
  const priceMaxIndex = recentCloses.indexOf(priceMax);
  const rsiMinIndex = recentRsi.indexOf(rsiMin);
  const rsiMaxIndex = recentRsi.indexOf(rsiMax);

  const divergenceThreshold = 2;

  if (priceMinIndex > rsiMinIndex + 2 && (rsiMax - rsiMin) > divergenceThreshold) {
    const strength = Math.min(((rsiMax - rsiMin) / 10) * 100, 100);
    return {
      type: 'bullish',
      strength,
      description: `Price made lower low but RSI made higher low. Strength: ${strength.toFixed(0)}%`,
    };
  }

  if (priceMaxIndex > rsiMaxIndex + 2 && (rsiMax - rsiMin) > divergenceThreshold) {
    const strength = Math.min(((rsiMax - rsiMin) / 10) * 100, 100);
    return {
      type: 'bearish',
      strength,
      description: `Price made higher high but RSI made lower high. Strength: ${strength.toFixed(0)}%`,
    };
  }

  return { type: null, strength: 0, description: 'No divergence detected' };
}

function evaluateShortSignal(result: AnalysisResult, rsiOverbought: number): SignalScore {
  const score: SignalScore = {
    type: 'NEUTRAL',
    confidence: 0,
    factors: [],
    invalidationLevel: null,
    riskRewardRatio: null,
    stopLoss: null,
    takeProfit: null,
  };

  let confidence = 0;

  if (result.priceVsMa200 === 'below') {
    confidence += 25;
    score.factors.push('Price below MA200 (bearish macro)');
  }

  if (result.rsi !== null && result.rsi > 70) {
    confidence += 20;
    score.factors.push(`RSI overbought (${result.rsi.toFixed(1)})`);
  } else if (result.rsi !== null && result.rsi > rsiOverbought) {
    confidence += 10;
    score.factors.push(`RSI elevated (${result.rsi.toFixed(1)})`);
  }

  if (result.divergence.type === 'bearish') {
    confidence += 20;
    score.factors.push(`Bearish divergence detected (${result.divergence.strength.toFixed(0)}%)`);
  }

  if (result.volume.trend === 'decreasing') {
    confidence += 10;
    score.factors.push('Decreasing volume (weak buying interest)');
  }

  if (result.fearGreed !== null && result.fearGreed > 75) {
    confidence += 15;
    score.factors.push(`Extreme greed (${result.fearGreed}/100) - contrarian short signal`);
  } else if (result.fearGreed !== null && result.fearGreed > 55) {
    confidence += 5;
    score.factors.push(`Greed zone (${result.fearGreed}/100)`);
  }

  if (result.fearGreed !== null && result.fearGreed < 30) {
    confidence -= 30;
    score.factors.push('⚠️ FEAR ZONE - High short squeeze risk');
  }

  confidence = Math.max(0, Math.min(100, confidence));
  score.confidence = confidence;

  if (confidence >= 70) {
    score.type = 'STRONG_SELL';
  } else if (confidence >= 50) {
    score.type = 'SELL';
  } else if (confidence <= 20 && result.fearGreed !== null && result.fearGreed >= 30) {
    score.type = 'NEUTRAL';
  }

  if (result.ma50 !== null) {
    score.invalidationLevel = result.ma50 * 1.01;
    score.stopLoss = result.ma50 * 1.01;
    const risk = result.price * 0.01;
    score.takeProfit = result.price - (risk * 2);
    score.riskRewardRatio = risk > 0 ? 2 : null;
  }

  return score;
}

function evaluateLongSignal(result: AnalysisResult, rsiOversold: number): SignalScore {
  const score: SignalScore = {
    type: 'NEUTRAL',
    confidence: 0,
    factors: [],
    invalidationLevel: null,
    riskRewardRatio: null,
    stopLoss: null,
    takeProfit: null,
  };

  let confidence = 0;

  if (result.priceVsMa200 === 'above') {
    confidence += 25;
    score.factors.push('Price above MA200 (bullish macro)');
  }

  if (result.rsi !== null && result.rsi < 25) {
    confidence += 20;
    score.factors.push(`RSI deeply oversold (${result.rsi.toFixed(1)})`);
  } else if (result.rsi !== null && result.rsi < rsiOversold) {
    confidence += 15;
    score.factors.push(`RSI oversold (${result.rsi.toFixed(1)})`);
  }

  if (result.divergence.type === 'bullish') {
    confidence += 20;
    score.factors.push(`Bullish divergence detected (${result.divergence.strength.toFixed(0)}%)`);
  }

  if (result.volume.isSpike) {
    confidence += 15;
    score.factors.push(`Volume spike (${result.volume.spikeMultiplier.toFixed(1)}x avg) - capitulation`);
  }

  if (result.fearGreed !== null && result.fearGreed < 25) {
    confidence += 15;
    score.factors.push(`Extreme fear (${result.fearGreed}/100) - accumulation zone`);
  } else if (result.fearGreed !== null && result.fearGreed < 45) {
    confidence += 5;
    score.factors.push(`Fear zone (${result.fearGreed}/100)`);
  }

  confidence = Math.max(0, Math.min(100, confidence));
  score.confidence = confidence;

  if (confidence >= 70) {
    score.type = 'STRONG_BUY';
  } else if (confidence >= 50) {
    score.type = 'BUY';
  }

  if (result.ma200 !== null) {
    score.invalidationLevel = result.ma200 * 0.99;
    score.stopLoss = result.ma200 * 0.99;
    const risk = result.price * 0.01;
    score.takeProfit = result.price + (risk * 2);
    score.riskRewardRatio = risk > 0 ? 2 : null;
  }

  return score;
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
