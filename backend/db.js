// ════════════════════════════════════
// db.js — PostgreSQL (Railway)
// ════════════════════════════════════
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("ERRO FATAL: DATABASE_URL nao definida!");
  console.error(
    "Configure o PostgreSQL no Railway e ligue ao servico Node.js.",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        partner_name TEXT, created_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS weddings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        couple_name TEXT NOT NULL DEFAULT '', wedding_date TEXT, venue_name TEXT,
        total_budget REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT NOW(), updated_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS budget_items (
        id TEXT PRIMARY KEY,
        wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
        category TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0, paid_amount REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
        name TEXT NOT NULL, category TEXT NOT NULL DEFAULT '', value REAL,
        phone TEXT, email TEXT, instagram TEXT, notes TEXT,
        budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
        rating_price INTEGER, rating_trust INTEGER,
        rating_quality INTEGER, rating_service INTEGER,
        created_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS proposals (
        id TEXT PRIMARY KEY,
        wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
        vendor_name TEXT NOT NULL,
        vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
        category TEXT NOT NULL DEFAULT '', value REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'negociando', notes TEXT,
        budget_item_id TEXT REFERENCES budget_items(id) ON DELETE SET NULL,
        rating_price INTEGER, rating_trust INTEGER,
        rating_quality INTEGER, rating_service INTEGER,
        created_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
        title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Reuniao',
        date TEXT NOT NULL, time TEXT NOT NULL,
        location TEXT, notes TEXT, completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
        title TEXT NOT NULL, months_before INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0, is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT NOW()
      );
    `);

    // Migration para proposals caso as colunas de rating não existam
    await client.query(`
      ALTER TABLE proposals ADD COLUMN IF NOT EXISTS rating_price INTEGER;
      ALTER TABLE proposals ADD COLUMN IF NOT EXISTS rating_trust INTEGER;
      ALTER TABLE proposals ADD COLUMN IF NOT EXISTS rating_quality INTEGER;
      ALTER TABLE proposals ADD COLUMN IF NOT EXISTS rating_service INTEGER;
    `);

    console.log("Tabelas PostgreSQL prontas.");
  } finally {
    client.release();
  }
}

initDB().catch((err) => {
  console.error("FATAL: erro ao inicializar banco:", err.message);
  process.exit(1);
});

module.exports = pool;
