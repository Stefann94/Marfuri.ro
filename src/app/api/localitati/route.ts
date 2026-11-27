import { nearestCity, searchCities } from "@/lib/places";

export const dynamic = "force-dynamic";

/**
 * Localitățile din baza de date, pentru ferestrele „De unde / Până unde”.
 *   ?tara=RO            → cele mai mari localități din România
 *   ?tara=RO&q=clu      → căutare în România
 *   ?q=koln             → căutare în toate țările
 *   ?lat=46.7&lng=23.6  → cea mai apropiată localitate
 */
export async function GET(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("localitati", e);
    return Response.json({ error: process.env.NODE_ENV === "production" ? "eroare" : String((e as Error).message) }, { status: 500 });
  }
}

async function handle(req: Request) {
  const p = new URL(req.url).searchParams;
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  if (p.has("lat") && Number.isFinite(lat) && Number.isFinite(lng)) {
    return Response.json({ city: await nearestCity(lat, lng) });
  }
  const country = (p.get("tara") ?? "").toUpperCase();
  const q = (p.get("q") ?? "").slice(0, 60);
  const items = await searchCities({ country: /^[A-Z]{2}$/.test(country) ? country : undefined, q, limit: q ? 30 : 60 });
  return Response.json({ cities: items }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
