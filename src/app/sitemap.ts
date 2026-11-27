import type { MetadataRoute } from "next";
import { sitemapData } from "@/lib/queries";
import { absUrl } from "@/lib/site";
import { getRef } from "@/lib/ref";
import { featuredCities } from "@/lib/places";

// Generat la cerere (datele sunt în cache 1 oră), ca build-ul să nu depindă de baza de date.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ countryPath, routePath, popular, countries }, cities, { loadIds, truckIds, firms, routes, citySlugs }] = await Promise.all([getRef(), featuredCities(), sitemapData()]);
  const now = new Date();

  const routeSet = new Set<string>();
  for (const c of ["RO", ...popular]) {
    routeSet.add(routePath("RO", c));
    if (c !== "RO") routeSet.add(routePath(c, "RO"));
  }
  for (const r of routes) routeSet.add(routePath(r.from, r.to));

  return [
    { url: absUrl("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: absUrl("/marfa"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absUrl("/camioane"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absUrl("/transport-marfa"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...countries.map((c) => ({ url: absUrl(countryPath(c.code)), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...[...routeSet].map((p) => ({ url: absUrl(p), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...cities.filter((c) => citySlugs.has(c.slug)).map((c) => ({ url: absUrl(`/orase/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
    ...firms.map((f) => ({ url: absUrl(`/firme/${f.slug}`), lastModified: f.createdAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...loadIds.map((l) => ({ url: absUrl(`/marfa/${l.id}`), lastModified: l.updatedAt, changeFrequency: "daily" as const, priority: 0.4 })),
    ...truckIds.map((t) => ({ url: absUrl(`/camioane/${t.id}`), lastModified: t.updatedAt, changeFrequency: "daily" as const, priority: 0.4 })),
  ];
}
