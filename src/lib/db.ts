import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(path.join(dataDir, "calorie_tracker.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // ── food_log ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS food_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name    TEXT    NOT NULL,
      calories     REAL    NOT NULL,
      protein      REAL    NOT NULL,
      carbs        REAL    NOT NULL,
      fat          REAL    NOT NULL,
      serving_size TEXT    NOT NULL,
      quantity     REAL    DEFAULT 1,
      date         TEXT    NOT NULL,
      created_at   TEXT    DEFAULT (datetime('now'))
    )
  `);
  for (const [col, def] of [
    ["meal_category", "TEXT DEFAULT 'Snack'"],
    ["user_id",       "TEXT"],
  ]) {
    try { db.exec(`ALTER TABLE food_log ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
  }

  // ── users ─────────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      display_name  TEXT NOT NULL DEFAULT '',
      profile_image TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── sessions ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      token      TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── user_settings ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id        TEXT PRIMARY KEY,
      calorie_goal   INTEGER NOT NULL DEFAULT 2000,
      protein_goal   INTEGER NOT NULL DEFAULT 150,
      carbs_goal     INTEGER NOT NULL DEFAULT 250,
      fat_goal       INTEGER NOT NULL DEFAULT 65,
      water_goal     INTEGER NOT NULL DEFAULT 3000,
      weight         REAL,
      height         REAL,
      activity_level TEXT NOT NULL DEFAULT 'moderately_active',
      goal_type      TEXT NOT NULL DEFAULT 'maintain_weight',
      updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── legacy settings (no longer written) ───────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

  // ── reward_points ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS reward_points (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL UNIQUE,
      total_points    INTEGER NOT NULL DEFAULT 0,
      lifetime_points INTEGER NOT NULL DEFAULT 0,
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── daily_rewards ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_rewards (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL,
      reward_type    TEXT NOT NULL,
      points_awarded INTEGER NOT NULL,
      date_claimed   TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, reward_type, date_claimed),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── streaks ───────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS streaks (
      id                   TEXT PRIMARY KEY,
      user_id              TEXT NOT NULL UNIQUE,
      current_streak       INTEGER NOT NULL DEFAULT 0,
      longest_streak       INTEGER NOT NULL DEFAULT 0,
      last_completion_date TEXT,
      updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── game_profiles ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_profiles (
      id                    TEXT PRIMARY KEY,
      user_id               TEXT NOT NULL UNIQUE,
      level                 INTEGER NOT NULL DEFAULT 1,
      experience            INTEGER NOT NULL DEFAULT 0,
      active_environment    TEXT NOT NULL DEFAULT 'healthy_forest',
      active_creature       TEXT,
      unlocked_creatures    TEXT NOT NULL DEFAULT '[]',
      unlocked_environments TEXT NOT NULL DEFAULT '["healthy_forest"]',
      inventory             TEXT NOT NULL DEFAULT '[]',
      updated_at            TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  return db;
}
