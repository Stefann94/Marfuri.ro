import { latestLoads, siteStats } from "@/lib/queries";
import { getRef } from "@/lib/ref";

export const dynamic = "force-dynamic";

/** Date pentru banda „Bursă live” și cifrele din meniu. */
export async function GET() {
  try {
    const [stats, items, { vehicleShort }] = await Promise.all([siteStats(), latestLoads(), getRef()]);
    return Response.json(
      {
        stats,
        items: items.map((l) => ({
          id: l.id,
          from: { country: l.fromCountry, city: l.fromCity },
          to: { country: l.toCountry, city: l.toCity },
          vehicle: vehicleShort(l.vehicle),
          weightT: l.weightT,
          price: l.price,
          currency: l.currency,
          at: l.createdAt.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch {
    return Response.json({ stats: null, items: [] }, { status: 503 });
  }
}
