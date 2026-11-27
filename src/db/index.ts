import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL lipsește (vezi .env.example).");
  // Pe Supabase folosim „Session pooler” (portul 5432): „Transaction pooler”-ul (6543) se blochează când
  // postgres.js trimite mai multe interogări deodată pe aceeași conexiune. prepare: false merge cu ambele.
  return postgres(url, { max: Number(process.env.DB_POOL_MAX ?? 10), idle_timeout: 30, prepare: false });
}

const client = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
