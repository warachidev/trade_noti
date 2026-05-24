import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram alerts will be disabled.');
}
if (!TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_CHAT_ID is not set. Telegram alerts will be disabled.');
}

const bot = TELEGRAM_TOKEN ? new TelegramBot(TELEGRAM_TOKEN) : null;

export async function sendAlert(message: string): Promise<void> {
  if (!bot) {
    console.log(`[ALERT LOG - Telegram Disabled] ${message}`);
    return;
  }

  if (!TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID is missing. Cannot send alert.');
    console.log(`[ALERT LOG] ${message}`);
    return;
  }

  try {
    const safeMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    await bot.sendMessage(TELEGRAM_CHAT_ID, safeMessage, { parse_mode: 'HTML' });
    console.log(`✅ Alert sent to Telegram: ${message.slice(0, 50)}...`);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; response?: { body?: string } };
    console.error('❌ Failed to send Telegram alert:', err.code || err.message || error);
    if (err.response?.body) {
      console.error('Telegram API Response:', err.response.body);
    }
  }
}
