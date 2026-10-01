const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'devolucoes.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// product_key = chave normalizada (sem acento, minúscula, espaços únicos) usada
// para evitar duplicatas como "Vestido Floral" vs "vestido  floral ".
// product = texto exatamente como o usuário digitou (exibido na tela).
db.exec(`
  CREATE TABLE IF NOT EXISTS returns (
    store TEXT NOT NULL,
    date TEXT NOT NULL,
    product_key TEXT NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (store, date, product_key)
  );

  CREATE TABLE IF NOT EXISTS daily_products (
    store TEXT NOT NULL,
    date TEXT NOT NULL,
    product_key TEXT NOT NULL,
    product TEXT NOT NULL,
    PRIMARY KEY (store, date, product_key)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    store TEXT NOT NULL,
    product_key TEXT NOT NULL,
    product TEXT NOT NULL,
    PRIMARY KEY (store, product_key)
  );

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

module.exports = db;
