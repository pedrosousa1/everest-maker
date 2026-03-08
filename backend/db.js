// ════════════════════════════════════
// db.js — PostgreSQL (pg) pool
// Usa DATABASE_URL (Railway) ou variáveis individuais
// Fallback: SQLite local via better-sqlite3
// ════════════════════════════════════

const { Pool } = require("pg");

const isProduction =
  process.env.NODE_ENV === "production" || process.env.DATABASE_URL;

if (!isProduction) {
  // ── Ambiente local: usa SQLite ─────────────────────────
  console.log("DB: modo LOCAL (SQLite)");
  const Database = require("better-sqlite3");
  const path = require("path");

  const dbPath = path.join(__dirname, "everest.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      partner_name TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS weddings (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      couple_name  TEXT NOT NULL DEFAULT '',
      wedding_date TEXT,
      venue_name   TEXT,
      total_budget REAL NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS budget_items (
      id           TEXT PRIMARY KEY,
      wedding_id   TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      category     TEXT NOT NULL DEFAULT '',
      description  TEXT NOT NULL DEFAULT '',
      amount       REAL NOT NULL DEFAULT 0,
      paid_amount  REAL NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vendors (
      id             TEXT PRIMARY KEY,
      wedding_id     TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      category       TEXT NOT NULL DEFAULT '',
      value          REAL,
      phone          TEXT,
      email          TEXT,
      instagram      TEXT,
      notes          TEXT,
      budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
      rating_price   INTEGER,
      rating_trust   INTEGER,
      rating_quality INTEGER,
      rating_service INTEGER,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS proposals (
      id             TEXT PRIMARY KEY,
      wedding_id     TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      vendor_name    TEXT NOT NULL,
      vendor_id      TEXT REFERENCES vendors(id) ON DELETE SET NULL,
      category       TEXT NOT NULL DEFAULT '',
      value          REAL NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'negociando',
      notes          TEXT,
      budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id          TEXT PRIMARY KEY,
      wedding_id  TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'Reuniao',
      date        TEXT NOT NULL,
      time        TEXT NOT NULL,
      location    TEXT,
      notes       TEXT,
      completed   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id            TEXT PRIMARY KEY,
      wedding_id    TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      months_before INTEGER NOT NULL DEFAULT 0,
      completed     INTEGER NOT NULL DEFAULT 0,
      is_custom     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration segura para colunas de rating
  const vendorCols = db.pragma("table_info(vendors)").map((c) => c.name);
  if (!vendorCols.includes("rating_price")) {
    db.exec("ALTER TABLE vendors ADD COLUMN rating_price   INTEGER;");
    db.exec("ALTER TABLE vendors ADD COLUMN rating_trust   INTEGER;");
    db.exec("ALTER TABLE vendors ADD COLUMN rating_quality INTEGER;");
    db.exec("ALTER TABLE vendors ADD COLUMN rating_service INTEGER;");
  }

  console.log("SQLite conectado:", dbPath);
  module.exports = db;
} else {
  // ── Produção: usa PostgreSQL ───────────────────────────
  console.log("DB: modo PRODUCAO (PostgreSQL)");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Cria as tabelas no PostgreSQL se não existirem
  async function initDB() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id           TEXT PRIMARY KEY,
          name         TEXT NOT NULL,
          email        TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          partner_name TEXT,
          created_at   TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS weddings (
          id           TEXT PRIMARY KEY,
          user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          couple_name  TEXT NOT NULL DEFAULT '',
          wedding_date TEXT,
          venue_name   TEXT,
          total_budget REAL NOT NULL DEFAULT 0,
          created_at   TEXT NOT NULL DEFAULT NOW(),
          updated_at   TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS budget_items (
          id           TEXT PRIMARY KEY,
          wedding_id   TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
          category     TEXT NOT NULL DEFAULT '',
          description  TEXT NOT NULL DEFAULT '',
          amount       REAL NOT NULL DEFAULT 0,
          paid_amount  REAL NOT NULL DEFAULT 0,
          created_at   TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS vendors (
          id             TEXT PRIMARY KEY,
          wedding_id     TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
          name           TEXT NOT NULL,
          category       TEXT NOT NULL DEFAULT '',
          value          REAL,
          phone          TEXT,
          email          TEXT,
          instagram      TEXT,
          notes          TEXT,
          budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
          rating_price   INTEGER,
          rating_trust   INTEGER,
          rating_quality INTEGER,
          rating_service INTEGER,
          created_at     TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS proposals (
          id             TEXT PRIMARY KEY,
          wedding_id     TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
          vendor_name    TEXT NOT NULL,
          vendor_id      TEXT REFERENCES vendors(id) ON DELETE SET NULL,
          category       TEXT NOT NULL DEFAULT '',
          value          REAL NOT NULL DEFAULT 0,
          status         TEXT NOT NULL DEFAULT 'negociando',
          notes          TEXT,
          budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
          created_at     TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS appointments (
          id          TEXT PRIMARY KEY,
          wedding_id  TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
          title       TEXT NOT NULL,
          type        TEXT NOT NULL DEFAULT 'Reuniao',
          date        TEXT NOT NULL,
          time        TEXT NOT NULL,
          location    TEXT,
          notes       TEXT,
          completed   INTEGER NOT NULL DEFAULT 0,
          created_at  TEXT NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS checklist_items (
          id            TEXT PRIMARY KEY,
          wedding_id    TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
          title         TEXT NOT NULL,
          months_before INTEGER NOT NULL DEFAULT 0,
          completed     INTEGER NOT NULL DEFAULT 0,
          is_custom     INTEGER NOT NULL DEFAULT 0,
          created_at    TEXT NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Tabelas PostgreSQL prontas.");
    } finally {
      client.release();
    }
  }

  initDB().catch(console.error);

  module.exports = pool;
}
