import type { Filters } from "./queries";
import type { Ref } from "./ref";
import { fmtDate } from "./format";

/** Descriere în limbaj natural a unui set de filtre, pentru titluri și H1. */
export function describeFilters(f: Partial<Filters>, ref: Ref) {
  const parts: string[] = [];
  const from = f.fromCity ?? (f.from ? ref.countryName(f.from) : undefined);
  const to = f.toCity ?? (f.to ? ref.countryName(f.to) : undefined);
  if (from) parts.push(`din ${from}`);
  if (to) parts.push(`spre ${to}`);
  if (f.vehicle) parts.push(`· ${ref.vehicleShort(f.vehicle)}`);
  if (f.date && f.dateTo) parts.push(f.dateTo === f.date ? `· pe ${fmtDate(f.date)}` : `· ${fmtDate(f.date)} – ${fmtDate(f.dateTo)}`);
  else if (f.date) parts.push(`· de la ${fmtDate(f.date)}`);
  if (f.weight) parts.push(`· ${String(f.weight).replace(".", ",")} t`);
  return parts.join(" ");
}
