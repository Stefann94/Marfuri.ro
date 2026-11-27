import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { companies, sessions, users } from "@/db/schema";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "mf_sesiune";
const SESSION_DAYS = 30;

/* ------------------------------------------------------------ parole */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ------------------------------------------------------------ sesiuni */

const tokenId = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: tokenId(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, tokenId(token)));
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: { id: number; name: string; slug: string; vatCode: string | null; verified: boolean; phone: string | null };
};

/** Utilizatorul logat (o singură interogare pe cerere), sau null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      companyId: companies.id,
      companyName: companies.name,
      companySlug: companies.slug,
      vatCode: companies.vatCode,
      verifiedAt: companies.verifiedAt,
      companyPhone: companies.phone,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(and(eq(sessions.id, tokenId(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: { id: row.companyId, name: row.companyName, slug: row.companySlug, vatCode: row.vatCode, verified: row.verifiedAt != null, phone: row.companyPhone },
  };
});

/** Pentru pagini și acțiuni care cer cont: trimite la autentificare și revine apoi la `next`. */
export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/cont/autentificare?next=${encodeURIComponent(next)}`);
  return user;
}

/** Doar adrese interne, ca „next” să nu poată trimite în afara site-ului. */
export function safeNext(next: unknown, fallback = "/cont") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export const initials = (name: string) =>
  name
    .replace(/\b(SRL|SA|SRL-D|PFA|II|IF|SCS|SNC)\b\.?/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "MF";
