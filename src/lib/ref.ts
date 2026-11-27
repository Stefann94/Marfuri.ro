import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companyKinds, countries, faqs, vehicleTypes, weightClasses } from "@/db/schema";
import { memo } from "./memo";

/*
 * Nomenclatoarele site-ului, citite din baza de date (Supabase): țări, tipuri de camion,
 * trepte de greutate, tipuri de firmă. Se țin în memorie 5 minute, ca paginile să nu le
 * ceară la fiecare afișare; o modificare în Supabase apare pe site în cel mult 5 minute.
 */

export type RefCountry = { code: string; name: string; slug: string; popular: boolean; eu: boolean };
export type RefVehicle = { slug: string; label: string; short: string; title: string; description: string; common: boolean };
export type RefWeight = { tons: number | null; name: string; sub: string; fill: number };
export type RefKind = { code: string; label: string };

async function load() {
  const [c, v, w, k] = await Promise.all([
    db
      .select({ code: countries.code, name: countries.name, slug: countries.slug, popular: countries.popular, eu: countries.eu })
      .from(countries)
      .orderBy(asc(countries.sort), asc(countries.name)),
    db
      .select({
        slug: vehicleTypes.slug,
        label: vehicleTypes.label,
        short: vehicleTypes.short,
        title: vehicleTypes.title,
        description: vehicleTypes.description,
        common: vehicleTypes.common,
      })
      .from(vehicleTypes)
      .orderBy(asc(vehicleTypes.sort), asc(vehicleTypes.slug)),
    db.select({ tons: weightClasses.tons, name: weightClasses.name, sub: weightClasses.sub, fill: weightClasses.fill }).from(weightClasses).orderBy(asc(weightClasses.sort)),
    db.select({ code: companyKinds.code, label: companyKinds.label }).from(companyKinds).orderBy(asc(companyKinds.sort)),
  ]);
  return build(c, v, w, k);
}

function build(countryList: RefCountry[], vehicles: RefVehicle[], weights: RefWeight[], kinds: RefKind[]) {
  const byCode = new Map(countryList.map((c) => [c.code, c]));
  const bySlug = new Map(countryList.map((c) => [c.slug, c]));
  const vBySlug = new Map(vehicles.map((v) => [v.slug, v]));
  const kByCode = new Map(kinds.map((k) => [k.code, k]));
  /** destinațiile populare, în ordinea din nomenclator */
  const popular = countryList.filter((c) => c.popular).map((c) => c.code);

  const countryByCode = (code: string | null | undefined) => (code ? byCode.get(code.toUpperCase()) : undefined);
  const slugOf = (code: string) => byCode.get(code)?.slug ?? code.toLowerCase();

  return {
    countries: countryList,
    vehicles,
    weights,
    kinds,
    popular,
    countryByCode,
    countryBySlug: (slug: string) => bySlug.get(slug),
    countryName: (code: string | null | undefined) => countryByCode(code)?.name ?? code ?? "",
    isEU: (code: string) => !!byCode.get(code)?.eu,
    /** rutele populare sunt mereu indexabile, chiar dacă momentan nu au oferte */
    isPopularRoute: (from: string, to: string) =>
      (from === "RO" && (to === "RO" || popular.includes(to))) || (to === "RO" && popular.includes(from)),
    routePath: (from: string, to: string) => `/transport-marfa/${slugOf(from)}/${slugOf(to)}`,
    countryPath: (code: string) => `/transport-marfa/${slugOf(code)}`,
    vehicleBySlug: (slug: string | null | undefined) => (slug ? vBySlug.get(slug) : undefined),
    vehicleShort: (slug: string) => vBySlug.get(slug)?.short ?? slug,
    vehicleLabel: (slug: string) => vBySlug.get(slug)?.label ?? slug,
    kindLabel: (code: string) => kByCode.get(code)?.label ?? code,
  };
}

export type Ref = Awaited<ReturnType<typeof load>>;

/** Nomenclatoarele (o singură citire pe cerere, ținute în memorie 5 minute). */
export const getRef = cache((): Promise<Ref> => memo("ref", 300_000, load));

/** Întrebările frecvente ale unei pagini. */
export const getFaqs = cache((page: string) =>
  memo(`faqs:${page}`, 300_000, () =>
    db.select({ q: faqs.question, a: faqs.answer }).from(faqs).where(eq(faqs.page, page)).orderBy(asc(faqs.sort), asc(faqs.id)),
  ),
);
