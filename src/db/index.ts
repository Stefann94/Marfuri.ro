import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

/**
 * Pe Supabase folosim „Transaction pooler” (portul 6543): împarte conexiunile între cereri, așa că multe
 * instanțe Vercel nu umplu limita. („Session pooler”-ul, 5432, ține câte o conexiune ocupată per instanță
 * și are doar 15 locuri.) Driverul `pg` trimite interogările una câte una pe o conexiune, deci merge cu el.
 */
export function dbUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL lipsește (vezi .env.example).");
  const u = new URL(url);
  if (u.hostname.endsWith(".pooler.supabase.com")) u.port = "6543";
  return u.toString();
}

function createPool() {
  const pool = new Pool({
    connectionString: dbUrl(),
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  // Pe Vercel: închide conexiunile libere înainte ca instanța să fie suspendată (altfel rămân agățate).
  if (process.env.VERCEL) attachDatabasePool(pool);
  return pool;
}

const pool = globalForDb.pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
