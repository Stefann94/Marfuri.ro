import { sql } from "drizzle-orm";
import { db, dbUrl } from "@/db";

export const dynamic = "force-dynamic";

/** Verificare rapidă: ce pooler folosește DATABASE_URL (fără parolă) și dacă baza răspunde. */
export async function GET() {
  let port = "?";
  let host = "?";
  try {
    const u = new URL(dbUrl());
    port = u.port || "5432";
    host = u.hostname.replace(/^[^.]+\./, "*.");
  } catch {}
  const t0 = Date.now();
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, rej) => setTimeout(() => rej(new Error("fără răspuns în 8 s")), 8000)),
    ]);
    return Response.json({ db: "ok", ms: Date.now() - t0, port, host, region: process.env.VERCEL_REGION ?? null });
  } catch (e) {
    return Response.json({ db: "eroare", motiv: (e as Error).message, port, host, region: process.env.VERCEL_REGION ?? null }, { status: 503 });
  }
}
