import { createClient, Client } from "@libsql/client";
import path from "path";

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function dbUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  // Absolute path — stays consistent across hot reloads
  return `file:${path.join(process.cwd(), "data", "local.db")}`;
}

function createDbClient(): Client {
  return createClient({
    url:       dbUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export function getDbClient(): Client {
  if (!client) client = createDbClient();
  return client;
}

const TABLES = [
  `CREATE TABLE IF NOT EXISTS food_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    food_name    TEXT    NOT NULL,
    calories     REAL    NOT NULL,
    protein      REAL    NOT NULL DEFAULT 0,
    carbs        REAL    NOT NULL DEFAULT 0,
    fat          REAL    NOT NULL DEFAULT 0,
    serving_size TEXT    NOT NULL DEFAULT '',
    quantity     REAL    DEFAULT 1,
    meal_category TEXT   DEFAULT 'Snack',
    date         TEXT    NOT NULL,
    user_id      TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL DEFAULT '',
    profile_image TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS user_settings (
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
  )`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reward_points (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL UNIQUE,
    total_points    INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS daily_rewards (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    reward_type    TEXT NOT NULL,
    points_awarded INTEGER NOT NULL,
    date_claimed   TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, reward_type, date_claimed),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS streaks (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT NOT NULL UNIQUE,
    current_streak       INTEGER NOT NULL DEFAULT 0,
    longest_streak       INTEGER NOT NULL DEFAULT 0,
    last_completion_date TEXT,
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS game_profiles (
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
  )`,
  `CREATE TABLE IF NOT EXISTS nutri_avatars (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL UNIQUE,
    current_mood TEXT NOT NULL DEFAULT 'happy',
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS nutri_equipped (
    user_id   TEXT NOT NULL,
    category  TEXT NOT NULL,
    item_id   TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS nutri_inventory (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL,
    item_id      TEXT NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
];

async function runSchema(db: Client): Promise<void> {
  // Enable WAL mode for concurrent read/write without locking
  try { await db.execute("PRAGMA journal_mode=WAL"); } catch { /* not supported on remote */ }

  // Create each table individually — a failure in one doesn't block the others
  for (const sql of TABLES) {
    await db.execute(sql);
  }
}

export async function getDb(): Promise<Client> {
  const db = getDbClient();
  if (!schemaReady) {
    schemaReady = runSchema(db).catch(err => {
      schemaReady = null; // reset so the next request retries
      throw err;
    });
  }
  await schemaReady;
  return db;
}
