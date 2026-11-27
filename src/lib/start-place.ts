import type { CountryItem } from "./places";
import type { Place } from "@/components/home/PlacePicker";

/** Valoarea de pornire din filtrele din adresă: orașul (cu țara) sau țara întreagă. */
export function startPlace(
  country: string | undefined,
  city: string | undefined,
  countries: CountryItem[],
): Place | undefined {
  if (city) return { text: city, country };
  const c = country ? countries.find((x) => x.code === country) : undefined;
  return c ? { text: c.name, country: c.code, whole: true } : undefined;
}
