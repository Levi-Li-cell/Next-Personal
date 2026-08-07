import * as schema from "./schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const databaseUrl = (process.env.DATABASE_URL || "").trim();
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

// Supabase pooler (pgbouncer/transaction pooling) works best without prepared statements.
const isSupabasePooler = /\.pooler\.supabase\.com(?::\d+)?\b/i.test(databaseUrl);
const client = postgres(databaseUrl, {
  prepare: !isSupabasePooler,
});
export const db = drizzle(client, { schema });
