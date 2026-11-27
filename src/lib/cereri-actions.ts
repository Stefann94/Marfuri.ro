"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { companies, loads, trucks } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { getRef } from "./ref";
import { findCityByName } from "./places";
import { slugify } from "./text";

export type PublishState = { error?: string };
export type AcceptState = { ok?: boolean; error?: string; login?: boolean; contact?: { company: string; name: string | null; phone: string | null } };

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string) => {
  const n = Number.parseFloat(str(fd, k, 20).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};
const isoDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Orașul din formular → nume, slug și coordonate (dacă e în nomenclatorul din baza de date). */
async function place(fd: FormData, cityKey: string, countryKey: string) {
  const name = str(fd, cityKey, 80);
  const country = (await getRef()).countryByCode(str(fd, countryKey, 2))?.code;
  if (!name || !country) return null;
  const known = await findCityByName(country, name);
  return { country, city: known?.name ?? name, slug: known?.slug ?? slugify(name), lat: known?.lat ?? null, lng: known?.lng ?? null };
}

/** Temporar, fără obligația de cont: cine nu e logat publică și acceptă ca firma „Vizitator”. */
const GUEST_SLUG = "vizitator-fara-cont";
async function actor() {
  const user = await getCurrentUser();
  if (user) return { guest: false, userId: user.id as number | null, companyId: user.company.id, name: user.name, phone: user.phone };
  let [co] = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, GUEST_SLUG));
  if (!co) {
    [co] = await db
      .insert(companies)
      .values({ slug: GUEST_SLUG, name: "Vizitator (fără cont)", kind: "shipper", country: "RO", city: "București" })
      .onConflictDoUpdate({ target: companies.slug, set: { slug: GUEST_SLUG } })
      .returning({ id: companies.id });
  }
  return { guest: true, userId: null as number | null, companyId: co.id, name: "", phone: "" };
}

/* ------------------------------------------------------------ Caută camion (marfă nouă) */

export async function publishLoad(_: PublishState, fd: FormData): Promise<PublishState> {
  const user = await actor();

  const from = await place(fd, "din_oras", "din_tara");
  const to = await place(fd, "spre_oras", "spre_tara");
  if (!from) return { error: "Scrie orașul de unde se încarcă marfa." };
  if (!to) return { error: "Scrie orașul unde trebuie să ajungă marfa." };
  const loadDate = isoDate(str(fd, "data", 10));
  if (!loadDate) return { error: "Alege data încărcării." };
  if (loadDate < todayISO()) return { error: "Data încărcării nu poate fi în trecut." };
  const unloadDate = isoDate(str(fd, "descarcare", 10));
  const goods = str(fd, "marfa", 160);
  if (!goods) return { error: "Scrie pe scurt ce marfă transporți." };
  const weightT = num(fd, "tone");
  if (!weightT || weightT > 40) return { error: "Scrie greutatea mărfii, în tone (cel mult 40)." };
  const ref = await getRef();
  const vehicles = fd.getAll("vehicul").map(String).filter((v) => ref.vehicleBySlug(v));
  const vehicle = vehicles[0] ?? "prelata";
  const askOffers = str(fd, "pret_mod", 10) === "oferte";
  const price = askOffers ? null : num(fd, "pret");
  if (!askOffers && !price) return { error: "Scrie prețul oferit sau alege „Aștept oferte”." };
  const contactName = str(fd, "contact_nume", 120) || user.name;
  const contactPhone = str(fd, "contact_tel", 40) || user.phone;
  if (user.guest && (!contactName || !contactPhone)) return { error: "Scrie persoana de contact și telefonul, ca să te poată suna cine acceptă." };

  const extra = [
    str(fd, "adresa_inc", 160) && `Încărcare: ${str(fd, "adresa_inc", 160)}`,
    str(fd, "adresa_desc", 160) && `Descărcare: ${str(fd, "adresa_desc", 160)}`,
    str(fd, "ora", 40) && `Interval orar: ${str(fd, "ora", 40)}`,
    fd.get("flexibil") && "Data e flexibilă (± 1 zi)",
    vehicles.length > 1 && `Accept și: ${vehicles.slice(1).map(ref.vehicleShort).join(", ")}`,
    fd.getAll("incarcare").length > 0 && `Încărcare: ${fd.getAll("incarcare").map(String).join(", ")}`,
    num(fd, "paleti") && `${num(fd, "paleti")} paleți`,
    fd.get("stivuibil") && "Marfa se poate stivui",
    fd.get("adr") && "Marfă periculoasă (ADR)",
    fd.get("temp") && "Temperatură controlată",
    !askOffers && str(fd, "plata", 40) && `Plata: ${str(fd, "plata", 40)}`,
    !askOffers && str(fd, "factura", 40) && `Factură: ${str(fd, "factura", 40)}`,
    str(fd, "detalii", 1000),
  ].filter(Boolean);

  const [row] = await db
    .insert(loads)
    .values({
      companyId: user.companyId,
      createdBy: user.userId,
      fromCountry: from.country,
      fromCity: from.city,
      fromCitySlug: from.slug,
      fromLat: from.lat,
      fromLng: from.lng,
      toCountry: to.country,
      toCity: to.city,
      toCitySlug: to.slug,
      toLat: to.lat,
      toLng: to.lng,
      loadDate,
      unloadDate: unloadDate && unloadDate >= loadDate ? unloadDate : null,
      vehicle,
      weightT,
      ldm: num(fd, "lungime"),
      goods,
      price: price ? Math.round(price) : null,
      notes: extra.join("\n") || null,
      contactName,
      contactPhone,
    })
    .returning({ id: loads.id });
  revalidatePath("/am-camion-liber");
  revalidatePath("/cont");
  redirect(`/am-camion-liber?nou=${row.id}#c${row.id}`);
}

/* ------------------------------------------------------------ Caută marfă (camion liber) */

export async function publishTruck(_: PublishState, fd: FormData): Promise<PublishState> {
  const user = await actor();

  const from = await place(fd, "din_oras", "din_tara");
  if (!from) return { error: "Scrie orașul în care e camionul." };
  const anywhere = str(fd, "dest_mod", 10) === "oriunde";
  const ref = await getRef();
  const toCountry = anywhere ? null : ref.countryByCode(str(fd, "spre_tara", 2))?.code ?? null;
  const toCityName = anywhere ? "" : str(fd, "spre_oras", 80);
  const toKnown = toCountry && toCityName ? await findCityByName(toCountry, toCityName) : undefined;
  const availableFrom = isoDate(str(fd, "liber_de", 10));
  if (!availableFrom) return { error: "Alege data de la care e liber camionul." };
  if (availableFrom < todayISO()) return { error: "Data nu poate fi în trecut." };
  const availableTo = isoDate(str(fd, "liber_pana", 10));
  const vehicle = ref.vehicleBySlug(str(fd, "vehicul", 30))?.slug;
  if (!vehicle) return { error: "Alege tipul camionului." };
  const capacityT = num(fd, "capacitate");
  if (!capacityT || capacityT > 40) return { error: "Scrie capacitatea camionului, în tone (cel mult 40)." };
  if (user.guest && (!str(fd, "contact_nume", 120) || !str(fd, "contact_tel", 40)))
    return { error: "Scrie numele și telefonul, ca să te poată suna cine acceptă." };

  const extra = [
    num(fd, "distanta") && `Merge până la ${num(fd, "distanta")} km pentru încărcare`,
    num(fd, "volum") && `Volum: ${num(fd, "volum")} m³`,
    str(fd, "nr", 20) && `Nr. înmatriculare: ${str(fd, "nr", 20)}`,
    fd.getAll("echipament").length > 0 && `Echipamente: ${fd.getAll("echipament").map(String).join(", ")}`,
    num(fd, "pret_km") && `Preț dorit: ${str(fd, "pret_km", 10)} €/km`,
    num(fd, "pret_cursa") && `Preț dorit pe cursă: ${str(fd, "pret_cursa", 10)} €`,
    str(fd, "detalii", 1000),
  ].filter(Boolean);

  const [row] = await db
    .insert(trucks)
    .values({
      companyId: user.companyId,
      createdBy: user.userId,
      fromCountry: from.country,
      fromCity: from.city,
      fromCitySlug: from.slug,
      fromLat: from.lat,
      fromLng: from.lng,
      toCountry,
      toCity: toCountry ? (toKnown?.name ?? (toCityName || null)) : null,
      toCitySlug: toCountry ? (toKnown?.slug ?? (toCityName ? slugify(toCityName) : null)) : null,
      availableFrom,
      availableTo: availableTo && availableTo >= availableFrom ? availableTo : null,
      vehicle,
      capacityT,
      ldm: num(fd, "lungime"),
      notes: extra.join("\n") || null,
      contactName: str(fd, "contact_nume", 120) || user.name,
      contactPhone: str(fd, "contact_tel", 40) || user.phone,
    })
    .returning({ id: trucks.id });
  revalidatePath("/am-marfa");
  revalidatePath("/cont");
  redirect(`/am-marfa?nou=${row.id}#c${row.id}`);
}

/* ------------------------------------------------------------ acceptare */

/** Pentru vizitatori: contactul lor intră în nota acceptării (false = lipsește). */
function guestContact(user: { guest: boolean }, fd: FormData): string | false {
  if (!user.guest) return "";
  const name = str(fd, "contact_nume", 120);
  const phone = str(fd, "contact_tel", 40);
  return name && phone ? ` · Contact: ${name}, ${phone}` : false;
}

export async function acceptLoad(id: number, _: AcceptState, fd: FormData): Promise<AcceptState> {
  const user = await actor();
  const truck = str(fd, "camion", 160);
  if (!truck) return { error: "Scrie cu ce camion faci cursa." };
  if (!fd.get("disponibil")) return { error: "Confirmă că ai camionul disponibil la data încărcării." };
  const price = num(fd, "pret");
  const guest = guestContact(user, fd);
  if (guest === false) return { error: "Scrie numele și telefonul tău." };

  const [row] = await db
    .update(loads)
    .set({
      status: "accepted",
      acceptedByCompanyId: user.companyId,
      acceptedByUserId: user.userId,
      acceptedAt: new Date(),
      acceptNote: truck + guest,
      acceptPrice: price ? Math.round(price) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(loads.id, id), eq(loads.status, "active"), ...(user.guest ? [] : [ne(loads.companyId, user.companyId)])))
    .returning({ companyId: loads.companyId, contactName: loads.contactName, contactPhone: loads.contactPhone });
  if (!row) return { error: "Cererea nu mai e disponibilă: a acceptat-o deja altcineva sau e chiar cererea ta." };
  const [co] = await db.select({ name: companies.name, phone: companies.phone }).from(companies).where(eq(companies.id, row.companyId));
  // fără revalidatePath: lista s-ar reîncărca și ar scoate cardul (cu fereastra) înainte să vezi telefonul
  return { ok: true, contact: { company: co?.name ?? "", name: row.contactName, phone: row.contactPhone ?? co?.phone ?? null } };
}

export async function acceptTruck(id: number, _: AcceptState, fd: FormData): Promise<AcceptState> {
  const user = await actor();
  const choice = str(fd, "marfa_id", 20);
  let note = str(fd, "marfa", 300);
  if (choice && choice !== "nou") {
    const [l] = await db
      .select({ fromCity: loads.fromCity, toCity: loads.toCity, loadDate: loads.loadDate, weightT: loads.weightT, goods: loads.goods })
      .from(loads)
      .where(and(eq(loads.id, Number(choice)), eq(loads.companyId, user.companyId)));
    if (l) note = `${l.fromCity} → ${l.toCity}, ${l.loadDate}${l.weightT ? `, ${l.weightT} t` : ""}${l.goods ? `, ${l.goods}` : ""}${note ? `. ${note}` : ""}`;
  }
  if (!note) return { error: "Descrie pe scurt marfa pe care i-o trimiți (rută, dată, greutate)." };
  const price = num(fd, "pret");
  const guest = guestContact(user, fd);
  if (guest === false) return { error: "Scrie numele și telefonul tău." };

  const [row] = await db
    .update(trucks)
    .set({
      status: "accepted",
      acceptedByCompanyId: user.companyId,
      acceptedByUserId: user.userId,
      acceptedAt: new Date(),
      acceptNote: note + guest,
      acceptPrice: price ? Math.round(price) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(trucks.id, id), eq(trucks.status, "active"), ...(user.guest ? [] : [ne(trucks.companyId, user.companyId)])))
    .returning({ companyId: trucks.companyId, contactName: trucks.contactName, contactPhone: trucks.contactPhone });
  if (!row) return { error: "Camionul nu mai e disponibil: l-a acceptat deja altcineva sau e chiar camionul tău." };
  const [co] = await db.select({ name: companies.name, phone: companies.phone }).from(companies).where(eq(companies.id, row.companyId));
  // fără revalidatePath: lista s-ar reîncărca și ar scoate cardul (cu fereastra) înainte să vezi telefonul
  return { ok: true, contact: { company: co?.name ?? "", name: row.contactName, phone: row.contactPhone ?? co?.phone ?? null } };
}

/** Închide o cerere proprie (nu mai apare în liste). */
export async function closeOwn(kind: "load" | "truck", id: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/cont/autentificare?next=/cont");
  const t = kind === "load" ? loads : trucks;
  await db.update(t).set({ status: "closed", updatedAt: new Date() }).where(and(eq(t.id, id), eq(t.companyId, user.company.id), eq(t.status, "active")));
  revalidatePath("/cont");
  revalidatePath(kind === "load" ? "/am-camion-liber" : "/am-marfa");
}

