// ════════════════════════════════════
// dbHelpers.js
// Abstrai a diferença entre SQLite (sync) e PostgreSQL (async)
// Exporta: query(sql, params) → sempre Promise<rows[]>
//          queryOne(sql, params) → Promise<row | null>
//          run(sql, params) → Promise<void>
// ════════════════════════════════════

const db = require("./db");

const isPostgres = !!(
  process.env.NODE_ENV === "production" || process.env.DATABASE_URL
);

/**
 * Converte placeholders SQLite (?) para PostgreSQL ($1, $2, ...)
 */
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/**
 * Executa uma query e retorna array de linhas
 */
async function query(sql, params = []) {
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    const result = await db.query(pgSql, params);
    return result.rows;
  } else {
    return db.prepare(sql).all(...params);
  }
}

/**
 * Executa uma query e retorna uma única linha (ou null)
 */
async function queryOne(sql, params = []) {
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    const result = await db.query(pgSql, params);
    return result.rows[0] ?? null;
  } else {
    return db.prepare(sql).get(...params) ?? null;
  }
}

/**
 * Executa INSERT / UPDATE / DELETE sem retorno
 */
async function run(sql, params = []) {
  if (isPostgres) {
    const pgSql = convertPlaceholders(sql);
    await db.query(pgSql, params);
  } else {
    db.prepare(sql).run(...params);
  }
}

module.exports = { query, queryOne, run };
