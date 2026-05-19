import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Alerts will be logged only.');
}

const bot = TELEGRAM_TOKEN ? new TelegramBot(TELEGRAM_TOKEN) : null;

export async function sendAlert(message: string): Promise<void> {
  if (!bot || !TELEGRAM_CHAT_ID) {
    console.log(`[ALERT LOG] ${message}`);
    return;
  }

  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'HTML' });
    console.log(`✅ Alert sent to Telegram: ${message.slice(0, 50)}...`);
  } catch (error) {
    console.error('❌ Failed to send Telegram alert:', error);
  }
}
