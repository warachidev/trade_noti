import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'settings.json');

export interface AppSettings {
  symbol: string;
  checkIntervalMinutes: number;
  rsiOversold: number;
  rsiOverbought: number;
  alertsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  symbol: 'BTCUSDT',
  checkIntervalMinutes: 15,
  rsiOversold: 30,
  rsiOverbought: 70,
  alertsEnabled: true,
};

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.error('Error loading settings, using defaults:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
