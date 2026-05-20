import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(path.join(dataDir, "calorie_tracker.db"));

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

  try {
    db.exec(`ALTER TABLE food_log ADD COLUMN meal_category TEXT DEFAULT 'Snack'`);
  } catch {
    // column already exists
  }

  return db;
}
