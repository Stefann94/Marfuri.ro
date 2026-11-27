"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { publishLoad, publishTruck, type PublishState } from "@/lib/cereri-actions";
import { CityField, ErrorBox, SubmitButton, type CityOpt, type CountryOpt } from "./client";
import { Check, Chip, Field, FormSection, Ico, ICONS, inputBox, inputCls, ReqCard, RouteLine, MetaItem, Shield } from "./ui";

type Who = { company: string; verified: boolean; name: string; phone: string };
type Common = { who: Who; cities: CityOpt[]; countries: CountryOpt[]; today: string; vehicles: { slug: string; short: string }[] };

const dShort = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtD = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? dShort.format(new Date(`${iso}T00:00:00Z`)) : "—");

function Input({ name, label, optional, unit, icon, ...rest }: { name: string; label: string; optional?: boolean; unit?: string; icon?: keyof typeof ICONS } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} optional={optional} htmlFor={`f-${name}`}>
      <div className={inputBox}>
        {icon && <Ico d={ICONS[icon]} size={18} className="text-[#6B717A]" />}
        <input id={`f-${name}`} name={name} className={inputCls} {...rest} />
        {unit && <span className="text-sm font-bold text-[#6B717A]">{unit}</span>}
      </div>
    </Field>
  );
}

function Select({ name, label, options, optional }: { name: string; label: string; options: string[]; optional?: boolean }) {
  return (
    <Field label={label} optional={optional} htmlFor={`f-${name}`}>
      <div className={inputBox}>
        <select id={`f-${name}`} name={name} className={`${inputCls} cursor-pointer`}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
    </Field>
  );
}

function Side({ who, preview, button, note, after }: { who: Who; preview: ReactNode; button: ReactNode; note: string; after: string[] }) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div>
        <div className="mb-2 ml-0.5 text-[11.5px] font-extrabold tracking-[0.07em] text-[#6B717A] uppercase">Publici ca</div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#E4E0DE] bg-white px-4 py-3.5">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-graphite font-logo text-base text-white">
            {who.company.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-[15px] font-bold">{who.company}</b>
            {who.verified ? (
              <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-[#E6F4EA] px-2 text-xs font-bold text-[#157F3B]">
                <Shield />
                Verificată ANAF
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#6B717A]">Neverificată încă la ANAF</span>
            )}
          </span>
        </div>
      </div>
      <div>
        <div className="mb-2 ml-0.5 text-[11.5px] font-extrabold tracking-[0.07em] text-[#6B717A] uppercase">Așa apare în listă</div>
        {preview}
      </div>
      {button}
      <p className="mx-1.5 text-center text-[13px] leading-[1.45] font-medium text-[#6B717A]">{note}</p>
      <div className="rounded-2xl border border-[#E4E0DE] bg-white px-[18px] py-4">
        <div className="mb-2.5 text-[11.5px] font-extrabold tracking-[0.07em] text-[#6B717A] uppercase">După ce publici</div>
        <ol className="flex flex-col gap-2.5">
          {after.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-[1.4] font-medium text-[#3A404A]">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-md border border-[#E4E0DE] bg-[#F7F5F4] font-logo text-xs text-graphite">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

/** Citește formularul la fiecare modificare, pentru previzualizare. */
function useLive(initial: Record<string, string>) {
  const ref = useRef<HTMLFormElement>(null);
  const [v, setV] = useState(initial);
  const read = () => {
    if (!ref.current) return;
    const fd = new FormData(ref.current);
    const o: Record<string, string> = {};
    for (const [k, val] of fd.entries()) o[k] = o[k] ? `${o[k]},${val}` : String(val);
    setV(o);
  };
  return { ref, v, read };
}

/* ------------------------------------------------------------ Caută camion */

export function PublishLoadForm({ who, cities, countries, today, vehicles }: Common) {
  const [state, action] = useActionState(publishLoad, {} as PublishState);
  const { ref, v, read } = useLive({ din_oras: "", spre_oras: "", data: today, tone: "", vehicul: "prelata", pret_mod: "pret", pret: "" });
  const short = (slug: string) => vehicles.find((x) => x.slug === slug)?.short ?? slug;
  const veh = (v.vehicul ?? "").split(",").filter(Boolean).map(short).join(", ") || "—";
  const askOffers = v.pret_mod === "oferte";

  return (
    <form ref={ref} action={action} onChange={read} onInput={read} className="grid grid-cols-1 items-start gap-7 pt-[26px] pb-[70px] lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-2xl border border-[#E4E0DE] bg-white">
        <FormSection n={1} title="Traseu" hint="De unde se încarcă marfa și unde trebuie să ajungă.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CityField label="De unde" cityName="din_oras" countryName="din_tara" cities={cities} countries={countries} />
            <CityField label="Până unde" cityName="spre_oras" countryName="spre_tara" cities={cities} countries={countries} defaultCountry="DE" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="adresa_inc" label="Adresa de încărcare" optional placeholder="Strada, nr., zona industrială" />
            <Input name="adresa_desc" label="Adresa de descărcare" optional placeholder="Strada, nr." />
          </div>
        </FormSection>

        <FormSection n={2} title="Când" hint="Data la care marfa e gata de încărcare.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input name="data" label="Data încărcării" type="date" min={today} defaultValue={today} required icon="cal" />
            <Input name="ora" label="Interval orar" optional placeholder="08:00 – 14:00" />
            <Input name="descarcare" label="Descărcare până la" optional type="date" min={today} className={inputCls} />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-[22px] gap-y-3">
            <Check name="flexibil" label="Data e flexibilă (± 1 zi)" defaultChecked />
          </div>
        </FormSection>

        <FormSection n={3} title="Marfa" hint="Cu cât e mai clar, cu atât primești mai repede un camion potrivit.">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Input name="marfa" label="Ce transporți" required placeholder="ex. Paleți cu piese auto" icon="box" />
            </div>
            <Input name="tone" label="Greutate" required inputMode="decimal" placeholder="12" unit="t" />
            <Input name="lungime" label="Lungime ocupată" optional inputMode="decimal" placeholder="6,8" unit="m" />
            <Input name="paleti" label="Paleți" optional inputMode="numeric" placeholder="14" unit="buc." />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-[22px] gap-y-3">
            <Check name="stivuibil" label="Marfa se poate stivui" />
            <Check name="adr" label="Marfă periculoasă (ADR)" />
            <Check name="temp" label="Temperatură controlată" />
          </div>
        </FormSection>

        <FormSection n={4} title="Camionul de care ai nevoie" hint="Poți alege mai multe tipuri.">
          <div className="flex flex-wrap gap-2">
            {vehicles.map((x) => (
              <Chip key={x.slug} name="vehicul" value={x.slug} label={x.short} defaultChecked={x.slug === "prelata"} />
            ))}
          </div>
          <div className="mt-3.5 text-[11.5px] font-extrabold tracking-[0.06em] text-[#4A4F57] uppercase">Încărcare</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Chip name="incarcare" value="prin spate" label="Prin spate" defaultChecked />
            <Chip name="incarcare" value="lateral" label="Lateral" />
            <Chip name="incarcare" value="de sus" label="De sus" />
          </div>
        </FormSection>

        <FormSection n={5} title={<>Pre<span className="ro-virgula">t</span></>} hint="Un preț clar aduce acceptări mai rapide.">
          <div className="inline-flex rounded-xl border border-[#E4E0DE] bg-[#F7F5F4] p-1">
            {[
              ["pret", "Ofer un preț"],
              ["oferte", "Aștept oferte"],
            ].map(([val, label]) => (
              <label key={val} className="cursor-pointer">
                <input type="radio" name="pret_mod" value={val} defaultChecked={val === "pret"} className="peer sr-only" />
                <span className="flex h-[38px] items-center rounded-[9px] px-4 text-sm font-bold text-[#6B717A] peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-[0_1px_3px_rgb(0_0_0/0.12)] peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {!askOffers && (
            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input name="pret" label="Preț" inputMode="numeric" placeholder="1.250" unit="€" />
              <Select name="plata" label="Plata la" options={["30 de zile", "La descărcare", "15 zile", "45 de zile", "60 de zile"]} />
              <Select name="factura" label="Factură" options={["Cu TVA", "Fără TVA"]} />
            </div>
          )}
        </FormSection>

        <FormSection n={6} title="Detalii și contact">
          <Field label="Alte detalii" optional htmlFor="f-detalii">
            <textarea
              id="f-detalii"
              name="detalii"
              rows={3}
              placeholder="Rampă de încărcare, documente, cerințe speciale…"
              className="min-h-24 w-full resize-y rounded-[11px] border-[1.5px] border-[#D9D2D0] px-3.5 py-3 text-[15px] leading-normal outline-none focus:border-graphite"
            />
          </Field>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="contact_nume" label="Persoana de contact" defaultValue={who.name} />
            <Input name="contact_tel" label="Telefon" defaultValue={who.phone} inputMode="tel" />
          </div>
        </FormSection>
      </div>

      <Side
        who={who}
        preview={
          <ReqCard
            compact
            route={<RouteLine from={v.din_oras || "De unde"} fromCc={v.din_tara ?? "RO"} to={v.spre_oras || "Până unde"} toCc={v.spre_tara ?? "DE"} />}
            meta={
              <>
                <MetaItem icon="cal">Încărcare {fmtD(v.data ?? "")}</MetaItem>
                <MetaItem icon="box">{v.tone ? `${v.tone} t` : "— t"}</MetaItem>
                <MetaItem icon="truck">Camion: {veh}</MetaItem>
              </>
            }
            company={who.company}
            verified={who.verified}
            when="chiar acum"
            right={askOffers || !v.pret ? <div className="text-[14.5px] font-bold text-[#6B717A]">Așteaptă oferte</div> : <div className="font-logo text-[22px]">{v.pret} €</div>}
          />
        }
        button={
          <div className="flex flex-col gap-3">
            <ErrorBox>{state.error}</ErrorBox>
            <SubmitButton>
              <Ico d="m5 12.5 4.5 4.5L19 7.5" size={19} />
              Publică cererea
            </SubmitButton>
          </div>
        }
        note="Apare imediat la „Am camion liber”. O poți închide oricând din contul tău."
        after={[
          "Transportatorii cu camion potrivit o văd în listă.",
          "Unul dintre ei o acceptă: cererea trece în „acceptată” și dispare din listă.",
          "Vezi în contul tău firma care a acceptat, cu telefonul și camionul.",
        ]}
      />
    </form>
  );
}

/* ------------------------------------------------------------ Caută marfă */

export function PublishTruckForm({ who, cities, countries, today, vehicles }: Common) {
  const [state, action] = useActionState(publishTruck, {} as PublishState);
  const { ref, v, read } = useLive({ din_oras: "", liber_de: today, dest_mod: "tara", spre_tara: "RO", vehicul: "prelata", capacitate: "" });
  const anywhere = v.dest_mod === "oriunde";
  const short = (slug: string) => vehicles.find((x) => x.slug === slug)?.short ?? slug;

  return (
    <form ref={ref} action={action} onChange={read} onInput={read} className="grid grid-cols-1 items-start gap-7 pt-[26px] pb-[70px] lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-2xl border border-[#E4E0DE] bg-white">
        <FormSection n={1} title="Unde e camionul" hint="Locul de unde poate pleca la încărcare.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CityField label="Oraș" cityName="din_oras" countryName="din_tara" cities={cities} countries={countries} />
            <Input name="distanta" label="Distanța maximă până la încărcare" optional inputMode="numeric" placeholder="100" unit="km" />
          </div>
        </FormSection>

        <FormSection n={2} title="Când e liber">
          <div className="grid grid-cols-2 gap-3">
            <Input name="liber_de" label="Liber de la" type="date" min={today} defaultValue={today} required icon="cal" />
            <Input name="liber_pana" label="Până la" optional type="date" min={today} icon="cal" />
          </div>
        </FormSection>

        <FormSection n={3} title="Unde vrei să ajungi" hint="Spune unde ai vrea să descarci; „oriunde” aduce mai multe oferte.">
          <div className="inline-flex rounded-xl border border-[#E4E0DE] bg-[#F7F5F4] p-1">
            {[
              ["tara", "Spre o țară sau un oraș"],
              ["oriunde", "Oriunde"],
            ].map(([val, label]) => (
              <label key={val} className="cursor-pointer">
                <input type="radio" name="dest_mod" value={val} defaultChecked={val === "tara"} className="peer sr-only" />
                <span className="flex h-[38px] items-center rounded-[9px] px-4 text-sm font-bold text-[#6B717A] peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-[0_1px_3px_rgb(0_0_0/0.12)]">{label}</span>
              </label>
            ))}
          </div>
          {!anywhere && (
            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Țara de destinație" htmlFor="f-spre_tara">
                <div className={inputBox}>
                  <Ico d={ICONS.pin} size={18} className="text-[#6B717A]" />
                  <select id="f-spre_tara" name="spre_tara" defaultValue="RO" className={`${inputCls} cursor-pointer`}>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Input name="spre_oras" label="Oraș" optional placeholder="Orice oraș din țară" list="orase-dest" />
              <datalist id="orase-dest">
                {cities
                  .filter((c) => c.c === (v.spre_tara ?? "RO"))
                  .map((c) => (
                    <option key={c.n} value={c.n} />
                  ))}
              </datalist>
            </div>
          )}
        </FormSection>

        <FormSection n={4} title="Camionul">
          <div className="flex flex-wrap gap-2">
            {vehicles.map((x) => (
              <Chip key={x.slug} type="radio" name="vehicul" value={x.slug} label={x.short} defaultChecked={x.slug === "prelata"} />
            ))}
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Input name="capacitate" label="Capacitate" required inputMode="decimal" placeholder="24" unit="t" />
            <Input name="lungime" label="Lungime" optional inputMode="decimal" placeholder="13,6" unit="m" />
            <Input name="volum" label="Volum" optional inputMode="decimal" placeholder="90" unit="m³" />
            <Input name="nr" label="Nr. înmatriculare" optional placeholder="CJ 12 ABC" />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-[22px] gap-y-3">
            <Check name="echipament" value="lift / oblon" label="Lift / oblon" />
            <Check name="echipament" value="ADR" label="ADR" />
            <Check name="echipament" value="prelată culisantă" label="Prelată culisantă" />
            <Check name="echipament" value="șofer cu experiență internațională" label="Șofer cu experiență internațională" />
          </div>
        </FormSection>

        <FormSection n={5} title={<>Pre<span className="ro-virgula">t</span> dorit</>} hint="Opțional. Dacă îl lași gol, firmele cu marfă îți fac ele oferte.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input name="pret_km" label="Pe km" optional inputMode="decimal" placeholder="1,10" unit="€/km" />
            <Input name="pret_cursa" label="Sau pe cursă" optional inputMode="numeric" placeholder="1.400" unit="€" />
          </div>
        </FormSection>

        <FormSection n={6} title="Detalii și contact">
          <Field label="Alte detalii" optional htmlFor="f-detalii">
            <textarea
              id="f-detalii"
              name="detalii"
              rows={3}
              placeholder="Restricții, documente, preferințe…"
              className="min-h-24 w-full resize-y rounded-[11px] border-[1.5px] border-[#D9D2D0] px-3.5 py-3 text-[15px] leading-normal outline-none focus:border-graphite"
            />
          </Field>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="contact_nume" label="Șofer sau dispecer" defaultValue={who.name} />
            <Input name="contact_tel" label="Telefon" defaultValue={who.phone} inputMode="tel" />
          </div>
        </FormSection>
      </div>

      <Side
        who={who}
        preview={
          <ReqCard
            compact
            route={
              <RouteLine
                from={v.din_oras || "Unde e camionul"}
                fromCc={v.din_tara ?? "RO"}
                to={v.spre_oras || countries.find((c) => c.code === v.spre_tara)?.name || "Destinație"}
                toCc={v.spre_tara ?? "RO"}
                anyDest={anywhere}
              />
            }
            meta={
              <>
                <MetaItem icon="cal">Liber {fmtD(v.liber_de ?? "")}{v.liber_pana ? ` – ${fmtD(v.liber_pana)}` : ""}</MetaItem>
                <MetaItem icon="truck">{short(v.vehicul ?? "")}</MetaItem>
                <MetaItem icon="weight">{v.capacitate ? `${v.capacitate} t` : "— t"}</MetaItem>
              </>
            }
            company={who.company}
            verified={who.verified}
            when="chiar acum"
            right={<div className="text-[14.5px] font-bold text-[#6B717A]">Caută marfă</div>}
          />
        }
        button={
          <div className="flex flex-col gap-3">
            <ErrorBox>{state.error}</ErrorBox>
            <SubmitButton>
              <Ico d="m5 12.5 4.5 4.5L19 7.5" size={19} />
              Anunță camionul liber
            </SubmitButton>
          </div>
        }
        note="Apare imediat la „Am marfă de transportat”. Dispare singur după data până la care e liber."
        after={[
          "Firmele cu marfă pe ruta ta te văd în listă.",
          "Una te acceptă și îți trimite marfa ei (rută, dată, greutate, preț).",
          "Vezi în contul tău firma care te-a acceptat, cu telefonul ei.",
        ]}
      />
    </form>
  );
}
