import * as schema from "./schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

let _db: PostgresJsDatabase<typeof schema> | null = null;
let _initError: string | null = null;

function createDb() {
  const databaseUrl = (process.env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL");
  }
  const isSupabasePooler = /\.pooler\.supabase\.com(?::\d+)?\b/i.test(databaseUrl);
  const client = postgres(databaseUrl, {
    prepare: !isSupabasePooler,
  });
  return drizzle(client, { schema });
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    if (_initError) {
      throw new Error(_initError);
    }
    if (!_db) {
      try {
        _db = createDb();
      } catch (e) {
        _initError = e instanceof Error ? e.message : "Database initialization failed";
        throw new Error(_initError);
      }
    }
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(_db) : value;
  },
});
