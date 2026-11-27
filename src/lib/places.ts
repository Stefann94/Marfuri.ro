import { and, asc, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cities, countries } from "@/db/schema";
import { memo } from "./memo";
import { normalize, slugify } from "./text";

/* Țările și localitățile vin din baza de date (tabelele countries și cities, încărcate din GeoNames). */

export type CountryItem = { code: string; name: string };
export type CityItem = { id: number; name: string; country: string; region: string | null };

/** Țările, în ordinea din bursă (România, apoi destinațiile populare, apoi restul). */
export function listCountries(): Promise<CountryItem[]> {
  return memo("countries", 3_600_000, () => db.select({ code: countries.code, name: countries.name }).from(countries).orderBy(asc(countries.sort), asc(countries.name)));
}

const cityCols = { id: cities.id, name: cities.name, country: cities.country, region: cities.region };

/**
 * Localitățile unei țări (sau din toate țările, dacă `country` lipsește).
 * Fără text: cele mai mari după populație. Cu text: întâi cele al căror nume începe cu textul, apoi cele care îl conțin.
 */
export function searchCities({ country, q = "", limit = 40 }: { country?: string; q?: string; limit?: number }): Promise<CityItem[]> {
  const n = normalize(q).replace(/[%_\\]/g, "");
  const w: (SQL | undefined)[] = [];
  if (country) w.push(eq(cities.country, country));
  if (n) w.push(sql`${cities.search} like ${`%${n}%`}`);
  const order: SQL[] = [desc(cities.population), asc(cities.name)];
  if (n) order.unshift(sql`case when ${cities.slug} like ${`${slugify(n)}%`} then 0 else 1 end`);
  return db
    .select(cityCols)
    .from(cities)
    .where(and(...w))
    .orderBy(...order)
    .limit(Math.min(80, limit));
}

/** Cea mai apropiată localitate (de cel puțin 3.000 de locuitori), pentru „Folosește locația mea”. */
export async function nearestCity(lat: number, lng: number): Promise<CityItem | null> {
  const k = Math.cos((lat * Math.PI) / 180);
  const [row] = await db
    .select(cityCols)
    .from(cities)
    .where(gte(cities.population, 3000))
    .orderBy(sql`power(${cities.lat} - ${lat}, 2) + power((${cities.lng} - ${lng}) * ${k}, 2)`)
    .limit(1);
  return row ?? null;
}

export type FeaturedCity = { name: string; slug: string; country: string; lat: number; lng: number };

/** Orașele cu pagină proprie (/orase/…), marcate în baza de date (cities.featured). */
export function featuredCities(): Promise<FeaturedCity[]> {
  return memo("cities:featured", 300_000, () =>
    db
      .select({ name: cities.name, slug: cities.slug, country: cities.country, lat: cities.lat, lng: cities.lng })
      .from(cities)
      .where(eq(cities.featured, true))
      .orderBy(desc(cities.population), asc(cities.name)),
  );
}

/** Orașul cu pagină proprie, după slug. */
export async function featuredCityBySlug(slug: string) {
  return (await featuredCities()).find((c) => c.slug === slug);
}

/** Găsește localitatea scrisă într-un formular (pentru coordonate), indiferent de diacritice; cea mai mare, dacă sunt mai multe. */
export async function findCityByName(country: string, name: string) {
  const slug = slugify(name);
  if (!slug) return undefined;
  const [row] = await db
    .select({ name: cities.name, slug: cities.slug, lat: cities.lat, lng: cities.lng })
    .from(cities)
    .where(and(eq(cities.country, country), eq(cities.slug, slug)))
    .orderBy(desc(cities.population))
    .limit(1);
  return row;
}
