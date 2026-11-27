import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

/**
 * Pe Supabase folosim „Session pooler” (portul 5432): „Transaction pooler”-ul (6543) se blochează când
 * postgres.js trimite mai multe interogări deodată pe aceeași conexiune. Dacă adresa vine totuși cu 6543,
 * o trecem pe 5432 (același server). prepare: false merge cu ambele.
 */
export function dbUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL lipsește (vezi .env.example).");
  const u = new URL(url);
  if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") u.port = "5432";
  return u.toString();
}

function createClient() {
  return postgres(dbUrl(), { max: Number(process.env.DB_POOL_MAX ?? 10), idle_timeout: 30, prepare: false });
}

const client = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
