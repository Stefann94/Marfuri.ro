import type { CountryItem } from "@/lib/places";
import { PlaceField } from "./cereri/PlaceField";
import { startPlace } from "@/lib/start-place";
import { VEHICLES } from "@/lib/vehicles";
import type { Filters } from "@/lib/queries";
import { Box, Search, Truck } from "./icons";

/**
 * Formular GET simplu, funcționează fără JavaScript.
 * Cele două butoane trimit același formular spre /marfa sau /camioane (formAction).
 */
export function SearchForm({ defaults, mode = "both", countries }: { defaults?: Partial<Filters>; mode?: "both" | "loads" | "trucks"; countries: CountryItem[] }) {
  const d = defaults ?? {};
  return (
    <form method="get" action={mode === "trucks" ? "/camioane" : "/marfa"} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_11rem_auto] lg:items-end">
      <div className="min-w-0">
        <span className="field-label">De la</span>
        <PlaceField bare compact label="De la" cityName="oras_din" countryName="din" countries={countries} defaultPlace={startPlace(d.from, d.fromCity, countries)} placeholder="Oricare" />
      </div>
      <div className="min-w-0">
        <span className="field-label">Până la</span>
        <PlaceField bare compact label="Până la" cityName="oras_spre" countryName="spre" countries={countries} defaultPlace={startPlace(d.to, d.toCity, countries)} placeholder="Oricare" />
      </div>
      <label className="block">
        <span className="field-label">Data</span>
        <input type="date" name="data" defaultValue={d.date} className="field" />
      </label>
      <label className="block">
        <span className="field-label">Vehicul</span>
        <select name="vehicul" defaultValue={d.vehicle ?? ""} className="field">
          <option value="">Orice tip</option>
          {VEHICLES.map((v) => (
            <option key={v.slug} value={v.slug}>{v.short}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        {mode !== "trucks" && (
          <button type="submit" formAction="/marfa" className="btn btn-primary h-11 flex-1 lg:flex-none">
            {mode === "both" ? <Box width={18} height={18} /> : <Search />}
            {mode === "both" ? "Caută marfă" : "Caută"}
          </button>
        )}
        {mode !== "loads" && (
          <button type="submit" formAction="/camioane" className={`btn h-11 flex-1 lg:flex-none ${mode === "both" ? "btn-accent" : "btn-primary"}`}>
            {mode === "both" ? <Truck width={18} height={18} /> : <Search />}
            {mode === "both" ? "Caută camioane" : "Caută"}
          </button>
        )}
      </div>
    </form>
  );
}
