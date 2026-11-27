/**
 * Încarcă țările și localitățile în baza de date (tabelele countries și cities), din GeoNames (licență CC-BY 4.0).
 *
 * Fișiere necesare în data/geonames/ (folderul data/ nu se urcă pe GitHub):
 *   https://download.geonames.org/export/dump/cities1000.zip  (dezarhivat → cities1000.txt)
 *   https://download.geonames.org/export/dump/admin1CodesASCII.txt
 *
 * Rulare: node --env-file=.env.local scripts/import-geonames.ts   (sau --env-file=.env.supabase)
 * Păstrăm: toate localitățile din România cu cel puțin 1.000 de locuitori și orașele din celelalte țări
 * cu cel puțin 15.000. Orașele din nomenclatorul vechi (geo.ts) își păstrează numele românesc (București, Viena…).
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { CITIES_RAW, COUNTRIES as COUNTRY_ROWS, POPULAR as POPULAR_DESTINATIONS } from "./data/nomenclatoare.ts";
import { normalize, slugify } from "../src/lib/text.ts";

const COUNTRIES = COUNTRY_ROWS.map(([code, name]) => ({ code, name, slug: slugify(name) }));
const CITIES = CITIES_RAW.map(([country, name, lat, lng]) => ({ country, name, slug: slugify(name), lat, lng }));

const MIN_RO = 1000;
const MIN_OTHER = 15000;
const SKIP_CODES = new Set(["PPLX", "PPLH", "PPLQ", "PPLW", "PPLCH"]);
const codes = new Set(COUNTRIES.map((c) => c.code));

/** GeoNames scrie încă ş/ţ cu sedilă; în română corect e cu virgulă. */
const ro = (s: string) => s.replace(/ş/g, "ș").replace(/Ş/g, "Ș").replace(/ţ/g, "ț").replace(/Ţ/g, "Ț");
const latin = /^[\p{Script=Latin}\s\-'.’()]+$/u;

// Regiunile (județe, landuri…), fără „County” / „Județul”.
const regions = new Map<string, string>();
for (const line of readFileSync("data/geonames/admin1CodesASCII.txt", "utf8").split("\n")) {
  const [key, name] = line.split("\t");
  if (!key || !name) continue;
  regions.set(key, ro(name).replace(/\s+County$/i, "").replace(/^Județul\s+/i, "").replace(/^Municipiul\s+/i, "").replace(/^Bucharest$/, "București").trim());
}

type Row = { id: number; country: string; name: string; slug: string; region: string | null; lat: number; lng: number; population: number; search: string };
const rows: Row[] = [];
for (const line of readFileSync("data/geonames/cities1000.txt", "utf8").split("\n")) {
  const f = line.split("\t");
  if (f.length < 15) continue;
  const country = f[8];
  if (!codes.has(country) || SKIP_CODES.has(f[7])) continue;
  const population = Number(f[14]) || 0;
  if (population < (country === "RO" ? MIN_RO : MIN_OTHER)) continue;
  const name = ro(f[1]);
  const variants = [name, f[2], ...f[3].split(",")].filter((v) => v && latin.test(v)).map(normalize);
  rows.push({
    id: Number(f[0]),
    country,
    name,
    slug: slugify(name),
    region: regions.get(`${country}.${f[10]}`) ?? null,
    lat: Number(f[4]),
    lng: Number(f[5]),
    population,
    search: [...new Set(variants)].join(" ").slice(0, 900),
  });
}

// Orașele din nomenclatorul vechi: numele românesc, pe localitatea cea mai apropiată (sub 25 km) din aceeași țară.
const km = (a: number, b: number, c: number, d: number) => {
  const r = Math.PI / 180;
  const x = (d - b) * r * Math.cos(((a + c) / 2) * r);
  const y = (c - a) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};
let renamed = 0;
let added = 0;
CITIES.forEach((c, i) => {
  let best: Row | undefined;
  let bestKm = 25;
  for (const r of rows) {
    if (r.country !== c.country) continue;
    const d = km(c.lat, c.lng, r.lat, r.lng);
    if (d < bestKm || (best && d < bestKm + 3 && r.population > best.population * 5)) [best, bestKm] = [r, Math.min(d, bestKm)];
  }
  if (best) {
    if (best.name !== c.name) {
      best.search = `${normalize(c.name)} ${best.search}`.slice(0, 900);
      best.name = c.name;
      best.slug = c.slug;
      renamed++;
    }
  } else {
    rows.push({ id: -(i + 1), country: c.country, name: c.name, slug: c.slug, region: null, lat: c.lat, lng: c.lng, population: 0, search: normalize(c.name) });
    added++;
  }
});

const order = ["RO", ...POPULAR_DESTINATIONS];
const countryRows = COUNTRIES.map((c) => ({ code: c.code, name: c.name, slug: c.slug, sort: order.includes(c.code) ? order.indexOf(c.code) : 50 }));

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
await sql.begin(async (tx) => {
  for (const c of countryRows) {
    await tx`insert into countries ${tx(c)} on conflict (code) do update set name = excluded.name, slug = excluded.slug, sort = excluded.sort`;
  }
  await tx`delete from cities`;
  for (let i = 0; i < rows.length; i += 1000) await tx`insert into cities ${tx(rows.slice(i, i + 1000))}`;
});
const [{ n }] = await sql`select count(*)::int as n from cities`;
await sql.end();
console.log(`✓ ${countryRows.length} țări, ${n} localități (${renamed} redenumite în română, ${added} adăugate din nomenclatorul vechi)`);
