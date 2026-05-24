import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'notitrade.sqlite');

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/${file}`;
    },
  });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS market_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      rsi REAL,
      ma50 REAL,
      ma200 REAL,
      fear_greed INTEGER,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  saveDatabase();
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
