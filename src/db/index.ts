import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;
let _db: Db | null = null;
let _sqlite: Database | null = null;

export async function initDb(): Promise<Db> {
  _sqlite = await Database.load("sqlite:loglylife.db");
  const sqlite = _sqlite;

  await sqlite.execute(
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      color TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  await sqlite.execute(
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT,
      duration_minutes INTEGER,
      memo TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    []
  );

  await sqlite.execute(
    `CREATE TABLE IF NOT EXISTS activity_log_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL REFERENCES activity_logs(id),
      category_id INTEGER NOT NULL REFERENCES categories(id)
    )`,
    []
  );

  _db = drizzle(
    async (sql, params, method) => {
      if (method === "run") {
        await sqlite.execute(sql, params as unknown[]);
        return { rows: [] };
      }
      const rows = await sqlite.select<Record<string, unknown>[]>(sql, params as unknown[]);
      return { rows: rows.map((row) => Object.values(row)) };
    },
    { schema }
  );

  const existing = await sqlite.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM categories",
    []
  );
  if (existing[0].count === 0) {
    for (const name of ["学習", "開発", "就活", "その他"]) {
      await sqlite.execute("INSERT INTO categories (name) VALUES (?)", [name]);
    }
  }

  return _db;
}

export function getDb(): Db {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}

export async function insertActivityLog(params: {
  date: string;
  durationMinutes: number | null;
  memo: string | null;
}): Promise<number> {
  if (!_sqlite) throw new Error("DB not initialized. Call initDb() first.");
  await _sqlite.execute(
    "INSERT INTO activity_logs (date, duration_minutes, memo) VALUES (?, ?, ?)",
    [params.date, params.durationMinutes, params.memo]
  );
  const rows = await _sqlite.select<{ id: number }[]>(
    "SELECT MAX(id) as id FROM activity_logs",
    []
  );
  return rows[0].id;
}
