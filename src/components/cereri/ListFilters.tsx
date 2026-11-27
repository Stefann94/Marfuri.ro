import Link from "next/link";
import { VEHICLES } from "@/lib/vehicles";
import type { CountryItem } from "@/lib/places";
import { PlaceField } from "./PlaceField";
import { startPlace } from "@/lib/start-place";
import { Field, Ico, ICONS, Skew, btnCls, inputBox, inputCls } from "./ui";

export type ListParams = { from?: string; to?: string; fromCity?: string; toCity?: string; date?: string; vehicle?: string; weight?: number; verified?: boolean };

/** Filtrele din stânga listelor (formular GET, merge și fără JavaScript). */
export function ListFilters({ action, p, weightLabel, countries }: { action: string; p: ListParams; weightLabel: string; countries: CountryItem[] }) {
  const common = ["prelata", "mega", "frigorific", "box", "platforma", "duba"];
  const n = [p.from || p.fromCity, p.to || p.toCity, p.date, p.vehicle, p.weight, p.verified].filter(Boolean).length;
  return (
    <div className="lg:sticky lg:top-[173px] xl:top-[124px]">
      {/* Pe telefon filtrele stau ascunse sub un buton, ca rezultatele să apară imediat (merge fără JavaScript). */}
      <input type="checkbox" id="arata-filtre" className="peer sr-only" />
      <label
        htmlFor="arata-filtre"
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E4E0DE] bg-white px-[18px] py-3.5 font-logo text-base peer-checked:rounded-b-none peer-checked:border-b-0 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500 lg:hidden"
      >
        <span>Filtrează{n > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 font-sans text-xs font-bold text-white">{n}</span>}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </label>
    <form action={action} className="hidden flex-col gap-3.5 rounded-2xl border border-[#E4E0DE] bg-white p-[18px] peer-checked:flex peer-checked:rounded-t-none peer-checked:border-t-0 lg:flex">
      <h2 className="hidden font-logo text-base font-normal tracking-normal lg:block">Filtrează</h2>
      <PlaceField label="De unde" cityName="oras_din" countryName="din" countries={countries} defaultPlace={startPlace(p.from, p.fromCity, countries)} placeholder="Oriunde" />
      <PlaceField label="Până unde" cityName="oras_spre" countryName="spre" countries={countries} defaultPlace={startPlace(p.to, p.toCity, countries)} placeholder="Oriunde" />
      <Field label="De la data" htmlFor="flt-data">
        <div className={inputBox}>
          <input id="flt-data" name="data" type="date" defaultValue={p.date ?? ""} className={inputCls} />
        </div>
      </Field>
      <Field label={weightLabel} htmlFor="flt-tone">
        <div className={inputBox}>
          <Ico d={ICONS.weight} size={18} className="text-[#6B717A]" />
          <input id="flt-tone" name="tone" inputMode="decimal" defaultValue={p.weight ?? ""} placeholder="oricât" className={inputCls} />
          <span className="text-sm font-bold text-[#6B717A]">t</span>
        </div>
      </Field>
      <Field label="Tip camion" htmlFor="flt-veh">
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input type="radio" name="vehicul" value="" defaultChecked={!p.vehicle} className="peer sr-only" />
            <span className="inline-flex h-[38px] items-center rounded-[10px] border-[1.5px] border-[#D9D2D0] bg-white px-3.5 text-sm font-bold peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-white">Oricare</span>
          </label>
          {VEHICLES.filter((v) => common.includes(v.slug)).map((v) => (
            <label key={v.slug} className="cursor-pointer">
              <input type="radio" name="vehicul" value={v.slug} defaultChecked={p.vehicle === v.slug} className="peer sr-only" />
              <span className="inline-flex h-[38px] items-center rounded-[10px] border-[1.5px] border-[#D9D2D0] bg-white px-3.5 text-sm font-bold peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-white">
                {v.short}
              </span>
            </label>
          ))}
        </div>
      </Field>
      <label className="inline-flex cursor-pointer items-center gap-[9px] text-[14.5px] font-semibold">
        <input type="checkbox" name="verificat" value="1" defaultChecked={p.verified} className="peer sr-only" />
        <span className="flex size-5 items-center justify-center rounded-md border-[1.5px] border-[#BDB5B3] bg-white text-transparent peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        Doar firme verificate ANAF
      </label>
      <button type="submit" className={`${btnCls("md", "dark")} w-full`}>
        <Skew tone="dark" />
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        Arată rezultatele
      </button>
      {(p.from || p.to || p.fromCity || p.toCity || p.date || p.vehicle || p.weight || p.verified) && (
        <Link href={action} className="text-center text-sm font-bold text-brand-600 underline underline-offset-[3px]">
          Șterge filtrele
        </Link>
      )}
    </form>
    </div>
  );
}
