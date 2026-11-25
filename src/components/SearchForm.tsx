import { CITIES, COUNTRIES } from "@/lib/geo";
import { VEHICLES } from "@/lib/vehicles";
import type { Filters } from "@/lib/queries";
import { Box, Search, Truck } from "./icons";

/**
 * Formular GET simplu, funcționează fără JavaScript.
 * Cele două butoane trimit același formular spre /marfa sau /camioane (formAction).
 */
export function SearchForm({ defaults, mode = "both" }: { defaults?: Partial<Filters>; mode?: "both" | "loads" | "trucks" }) {
  const d = defaults ?? {};
  return (
    <form method="get" action={mode === "trucks" ? "/camioane" : "/marfa"} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_11rem_auto] lg:items-end">
      <fieldset className="grid grid-cols-[6.5rem_1fr] gap-2">
        <legend className="field-label">De la</legend>
        <select name="din" defaultValue={d.from ?? ""} className="field px-2" aria-label="Țara de plecare">
          <option value="">Oricare</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
          ))}
        </select>
        <input name="oras_din" defaultValue={d.fromCity} list="orase" placeholder="Oraș (opțional)" className="field" aria-label="Orașul de plecare" autoComplete="off" />
      </fieldset>
      <fieldset className="grid grid-cols-[6.5rem_1fr] gap-2">
        <legend className="field-label">Până la</legend>
        <select name="spre" defaultValue={d.to ?? ""} className="field px-2" aria-label="Țara de destinație">
          <option value="">Oricare</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
          ))}
        </select>
        <input name="oras_spre" defaultValue={d.toCity} list="orase" placeholder="Oraș (opțional)" className="field" aria-label="Orașul de destinație" autoComplete="off" />
      </fieldset>
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
      <datalist id="orase">
        {CITIES.map((c) => (
          <option key={c.slug} value={c.name} />
        ))}
      </datalist>
    </form>
  );
}
