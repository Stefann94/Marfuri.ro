import { getRef } from "@/lib/ref";
import type { RouteSupply } from "@/lib/queries";
import { TraseeDerulator, type TraseuRand } from "./TraseeDerulator";

/** Ce înseamnă raportul marfă / șoferi pe traseu, pe scurt. */
function hint(loads: number, trucks: number) {
  const r = trucks ? loads / trucks : Infinity;
  if (r >= 2) return { text: "Multă marfă, puțini șoferi", hot: true };
  if (r >= 1.3) return { text: "Mai multă marfă decât șoferi", hot: false };
  if (r <= 0.75) return { text: "Mulți șoferi, marfă puțină", hot: false };
  return { text: "Cerere și ofertă echilibrate", hot: false };
}

/**
 * Chenarul din stânga hero-ului (varianta F): pe fiecare traseu, câtă marfă caută șofer și câți șoferi sunt liberi.
 * Datele (nume de țări, linkuri, sfaturi) se pregătesc aici, pe server; derularea e în TraseeDerulator.
 */
export async function HeroTrasee({ routes }: { routes: RouteSupply[] }) {
  if (!routes.length) return null;
  const { countryName, routePath } = await getRef();
  const rows: TraseuRand[] = routes.map((r) => {
    const h = hint(r.loads, r.trucks);
    return {
      key: `${r.from}-${r.to}`,
      from: countryName(r.from),
      to: countryName(r.to),
      href: routePath(r.from, r.to),
      loads: r.loads,
      trucks: r.trucks,
      hint: h.text,
      hot: h.hot,
    };
  });
  const max = Math.max(...routes.map((r) => Math.max(r.loads, r.trucks)));
  return <TraseeDerulator rows={rows} max={max} />;
}
