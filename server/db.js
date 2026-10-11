import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

/** Opens the SQLite database and applies any pending migrations in order. */
export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON;')
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL;')
  migrate(db)
  return db
}

export function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)')
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version))
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    transaction(db, () => {
      db.exec(sql)
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(file, Date.now())
    })
  }
}

/** Runs fn inside a transaction (nested calls join the outer one). */
export function transaction(db, fn) {
  if (db.isTransaction) return fn()
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
