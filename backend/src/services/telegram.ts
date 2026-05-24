import TelegramBot from 'node-telegram-bot-api';
import type { AppSettings } from './settings.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram alerts will be disabled.');
}
if (!TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_CHAT_ID is not set. Telegram alerts will be disabled.');
}

const bot = TELEGRAM_TOKEN ? new TelegramBot(TELEGRAM_TOKEN) : null;

async function sendMessage(message: string): Promise<void> {
  if (!bot) {
    console.log(`[ALERT LOG - Telegram Disabled] ${message}`);
    return;
  }

  if (!TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID is missing. Cannot send message.');
    console.log(`[ALERT LOG] ${message}`);
    return;
  }

  try {
    const safeMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    await bot.sendMessage(TELEGRAM_CHAT_ID, safeMessage, { parse_mode: 'HTML' });
    console.log(`✅ Message sent to Telegram: ${message.slice(0, 50)}...`);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; response?: { body?: string } };
    console.error('❌ Failed to send Telegram message:', err.code || err.message || error);
    if (err.response?.body) {
      console.error('Telegram API Response:', err.response.body);
    }
  }
}

export async function sendAlert(message: string): Promise<void> {
  await sendMessage(message);
}

export async function sendStartupMessage(
  settings: AppSettings,
  marketData: {
    price: number;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    fearGreed: number | null;
  }
): Promise<void> {
  const rsiStr = marketData.rsi !== null ? marketData.rsi.toFixed(1) : 'N/A';
  const ma50Str = marketData.ma50 !== null ? `$${marketData.ma50.toLocaleString()}` : 'N/A';
  const ma200Str = marketData.ma200 !== null ? `$${marketData.ma200.toLocaleString()}` : 'N/A';
  const fgStr = marketData.fearGreed !== null ? `${marketData.fearGreed}/100` : 'N/A';

  const message = `🚀 <b>NotiTrade Bot Online</b>

<b>⚙️ Configuración Actual:</b>
• Par: ${settings.symbol}
• Intervalo: cada ${settings.checkIntervalMinutes} min
• Alertas: ${settings.alertsEnabled ? '✅ Activas' : '❌ Desactivadas'}

<b>📊 Estado del Mercado:</b>
• Precio: $${marketData.price.toLocaleString()}
• RSI(14): ${rsiStr}
• MA50: ${ma50Str}
• MA200: ${ma200Str}
• Fear & Greed: ${fgStr}

📡 <i>Monitoreo activo. Te avisaré si detecto oportunidades.</i>`;

  await sendMessage(message);
}
