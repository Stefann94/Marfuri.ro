import { and, asc, count, desc, eq, gte, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { companies, loads, trucks } from "@/db/schema";
import { memo } from "./memo";
import { countryByCode } from "./geo";
import { vehicleBySlug } from "./vehicles";
import { slugify } from "./text";

export const PAGE_SIZE = 25;

/* ------------------------------------------------------------------ filtre */

export type Filters = {
  from?: string;
  to?: string;
  fromCity?: string;
  toCity?: string;
  date?: string;
  /** Ultima zi din perioada aleasă (inclusiv); fără ea, „data” înseamnă „de la data X”. */
  dateTo?: string;
  vehicle?: string;
  /** Greutatea mărfii, în tone: marfă de cel mult atât / camion care duce cel puțin atât. */
  weight?: number;
  page: number;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const isoDate = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Citește și validează parametrii din URL (?din=RO&spre=DE&oras_din=…&data=…&pana=…&vehicul=…&tone=…&pagina=…). */
export function parseFilters(sp: SP): Filters {
  const from = countryByCode(one(sp.din))?.code;
  const to = countryByCode(one(sp.spre))?.code;
  const date = isoDate(one(sp.data));
  const dateTo = isoDate(one(sp.pana));
  const weight = Number.parseFloat((one(sp.tone) ?? "").replace(",", "."));
  const page = Math.min(200, Math.max(1, Number.parseInt(one(sp.pagina) ?? "1", 10) || 1));
  return {
    from,
    to,
    fromCity: one(sp.oras_din)?.slice(0, 60),
    toCity: one(sp.oras_spre)?.slice(0, 60),
    date,
    dateTo: date && dateTo && dateTo >= date ? dateTo : undefined,
    vehicle: vehicleBySlug(one(sp.vehicul))?.slug,
    weight: weight > 0 && weight <= 40 ? Math.round(weight * 10) / 10 : undefined,
    page,
  };
}

export function filtersToQuery(f: Filters, page?: number) {
  const p = new URLSearchParams();
  if (f.from) p.set("din", f.from);
  if (f.fromCity) p.set("oras_din", f.fromCity);
  if (f.to) p.set("spre", f.to);
  if (f.toCity) p.set("oras_spre", f.toCity);
  if (f.date) p.set("data", f.date);
  if (f.dateTo) p.set("pana", f.dateTo);
  if (f.vehicle) p.set("vehicul", f.vehicle);
  if (f.weight) p.set("tone", String(f.weight));
  if (page && page > 1) p.set("pagina", String(page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const hasFilters = (f: Filters) => Boolean(f.from || f.to || f.fromCity || f.toCity || f.date || f.vehicle || f.weight);

/* ------------------------------------------------------------------ marfă */

const activeLoad = () => and(eq(loads.status, "active"), gte(loads.loadDate, sql`current_date - 1`));

const companyCols = {
  companyName: companies.name,
  companySlug: companies.slug,
  companyVerified: sql<boolean>`${companies.verifiedAt} is not null`,
};

const loadListCols = {
  id: loads.id,
  fromCountry: loads.fromCountry,
  fromCity: loads.fromCity,
  toCountry: loads.toCountry,
  toCity: loads.toCity,
  loadDate: loads.loadDate,
  unloadDate: loads.unloadDate,
  vehicle: loads.vehicle,
  weightT: loads.weightT,
  ldm: loads.ldm,
  goods: loads.goods,
  price: loads.price,
  currency: loads.currency,
  ...companyCols,
};

export type LoadListItem = Awaited<ReturnType<typeof searchLoads>>["items"][number];

function loadWhere(f: Partial<Filters>) {
  const w: (SQL | undefined)[] = [activeLoad()];
  if (f.from) w.push(eq(loads.fromCountry, f.from));
  if (f.to) w.push(eq(loads.toCountry, f.to));
  if (f.fromCity) w.push(sql`${loads.fromCitySlug} like ${slugify(f.fromCity) + "%"}`);
  if (f.toCity) w.push(sql`${loads.toCitySlug} like ${slugify(f.toCity) + "%"}`);
  if (f.date) w.push(gte(loads.loadDate, f.date));
  if (f.date && f.dateTo) w.push(lte(loads.loadDate, f.dateTo));
  if (f.vehicle) w.push(eq(loads.vehicle, f.vehicle));
  // marfă care încape în camionul căutătorului
  if (f.weight) w.push(lte(loads.weightT, f.weight));
  return and(...w);
}

export async function searchLoads(f: Partial<Filters>, limit = PAGE_SIZE) {
  const where = loadWhere(f);
  const page = f.page ?? 1;
  const [items, [{ total }]] = await Promise.all([
    db
      .select(loadListCols)
      .from(loads)
      .innerJoin(companies, eq(companies.id, loads.companyId))
      .where(where)
      .orderBy(asc(loads.loadDate), desc(loads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(loads).where(where),
  ]);
  return { items, total };
}

export async function loadsForCity(citySlug: string, direction: "from" | "to", limit = 15) {
  return db
    .select(loadListCols)
    .from(loads)
    .innerJoin(companies, eq(companies.id, loads.companyId))
    .where(and(activeLoad(), eq(direction === "from" ? loads.fromCitySlug : loads.toCitySlug, citySlug)))
    .orderBy(asc(loads.loadDate), desc(loads.createdAt))
    .limit(limit);
}

export async function getLoad(id: number) {
  const [row] = await db
    .select({
      load: loads,
      company: { name: companies.name, slug: companies.slug, city: companies.city, country: companies.country, kind: companies.kind, verifiedAt: companies.verifiedAt, createdAt: companies.createdAt },
      isActive: sql<boolean>`${loads.status} = 'active' and ${loads.loadDate} >= current_date - 1`,
    })
    .from(loads)
    .innerJoin(companies, eq(companies.id, loads.companyId))
    .where(eq(loads.id, id))
    .limit(1);
  return row;
}

/* ------------------------------------------------------------------ camioane */

const activeTruck = () =>
  and(eq(trucks.status, "active"), or(gte(trucks.availableFrom, sql`current_date - 1`), gte(trucks.availableTo, sql`current_date`)));

const truckListCols = {
  id: trucks.id,
  fromCountry: trucks.fromCountry,
  fromCity: trucks.fromCity,
  toCountry: trucks.toCountry,
  toCity: trucks.toCity,
  availableFrom: trucks.availableFrom,
  availableTo: trucks.availableTo,
  vehicle: trucks.vehicle,
  capacityT: trucks.capacityT,
  ldm: trucks.ldm,
  ...companyCols,
};

export type TruckListItem = Awaited<ReturnType<typeof searchTrucks>>["items"][number];

function truckWhere(f: Partial<Filters>) {
  const w: (SQL | undefined)[] = [activeTruck()];
  if (f.from) w.push(eq(trucks.fromCountry, f.from));
  if (f.to) w.push(or(eq(trucks.toCountry, f.to), isNull(trucks.toCountry)));
  if (f.fromCity) w.push(sql`${trucks.fromCitySlug} like ${slugify(f.fromCity) + "%"}`);
  if (f.toCity) w.push(or(sql`${trucks.toCitySlug} like ${slugify(f.toCity) + "%"}`, isNull(trucks.toCitySlug)));
  if (f.date && f.dateTo) {
    // camioane libere măcar o zi din perioada aleasă
    w.push(sql`${trucks.availableFrom} <= ${f.dateTo}::date and coalesce(${trucks.availableTo}, ${trucks.availableFrom}) >= ${f.date}::date`);
  } else if (f.date) {
    // camioane disponibile cu cel mult 3 zile înainte/după data căutată
    w.push(sql`${trucks.availableFrom} between ${f.date}::date - 3 and ${f.date}::date + 3`);
  }
  if (f.vehicle) w.push(eq(trucks.vehicle, f.vehicle));
  // camioane care pot duce marfa (capacitatea necunoscută nu exclude camionul)
  if (f.weight) w.push(or(gte(trucks.capacityT, f.weight), isNull(trucks.capacityT)));
  return and(...w);
}

export async function searchTrucks(f: Partial<Filters>, limit = PAGE_SIZE) {
  const where = truckWhere(f);
  const page = f.page ?? 1;
  const order = f.date
    ? [sql`abs(${trucks.availableFrom} - ${f.date}::date)`, desc(trucks.createdAt)]
    : [asc(trucks.availableFrom), desc(trucks.createdAt)];
  const [items, [{ total }]] = await Promise.all([
    db
      .select(truckListCols)
      .from(trucks)
      .innerJoin(companies, eq(companies.id, trucks.companyId))
      .where(where)
      .orderBy(...order)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(trucks).where(where),
  ]);
  return { items, total };
}

export async function trucksInCity(citySlug: string, limit = 10) {
  return db
    .select(truckListCols)
    .from(trucks)
    .innerJoin(companies, eq(companies.id, trucks.companyId))
    .where(and(activeTruck(), eq(trucks.fromCitySlug, citySlug)))
    .orderBy(asc(trucks.availableFrom))
    .limit(limit);
}

export async function getTruck(id: number) {
  const [row] = await db
    .select({
      truck: trucks,
      company: { name: companies.name, slug: companies.slug, city: companies.city, country: companies.country, kind: companies.kind, verifiedAt: companies.verifiedAt, fleetSize: companies.fleetSize, createdAt: companies.createdAt },
      isActive: sql<boolean>`${trucks.status} = 'active' and (${trucks.availableFrom} >= current_date - 1 or ${trucks.availableTo} >= current_date)`,
    })
    .from(trucks)
    .innerJoin(companies, eq(companies.id, trucks.companyId))
    .where(eq(trucks.id, id))
    .limit(1);
  return row;
}

/* ------------------------------------------------------------------ statistici & SEO */

export function siteStats() {
  return memo("siteStats", 60_000, async () => {
    const [[l], [t], [c]] = await Promise.all([
      db.select({ n: count() }).from(loads).where(activeLoad()),
      db.select({ n: count() }).from(trucks).where(activeTruck()),
      db.select({ n: count(), verified: sql<number>`count(${companies.verifiedAt})::int` }).from(companies),
    ]);
    return { loads: l.n, trucks: t.n, companies: c.n, verified: c.verified };
  });
}

/** Ultimele mărfuri publicate, pentru banda „Bursă live” din navbar. */
export function latestLoads(limit = 14) {
  return memo(`latestLoads:${limit}`, 30_000, () =>
    db
      .select({
        id: loads.id,
        fromCountry: loads.fromCountry,
        fromCity: loads.fromCity,
        toCountry: loads.toCountry,
        toCity: loads.toCity,
        vehicle: loads.vehicle,
        weightT: loads.weightT,
        price: loads.price,
        currency: loads.currency,
        createdAt: loads.createdAt,
      })
      .from(loads)
      .where(activeLoad())
      .orderBy(desc(loads.createdAt))
      .limit(limit),
  );
}

export type TopCity = { name: string; country: string; n: number };
export type TopCities = { loadsFrom: TopCity[]; loadsTo: TopCity[]; trucksFrom: TopCity[]; trucksTo: TopCity[] };

/** Orașele cu cele mai multe oferte active (plecare / destinație), pentru ferestrele din căutarea de pe prima pagină. */
export function topCities(limit = 6): Promise<TopCities> {
  return memo(`topCities:${limit}`, 120_000, async () => {
    const top = (table: typeof loads | typeof trucks, active: SQL | undefined, dir: "from" | "to") => {
      const slug = dir === "from" ? table.fromCitySlug : table.toCitySlug;
      const city = dir === "from" ? table.fromCity : table.toCity;
      const country = dir === "from" ? table.fromCountry : table.toCountry;
      return db
        .select({ name: sql<string>`min(${city})`, country: sql<string>`min(${country})`, n: count() })
        .from(table)
        .where(and(active, sql`${slug} is not null`))
        .groupBy(slug)
        .orderBy(desc(count()))
        .limit(limit);
    };
    const [loadsFrom, loadsTo, trucksFrom, trucksTo] = await Promise.all([
      top(loads, activeLoad(), "from"),
      top(loads, activeLoad(), "to"),
      top(trucks, activeTruck(), "from"),
      top(trucks, activeTruck(), "to"),
    ]);
    return { loadsFrom, loadsTo, trucksFrom, trucksTo };
  });
}

export function topRoutes(limit = 12) {
  return memo(`topRoutes:${limit}`, 300_000, () =>
    db
      .select({ from: loads.fromCountry, to: loads.toCountry, n: count() })
      .from(loads)
      .where(activeLoad())
      .groupBy(loads.fromCountry, loads.toCountry)
      .orderBy(desc(count()))
      .limit(limit),
  );
}

export type RouteSupply = { from: string; to: string; loads: number; trucks: number };

/**
 * Traseele internaționale cu cele mai multe mărfuri, cu numărul de șoferi (camioane) liberi pe fiecare.
 * Camioanele se numără ca în căutare: plecare din țara traseului, spre țara traseului sau „orice destinație”.
 */
export function routeSupply(limit = 5): Promise<RouteSupply[]> {
  return memo(`routeSupply:${limit}`, 120_000, async () => {
    const [top, t] = await Promise.all([
      topRoutes(limit * 2),
      db
        .select({ from: trucks.fromCountry, to: trucks.toCountry, n: count() })
        .from(trucks)
        .where(activeTruck())
        .groupBy(trucks.fromCountry, trucks.toCountry),
    ]);
    const byPair = new Map(t.map((r) => [`${r.from}>${r.to ?? "*"}`, r.n]));
    return top
      .filter((r) => r.from !== r.to)
      .slice(0, limit)
      .map((r) => ({ from: r.from, to: r.to, loads: r.n, trucks: (byPair.get(`${r.from}>${r.to}`) ?? 0) + (byPair.get(`${r.from}>*`) ?? 0) }));
  });
}

/** Statistici pentru o pagină de rută: număr de oferte, preț median, vehicule frecvente. */
export async function routeStats(from: string, to: string) {
  const route = and(eq(loads.fromCountry, from), eq(loads.toCountry, to));
  const [[active], [prices], vehicles, [truckCount]] = await Promise.all([
    db.select({ n: count() }).from(loads).where(and(activeLoad(), route)),
    db
      .select({
        n: count(loads.price),
        median: sql<number | null>`percentile_cont(0.5) within group (order by ${loads.price})`,
        p25: sql<number | null>`percentile_cont(0.25) within group (order by ${loads.price})`,
        p75: sql<number | null>`percentile_cont(0.75) within group (order by ${loads.price})`,
      })
      .from(loads)
      .where(and(route, sql`${loads.price} is not null`, sql`${loads.vehicle} <> 'duba'`, gte(loads.createdAt, sql`now() - interval '90 days'`))),
    db
      .select({ vehicle: loads.vehicle, n: count() })
      .from(loads)
      .where(and(activeLoad(), route))
      .groupBy(loads.vehicle)
      .orderBy(desc(count()))
      .limit(4),
    db.select({ n: count() }).from(trucks).where(and(activeTruck(), eq(trucks.fromCountry, from), or(eq(trucks.toCountry, to), isNull(trucks.toCountry)))),
  ]);
  return {
    loads: active.n,
    trucks: truckCount.n,
    priceSamples: prices.n,
    median: prices.median == null ? null : Math.round(Number(prices.median) / 10) * 10,
    p25: prices.p25 == null ? null : Math.round(Number(prices.p25) / 10) * 10,
    p75: prices.p75 == null ? null : Math.round(Number(prices.p75) / 10) * 10,
    vehicles,
  };
}

/** Destinații (sau origini) cu oferte active pentru o țară. */
export async function countryRoutes(code: string, direction: "from" | "to") {
  const self = direction === "from" ? loads.fromCountry : loads.toCountry;
  const other = direction === "from" ? loads.toCountry : loads.fromCountry;
  return db
    .select({ country: other, n: count() })
    .from(loads)
    .where(and(activeLoad(), eq(self, code)))
    .groupBy(other)
    .orderBy(desc(count()));
}

/* ------------------------------------------------------------------ firme */

export async function getCompany(slug: string) {
  const [c] = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  if (!c) return undefined;
  const [companyLoads, companyTrucks] = await Promise.all([
    db.select(loadListCols).from(loads).innerJoin(companies, eq(companies.id, loads.companyId)).where(and(activeLoad(), eq(loads.companyId, c.id))).orderBy(asc(loads.loadDate)).limit(20),
    db.select(truckListCols).from(trucks).innerJoin(companies, eq(companies.id, trucks.companyId)).where(and(activeTruck(), eq(trucks.companyId, c.id))).orderBy(asc(trucks.availableFrom)).limit(20),
  ]);
  return { company: c, loads: companyLoads, trucks: companyTrucks };
}

/* ------------------------------------------------------------------ sitemap */

export function sitemapData() {
  return memo("sitemap", 3_600_000, async () => {
    const [loadIds, truckIds, firms, routes, fromCities, toCities] = await Promise.all([
      db.select({ id: loads.id, updatedAt: loads.updatedAt }).from(loads).where(activeLoad()).orderBy(desc(loads.createdAt)).limit(20000),
      db.select({ id: trucks.id, updatedAt: trucks.updatedAt }).from(trucks).where(activeTruck()).orderBy(desc(trucks.createdAt)).limit(10000),
      db.select({ slug: companies.slug, createdAt: companies.createdAt }).from(companies).limit(20000),
      db.selectDistinct({ from: loads.fromCountry, to: loads.toCountry }).from(loads).where(activeLoad()),
      db.selectDistinct({ slug: loads.fromCitySlug }).from(loads).where(activeLoad()),
      db.selectDistinct({ slug: loads.toCitySlug }).from(loads).where(activeLoad()),
    ]);
    const citySlugs = new Set([...fromCities, ...toCities].map((c) => c.slug));
    return { loadIds, truckIds, firms, routes, citySlugs };
  });
}

/** Catalogul de firme: întâi cele verificate, apoi cele cu cele mai multe oferte active. */
export type CompanyFilters = { q?: string; kind?: string; country?: string; city?: string; minFleet?: number; verified?: boolean; page: number };
export const COMPANIES_PAGE = 20;

/** Catalogul de firme, cu filtre; firmele verificate întâi. Cu numărul cererilor active ale fiecărei firme. */
export async function searchCompanies(f: CompanyFilters) {
  const w: (SQL | undefined)[] = [];
  const clean = (t: string) => t.replace(/[%_\\]/g, "");
  const q = clean(f.q?.trim() ?? "");
  if (q) {
    // după nume sau după cifrele codului fiscal (cu sau fără „RO”)
    const digits = q.replace(/[^0-9]/g, "");
    w.push(
      or(
        sql`${companies.name} ilike ${`%${q}%`}`,
        digits.length >= 2 ? sql`regexp_replace(coalesce(${companies.vatCode}, ''), '[^0-9]', '', 'g') like ${`${digits}%`}` : undefined,
      ),
    );
  }
  if (f.kind) w.push(eq(companies.kind, f.kind));
  if (f.country) w.push(eq(companies.country, f.country));
  if (f.city) w.push(sql`${companies.city} ilike ${clean(f.city)}`);
  if (f.minFleet) w.push(gte(companies.fleetSize, f.minFleet));
  if (f.verified) w.push(sql`${companies.verifiedAt} is not null`);
  const where = and(...w);
  const active = sql<number>`(
    (select count(*) from ${loads} where ${loads.companyId} = ${companies.id} and ${loads.status} = 'active')
    + (select count(*) from ${trucks} where ${trucks.companyId} = ${companies.id} and ${trucks.status} = 'active')
  )::int`;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        slug: companies.slug,
        name: companies.name,
        city: companies.city,
        country: companies.country,
        kind: companies.kind,
        vatCode: companies.vatCode,
        verified: sql<boolean>`${companies.verifiedAt} is not null`,
        fleetSize: companies.fleetSize,
        since: sql<number>`extract(year from ${companies.createdAt})::int`,
        active,
      })
      .from(companies)
      .where(where)
      .orderBy(sql`${companies.verifiedAt} is null`, companies.name)
      .limit(COMPANIES_PAGE)
      .offset((f.page - 1) * COMPANIES_PAGE),
    db.select({ total: count() }).from(companies).where(where),
  ]);
  return { items, total };
}
