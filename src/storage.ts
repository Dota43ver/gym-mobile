import * as SQLite from "expo-sqlite";
import { Store } from "./store";
let database: Promise<SQLite.SQLiteDatabase> | undefined;
function db() {
  if (!database)
    database = (async () => {
      const connection = await SQLite.openDatabaseAsync("gym-mobile.db");
      await connection.execAsync(
        "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL);",
      );
      return connection;
    })().catch((error) => {
      database = undefined;
      throw error;
    });
  return database;
}
export const store = new Store({
  async read() {
    const connection = await db();
    const row = await connection.getFirstAsync<{ json: string }>(
      "SELECT json FROM app_state WHERE id = 1",
    );
    return row?.json ?? null;
  },
  async write(json) {
    const connection = await db();
    await connection.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(
        "INSERT INTO app_state (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
        json,
      );
    });
  },
});
