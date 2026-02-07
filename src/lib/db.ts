import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'data-geo.db');

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'map_overlay',
    stage INTEGER NOT NULL DEFAULT 1,
    year_start INTEGER,
    year_end INTEGER,
    era TEXT NOT NULL DEFAULT 'modern',
    bounds_west REAL,
    bounds_south REAL,
    bounds_east REAL,
    bounds_north REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filetype TEXT NOT NULL DEFAULT 'other',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);


export default db;
