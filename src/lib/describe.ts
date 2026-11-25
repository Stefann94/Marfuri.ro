import type { Filters } from "./queries";
import { countryName } from "./geo";
import { vehicleShort } from "./vehicles";
import { fmtDate } from "./format";

/** Descriere în limbaj natural a unui set de filtre, pentru titluri și H1. */
export function describeFilters(f: Partial<Filters>) {
  const parts: string[] = [];
  const from = f.fromCity ?? (f.from ? countryName(f.from) : undefined);
  const to = f.toCity ?? (f.to ? countryName(f.to) : undefined);
  if (from) parts.push(`din ${from}`);
  if (to) parts.push(`spre ${to}`);
  if (f.vehicle) parts.push(`· ${vehicleShort(f.vehicle)}`);
  if (f.date) parts.push(`· de la ${fmtDate(f.date)}`);
  return parts.join(" ");
}
