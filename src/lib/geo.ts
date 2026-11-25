import { slugify, normalize } from "./text.ts";

export type Country = { code: string; slug: string; name: string };
export type City = { name: string; slug: string; country: string; lat: number; lng: number };

const C = (code: string, name: string): Country => ({ code, name, slug: slugify(name) });

/** Ordinea contează: e folosită în meniuri și formulare. */
export const COUNTRIES: Country[] = [
  C("RO", "România"),
  C("MD", "Republica Moldova"),
  C("DE", "Germania"),
  C("IT", "Italia"),
  C("FR", "Franța"),
  C("HU", "Ungaria"),
  C("AT", "Austria"),
  C("NL", "Olanda"),
  C("BE", "Belgia"),
  C("ES", "Spania"),
  C("PL", "Polonia"),
  C("BG", "Bulgaria"),
  C("CZ", "Cehia"),
  C("SK", "Slovacia"),
  C("SI", "Slovenia"),
  C("HR", "Croația"),
  C("RS", "Serbia"),
  C("GR", "Grecia"),
  C("TR", "Turcia"),
  C("UA", "Ucraina"),
  C("GB", "Marea Britanie"),
  C("CH", "Elveția"),
  C("DK", "Danemarca"),
  C("SE", "Suedia"),
  C("PT", "Portugalia"),
  C("LT", "Lituania"),
  C("LV", "Letonia"),
  C("EE", "Estonia"),
];

const RAW_CITIES: [string, string, number, number][] = [
  ["RO", "București", 44.4268, 26.1025], ["RO", "Cluj-Napoca", 46.7712, 23.6236], ["RO", "Timișoara", 45.7489, 21.2087],
  ["RO", "Iași", 47.1585, 27.6014], ["RO", "Constanța", 44.1598, 28.6348], ["RO", "Brașov", 45.6427, 25.5887],
  ["RO", "Craiova", 44.3302, 23.7949], ["RO", "Galați", 45.4353, 28.008], ["RO", "Ploiești", 44.9365, 26.0129],
  ["RO", "Oradea", 47.0465, 21.9189], ["RO", "Arad", 46.1866, 21.3123], ["RO", "Sibiu", 45.7983, 24.1256],
  ["RO", "Bacău", 46.567, 26.9146], ["RO", "Pitești", 44.8565, 24.8692], ["RO", "Suceava", 47.6514, 26.2556],
  ["RO", "Târgu Mureș", 46.5386, 24.5575], ["RO", "Baia Mare", 47.6567, 23.585], ["RO", "Satu Mare", 47.79, 22.89],
  ["RO", "Brăila", 45.2692, 27.9575], ["RO", "Buzău", 45.15, 26.8333], ["RO", "Deva", 45.8833, 22.9],
  ["RO", "Alba Iulia", 46.0667, 23.5833], ["RO", "Bistrița", 47.1333, 24.5], ["RO", "Focșani", 45.7, 27.1833],
  ["RO", "Râmnicu Vâlcea", 45.1, 24.3667], ["RO", "Drobeta-Turnu Severin", 44.6333, 22.65], ["RO", "Piatra Neamț", 46.9275, 26.3708],
  ["RO", "Botoșani", 47.7486, 26.6694], ["RO", "Zalău", 47.1911, 23.0572], ["RO", "Giurgiu", 43.9037, 25.9699],
  ["RO", "Slatina", 44.4333, 24.3667], ["RO", "Reșița", 45.3008, 21.8892], ["RO", "Târgoviște", 44.9254, 25.4567],
  ["RO", "Vaslui", 46.6407, 27.7276], ["RO", "Tulcea", 45.1787, 28.805], ["RO", "Târgu Jiu", 45.0333, 23.2833],
  ["RO", "Sfântu Gheorghe", 45.8636, 25.7875], ["RO", "Miercurea Ciuc", 46.3594, 25.8018], ["RO", "Călărași", 44.2, 27.3333],
  ["RO", "Alexandria", 43.9686, 25.3333], ["RO", "Slobozia", 44.5633, 27.3661],
  ["MD", "Chișinău", 47.0105, 28.8638], ["MD", "Bălți", 47.7617, 27.9289],
  ["DE", "Berlin", 52.52, 13.405], ["DE", "München", 48.1351, 11.582], ["DE", "Hamburg", 53.5511, 9.9937],
  ["DE", "Frankfurt pe Main", 50.1109, 8.6821], ["DE", "Köln", 50.9375, 6.9603], ["DE", "Stuttgart", 48.7758, 9.1829],
  ["DE", "Düsseldorf", 51.2277, 6.7735], ["DE", "Nürnberg", 49.4521, 11.0767], ["DE", "Leipzig", 51.3397, 12.3731],
  ["DE", "Dortmund", 51.5136, 7.4653], ["DE", "Bremen", 53.0793, 8.8017], ["DE", "Hanovra", 52.3759, 9.732],
  ["DE", "Duisburg", 51.4344, 6.7623], ["DE", "Mannheim", 49.4875, 8.466],
  ["IT", "Milano", 45.4642, 9.19], ["IT", "Roma", 41.9028, 12.4964], ["IT", "Torino", 45.0703, 7.6869],
  ["IT", "Verona", 45.4384, 10.9916], ["IT", "Bologna", 44.4949, 11.3426], ["IT", "Napoli", 40.8518, 14.2681],
  ["IT", "Padova", 45.4064, 11.8768], ["IT", "Brescia", 45.5416, 10.2118],
  ["FR", "Paris", 48.8566, 2.3522], ["FR", "Lyon", 45.764, 4.8357], ["FR", "Marsilia", 43.2965, 5.3698],
  ["FR", "Lille", 50.6292, 3.0573], ["FR", "Strasbourg", 48.5734, 7.7521], ["FR", "Toulouse", 43.6047, 1.4442],
  ["FR", "Bordeaux", 44.8378, -0.5792],
  ["HU", "Budapesta", 47.4979, 19.0402], ["HU", "Debrecen", 47.5316, 21.6273], ["HU", "Szeged", 46.253, 20.1414],
  ["HU", "Győr", 47.6875, 17.6504],
  ["AT", "Viena", 48.2082, 16.3738], ["AT", "Linz", 48.3069, 14.2858], ["AT", "Graz", 47.0707, 15.4395],
  ["AT", "Salzburg", 47.8095, 13.055],
  ["NL", "Amsterdam", 52.3676, 4.9041], ["NL", "Rotterdam", 51.9244, 4.4777], ["NL", "Venlo", 51.3704, 6.1724],
  ["NL", "Eindhoven", 51.4416, 5.4697],
  ["BE", "Bruxelles", 50.8503, 4.3517], ["BE", "Anvers", 51.2194, 4.4025], ["BE", "Gent", 51.0543, 3.7174],
  ["BE", "Liège", 50.6326, 5.5797],
  ["ES", "Madrid", 40.4168, -3.7038], ["ES", "Barcelona", 41.3874, 2.1686], ["ES", "Valencia", 39.4699, -0.3763],
  ["ES", "Zaragoza", 41.6488, -0.8891], ["ES", "Sevilla", 37.3891, -5.9845],
  ["PL", "Varșovia", 52.2297, 21.0122], ["PL", "Cracovia", 50.0647, 19.945], ["PL", "Wrocław", 51.1079, 17.0385],
  ["PL", "Poznań", 52.4064, 16.9252], ["PL", "Łódź", 51.7592, 19.456], ["PL", "Gdańsk", 54.352, 18.6466],
  ["BG", "Sofia", 42.6977, 23.3219], ["BG", "Plovdiv", 42.1354, 24.7453], ["BG", "Varna", 43.2141, 27.9147],
  ["BG", "Ruse", 43.8356, 25.9657],
  ["CZ", "Praga", 50.0755, 14.4378], ["CZ", "Brno", 49.1951, 16.6068], ["CZ", "Ostrava", 49.8209, 18.2625],
  ["SK", "Bratislava", 48.1486, 17.1077], ["SK", "Košice", 48.7164, 21.2611],
  ["SI", "Ljubljana", 46.0569, 14.5058], ["SI", "Maribor", 46.5547, 15.6459],
  ["HR", "Zagreb", 45.815, 15.9819], ["HR", "Rijeka", 45.3271, 14.4422],
  ["RS", "Belgrad", 44.7866, 20.4489], ["RS", "Novi Sad", 45.2671, 19.8335],
  ["GR", "Atena", 37.9838, 23.7275], ["GR", "Salonic", 40.6401, 22.9444],
  ["TR", "Istanbul", 41.0082, 28.9784], ["TR", "Ankara", 39.9334, 32.8597], ["TR", "Izmir", 38.4237, 27.1428],
  ["UA", "Kiev", 50.4501, 30.5234], ["UA", "Liov", 49.8397, 24.0297], ["UA", "Odesa", 46.4825, 30.7233],
  ["UA", "Cernăuți", 48.2915, 25.9403],
  ["GB", "Londra", 51.5072, -0.1276], ["GB", "Birmingham", 52.4862, -1.8904], ["GB", "Manchester", 53.4808, -2.2426],
  ["CH", "Zürich", 47.3769, 8.5417], ["CH", "Basel", 47.5596, 7.5886], ["CH", "Geneva", 46.2044, 6.1432],
  ["DK", "Copenhaga", 55.6761, 12.5683], ["DK", "Aarhus", 56.1629, 10.2039],
  ["SE", "Stockholm", 59.3293, 18.0686], ["SE", "Göteborg", 57.7089, 11.9746], ["SE", "Malmö", 55.605, 13.0038],
  ["PT", "Lisabona", 38.7223, -9.1393], ["PT", "Porto", 41.1579, -8.6291],
  ["LT", "Vilnius", 54.6872, 25.2797], ["LT", "Kaunas", 54.8985, 23.9036],
  ["LV", "Riga", 56.9496, 24.1052], ["EE", "Tallinn", 59.437, 24.7536],
];

export const CITIES: City[] = RAW_CITIES.map(([country, name, lat, lng]) => ({ country, name, slug: slugify(name), lat, lng }));

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
const bySlug = new Map(COUNTRIES.map((c) => [c.slug, c]));
const cityBySlugMap = new Map(CITIES.map((c) => [c.slug, c]));
const cityByNorm = new Map(CITIES.map((c) => [`${c.country}:${normalize(c.name)}`, c]));

export const countryByCode = (code: string | null | undefined) => (code ? byCode.get(code.toUpperCase()) : undefined);
export const countryBySlug = (slug: string) => bySlug.get(slug);
export const countryName = (code: string | null | undefined) => countryByCode(code)?.name ?? code ?? "";
export const cityBySlug = (slug: string) => cityBySlugMap.get(slug);
export const citiesOf = (code: string) => CITIES.filter((c) => c.country === code);

/** Găsește orașul în nomenclator (pentru coordonate), indiferent de diacritice. */
export const findCity = (country: string, name: string) => cityByNorm.get(`${country}:${normalize(name)}`);

/** Destinațiile cu cel mai mare volum de căutări din/spre România. */
export const POPULAR_DESTINATIONS = ["DE", "IT", "FR", "HU", "AT", "NL", "BE", "ES", "PL", "BG", "MD", "GB", "CZ"];

/** Rutele populare sunt mereu indexabile, chiar dacă momentan nu au oferte. */
export function isPopularRoute(from: string, to: string) {
  return (from === "RO" && (to === "RO" || POPULAR_DESTINATIONS.includes(to))) || (to === "RO" && POPULAR_DESTINATIONS.includes(from));
}

export function routePath(from: string, to: string) {
  return `/transport-marfa/${byCode.get(from)!.slug}/${byCode.get(to)!.slug}`;
}

export function countryPath(code: string) {
  return `/transport-marfa/${byCode.get(code)!.slug}`;
}

/** Distanța în linie dreaptă (km). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
