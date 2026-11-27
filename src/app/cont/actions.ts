"use server";

import { redirect } from "next/navigation";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, users } from "@/db/schema";
import { cleanCui, lookupAnaf, validCui, type AnafCompany } from "@/lib/anaf";
import { createSession, destroySession, hashPassword, safeNext, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/text";

export type FormState = { error?: string; values?: Record<string, string> };

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const phoneOk = (p: string) => p.replace(/\D/g, "").length >= 9;

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("parola") ?? "");
  const next = safeNext(fd.get("next"));
  const values = { email };
  if (!email || !password) return { error: "Scrie adresa de e-mail și parola.", values };
  const [u] = await db.select({ id: users.id, hash: users.passwordHash }).from(users).where(eq(users.email, email)).limit(1);
  if (!u || !(await verifyPassword(password, u.hash))) return { error: "E-mailul sau parola nu sunt corecte.", values };
  await createSession(u.id);
  redirect(next);
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const cui = cleanCui(str(fd, "cui", 20));
  const typedCompany = str(fd, "firma", 160);
  const name = str(fd, "nume", 120);
  const phone = str(fd, "telefon", 40);
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("parola") ?? "");
  const next = safeNext(fd.get("next"));
  const values = { cui, firma: typedCompany, nume: name, telefon: phone, email };

  if (!validCui(cui)) return { error: "CUI-ul nu pare corect. Verifică cifrele (fără „RO”).", values };
  if (name.length < 3) return { error: "Scrie numele tău (persoana de contact).", values };
  if (!phoneOk(phone)) return { error: "Scrie un număr de telefon la care te pot suna transportatorii.", values };
  if (!emailOk(email)) return { error: "Adresa de e-mail nu pare corectă.", values };
  if (password.length < 8) return { error: "Parola trebuie să aibă cel puțin 8 caractere.", values };

  // Firma: întâi ANAF; dacă ANAF nu răspunde, acceptăm numele scris de mână (firma rămâne neverificată).
  let anaf: AnafCompany | null = null;
  let anafDown = false;
  try {
    anaf = await lookupAnaf(cui);
    if (!anaf) return { error: "Nu am găsit acest CUI la ANAF. Verifică cifrele.", values };
  } catch {
    anafDown = true;
  }
  const companyName = anaf?.name || typedCompany;
  if (!companyName) return { error: "Scrie numele firmei.", values };

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) return { error: "Există deja un cont cu acest e-mail. Intră în cont.", values };

  // O firmă există deja în bursă (după CUI)? Dacă are deja cont, nu o poate prelua altcineva.
  const [company] = await db.select({ id: companies.id }).from(companies).where(inArray(companies.vatCode, [cui, `RO${cui}`])).limit(1);
  const [{ n: companyUsers }] = company ? await db.select({ n: count() }).from(users).where(eq(users.companyId, company.id)) : [{ n: 0 }];
  if (companyUsers > 0) {
    return { error: "Firma aceasta are deja cont. Intră cu contul existent sau cere acces colegului care l-a creat.", values };
  }

  const verifiedAt = anaf?.active ? new Date() : null;
  let companyId = company?.id;
  if (companyId) {
    await db.update(companies).set({ name: companyName, verifiedAt, phone }).where(eq(companies.id, companyId));
  } else {
    let slug = slugify(companyName) || `firma-${cui}`;
    const [taken] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug)).limit(1);
    if (taken) slug = `${slug}-${cui}`;
    const [c] = await db
      .insert(companies)
      .values({
        slug,
        name: companyName,
        vatCode: anaf?.vatPayer ? `RO${cui}` : cui,
        regNumber: anaf?.regNumber || null,
        kind: "carrier",
        country: "RO",
        city: anaf?.city || "—",
        address: anaf?.address || null,
        phone,
        email,
        verifiedAt,
      })
      .returning({ id: companies.id });
    companyId = c.id;
  }

  const [u] = await db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password), name, phone, companyId })
    .returning({ id: users.id });
  await createSession(u.id);
  redirect(anafDown ? `${next}${next.includes("?") ? "&" : "?"}anaf=neverificat` : next);
}

export async function logout() {
  await destroySession();
  redirect("/");
}
