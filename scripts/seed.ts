/**
 * Date demo pentru dezvoltare: firme, oferte de marfă și camioane libere.
 * Rulare: npm run db:seed   (ATENȚIE: șterge datele existente)
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { companies, loads, trucks } from "../src/db/schema.ts";
import { CITIES, COUNTRIES, haversineKm, type City } from "../src/lib/geo.ts";
import { VEHICLES } from "../src/lib/vehicles.ts";
import { slugify } from "../src/lib/text.ts";

if (process.env.NODE_ENV === "production") throw new Error("Seed-ul nu rulează în producție.");

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

// Generator determinist, ca datele să fie aceleași la fiecare rulare.
let s = 20261124;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const between = (a: number, b: number) => a + rnd() * (b - a);
const int = (a: number, b: number) => Math.floor(between(a, b + 1));

const today = new Date();
const isoIn = (days: number) => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + days));
  return d.toISOString().slice(0, 10);
};

const ro = CITIES.filter((c) => c.country === "RO");
const westWeights: Record<string, number> = { DE: 10, IT: 7, FR: 5, HU: 4, AT: 4, NL: 4, BE: 3, ES: 3, PL: 3, BG: 3, MD: 2, CZ: 2, GB: 1, SK: 1, SI: 1, HR: 1, RS: 1, GR: 1, TR: 1, CH: 1, DK: 1, SE: 1, PT: 1, UA: 1, LT: 1, LV: 1, EE: 1 };
const weighted: string[] = Object.entries(westWeights).flatMap(([c, w]) => Array(w).fill(c));
const foreignCity = () => pick(CITIES.filter((c) => c.country === pick(weighted)));

const prefixes = ["Trans", "Euro", "Cargo", "Rapid", "Delta", "Carpat", "Dacia", "Nord", "Vest", "Atlas", "Orion", "Mega", "Danubius", "Alpin", "Terra", "Unic", "Prima", "Auto", "Logis", "Stel"];
const suffixes = ["Logistic", "Trans", "Expres", "Freight", "Cargo", "Line", "Speed", "Rute", "Mobil", "Spedition"];
const goodsList = ["Paleți cu mobilă", "Materiale de construcții", "Produse alimentare ambalate", "Piese auto", "Electrocasnice", "Textile", "Băuturi", "Hârtie și carton", "Produse chimice ambalate (non-ADR)", "Fructe și legume", "Utilaje industriale", "Cherestea", "Profile metalice", "Bunuri de larg consum", "Ambalaje PET", "Gresie și faianță", "Îngrășăminte la saci", "Anvelope"];
const vehicleWeights: Record<string, number> = { prelata: 12, mega: 4, frigorific: 5, izoterm: 1, box: 2, jumbo: 1, platforma: 2, "trailer-jos": 1, basculanta: 2, cisterna: 1, container: 1, "auto-transportor": 1, duba: 4 };
const vehiclePool = Object.entries(vehicleWeights).flatMap(([v, w]) => Array(w).fill(v));

console.log("Șterg datele existente…");
await db.execute(sql`TRUNCATE loads, trucks, companies RESTART IDENTITY CASCADE`);

// --- Firme
const usedSlugs = new Set<string>();
const companyRows = [];
for (let i = 0; i < 70; i++) {
  let name = "";
  let slug = "";
  do {
    name = `${pick(prefixes)} ${pick(suffixes)} ${pick(["SRL", "SRL", "SRL", "SA"])}`;
    slug = slugify(name);
  } while (usedSlugs.has(slug));
  usedSlugs.add(slug);
  const city = rnd() < 0.85 ? pick(ro) : pick(CITIES.filter((c) => c.country === "MD"));
  const kind = rnd() < 0.6 ? "carrier" : rnd() < 0.6 ? "forwarder" : "shipper";
  companyRows.push({
    slug,
    name,
    vatCode: `RO${int(10000000, 49999999)}`,
    regNumber: `J${int(1, 52)}/${int(100, 9999)}/${int(2005, 2025)}`,
    kind,
    country: city.country,
    city: city.name,
    phone: `+40 7${int(20, 99)} ${int(100, 999)} ${int(100, 999)}`,
    email: `office@${slug.replace(/-/g, "")}.ro`,
    website: rnd() < 0.5 ? `https://www.${slug.replace(/-(srl|sa)$/, "")}.ro` : null,
    description:
      kind === "carrier"
        ? `Transportator cu experiență pe rutele ${city.name} – Europa de Vest. Flotă proprie, șoferi cu atestat, asigurare CMR.`
        : kind === "forwarder"
          ? `Casă de expediții cu sediul în ${city.name}. Organizăm transporturi complete și grupaje în toată Europa.`
          : `Producător și distribuitor din ${city.name}. Căutăm parteneri de transport pentru livrări regulate.`,
    fleetSize: kind === "carrier" ? int(1, 60) : null,
    verifiedAt: rnd() < 0.7 ? new Date(Date.now() - int(1, 400) * 86400000) : null,
    createdAt: new Date(Date.now() - int(10, 900) * 86400000),
  });
}
const inserted = await db.insert(companies).values(companyRows).returning({ id: companies.id, kind: companies.kind });
const shippers = inserted.filter((c) => c.kind !== "carrier").map((c) => c.id);
const carriers = inserted.filter((c) => c.kind !== "shipper").map((c) => c.id);
console.log(`✓ ${inserted.length} firme`);

// --- Oferte de marfă
function priceFor(a: City, b: City, vehicle: string, weight: number) {
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng) * 1.25 + 30;
  const perKm = vehicle === "duba" ? 0.55 : vehicle === "frigorific" ? 1.55 : 1.3;
  const fill = vehicle === "duba" ? 1 : Math.max(0.35, Math.min(1, weight / 24));
  return Math.round((km * perKm * fill * between(0.9, 1.15)) / 10) * 10;
}

const loadRows = [];
for (let i = 0; i < 1100; i++) {
  const r = rnd();
  let from: City, to: City;
  if (r < 0.42) [from, to] = [pick(ro), foreignCity()];
  else if (r < 0.82) [from, to] = [foreignCity(), pick(ro)];
  else if (r < 0.95) {
    from = pick(ro);
    do to = pick(ro); while (to.slug === from.slug);
  } else {
    from = foreignCity();
    do to = foreignCity(); while (to.country === from.country);
  }
  const vehicle = pick(vehiclePool);
  const weight = vehicle === "duba" ? Math.round(between(0.3, 1.2) * 10) / 10 : Math.round(between(2, 24));
  const loadIn = int(-1, 14);
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  loadRows.push({
    companyId: pick(shippers),
    fromCountry: from.country, fromCity: from.name, fromCitySlug: from.slug, fromLat: from.lat, fromLng: from.lng,
    toCountry: to.country, toCity: to.name, toCitySlug: to.slug, toLat: to.lat, toLng: to.lng,
    loadDate: isoIn(loadIn),
    unloadDate: isoIn(loadIn + Math.max(1, Math.ceil(km / 650))),
    vehicle,
    weightT: weight,
    ldm: vehicle === "duba" ? null : Math.min(13.6, Math.round((weight / 24) * 13.6 * 10) / 10 || 1),
    volumeM3: rnd() < 0.3 ? int(10, 90) : null,
    goods: pick(goodsList),
    price: rnd() < 0.62 ? priceFor(from, to, vehicle, weight) : null,
    currency: "EUR",
    notes: rnd() < 0.4 ? pick(["Încărcare laterală.", "Necesită chingi și coltare.", "Plata la 30 de zile de la primirea documentelor.", "Descărcare cu macara la destinatar.", "Marfa este paletizată, 33 europaleți.", "Temperatură controlată +2/+6 °C."]) : null,
    createdAt: new Date(Date.now() - int(5, 4 * 86400) * 1000),
  });
}
for (let i = 0; i < loadRows.length; i += 250) await db.insert(loads).values(loadRows.slice(i, i + 250));
console.log(`✓ ${loadRows.length} oferte de marfă`);

// --- Camioane libere
const truckRows = [];
for (let i = 0; i < 450; i++) {
  const r = rnd();
  const from = r < 0.6 ? foreignCity() : pick(ro);
  const anyDest = rnd() < 0.3;
  const to = anyDest ? null : from.country === "RO" ? (rnd() < 0.7 ? foreignCity() : pick(ro)) : rnd() < 0.85 ? pick(ro) : foreignCity();
  const vehicle = pick(vehiclePool);
  const availIn = int(-1, 10);
  truckRows.push({
    companyId: pick(carriers),
    fromCountry: from.country, fromCity: from.name, fromCitySlug: from.slug, fromLat: from.lat, fromLng: from.lng,
    toCountry: to?.country ?? null, toCity: to?.name ?? null, toCitySlug: to?.slug ?? null,
    availableFrom: isoIn(availIn),
    availableTo: rnd() < 0.5 ? isoIn(availIn + int(1, 4)) : null,
    vehicle,
    capacityT: vehicle === "duba" ? 1.2 : pick([22, 24, 24, 24, 25]),
    ldm: vehicle === "duba" ? null : 13.6,
    notes: rnd() < 0.35 ? pick(["Camion cu GPS, CMR 100.000 €.", "Disponibil și pentru grupaje.", "Șofer cu ADR.", "Prelată cu lift.", "Preferabil retur spre Moldova."]) : null,
    createdAt: new Date(Date.now() - int(5, 3 * 86400) * 1000),
  });
}
for (let i = 0; i < truckRows.length; i += 250) await db.insert(trucks).values(truckRows.slice(i, i + 250));
console.log(`✓ ${truckRows.length} camioane libere`);

await client.end();
console.log(`Gata. Țări în nomenclator: ${COUNTRIES.length}, orașe: ${CITIES.length}, vehicule: ${VEHICLES.length}.`);
