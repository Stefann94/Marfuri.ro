import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { COMPANIES_PAGE, searchCompanies } from "@/lib/queries";
import { listCountries, type CountryItem } from "@/lib/places";
import { getRef, type Ref } from "@/lib/ref";
import { fmtInt } from "@/lib/format";
import { startPlace } from "@/lib/start-place";
import { Building, Truck } from "@/components/icons";
import { CereriShell } from "@/components/cereri/pages";
import { PlaceField } from "@/components/cereri/PlaceField";
import { CC, Check, Field, Ico, ICONS, PageHead, Skew, VerifiedPill, btnCls, inputBox, inputCls } from "@/components/cereri/ui";
import { Pagination } from "@/components/ui";

export const metadata: Metadata = {
  title: "Firme verificate de transport și expediții",
  description: "Catalogul firmelor de transport, expeditorilor și caselor de expediții de pe Mărfuri.ro, cu verificare ANAF.",
  alternates: { canonical: "/firme" },
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Inițialele firmei, fără SRL / SA: „Atlas Line SRL” → „AL”. */
const initials = (name: string) =>
  name
    .replace(/\b(S\.?R\.?L\.?|S\.?A\.?|SRL-D|PFA|II|IF)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await connection();
  const sp = await searchParams;
  const ref = await getRef();
  const tip = one(sp.tip);
  const f = {
    q: one(sp.q)?.slice(0, 80),
    kind: ref.kinds.some((k) => k.code === tip) ? tip : undefined,
    country: ref.countryByCode(one(sp.tara))?.code,
    city: one(sp.oras)?.slice(0, 80),
    minFleet: Math.max(0, Number.parseInt(one(sp.flota) ?? "", 10) || 0) || undefined,
    verified: one(sp.verificat) === "1",
    page: Math.min(200, Math.max(1, Number.parseInt(one(sp.pagina) ?? "1", 10) || 1)),
  };
  const [{ items, total }, countries] = await Promise.all([searchCompanies(f), listCountries()]);
  const pages = Math.max(1, Math.ceil(total / COMPANIES_PAGE));
  const qs = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "pagina") q.set(k, v);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return `/firme${s ? `?${s}` : ""}`;
  };

  return (
    <CereriShell>
      <PageHead
        crumb="Firme verificate"
        title="Firme verificate"
        sub="Transportatori, expeditori și case de expediții. Vezi flota, de când sunt pe site și dacă au codul fiscal validat la ANAF."
      />
      <div className="grid grid-cols-1 items-start gap-[26px] pt-[26px] pb-[70px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <Filters f={f} countries={countries} kinds={ref.kinds} />
        <div className="min-w-0">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <b className="text-[15px] font-bold">
              <span className="font-logo text-lg font-normal">{fmtInt(total)}</span> {total === 1 ? "firmă" : total % 100 >= 20 || total === 0 ? "de firme" : "firme"}
            </b>
            <Link href="/cont/inregistrare" className={btnCls("sm", "light")}>
              <Skew tone="light" />
              Înscrie-ți firma
            </Link>
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-[#E4E0DE] bg-white px-6 py-10 text-center text-[15px] text-[#4A4F57]">
              Nicio firmă nu se potrivește filtrelor.{" "}
              <Link href="/firme" className="font-bold text-brand-600 underline underline-offset-[3px]">
                Arată toate firmele
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((c) => (
                <li key={c.slug}>
                  <CompanyCard c={c} kindLabel={ref.kindLabel} />
                </li>
              ))}
            </ul>
          )}
          <Pagination page={f.page} totalPages={pages} href={qs} />
        </div>
      </div>
    </CereriShell>
  );
}

type Company = Awaited<ReturnType<typeof searchCompanies>>["items"][number];

function CompanyCard({ c, kindLabel }: { c: Company; kindLabel: Ref["kindLabel"] }) {
  const KindIcon = c.kind === "carrier" ? Truck : Building;
  const nums: [string, string][] = [
    [c.fleetSize ? fmtInt(c.fleetSize) : "—", "camioane"],
    [fmtInt(c.active), "cereri active"],
    [String(c.since), "pe site din"],
  ];
  return (
    <Link
      href={`/firme/${c.slug}`}
      className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3.5 rounded-2xl border border-[#E4E0DE] bg-white p-4 transition-[border-color,box-shadow] hover:border-[#CFC8C6] hover:shadow-[0_14px_30px_-18px_rgb(0_0_0/0.3)] sm:px-[22px] sm:py-[18px] md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-x-[22px]"
    >
      {/* monograma: plăcuță grafit înclinată, ca butoanele site-ului */}
      <span
        aria-hidden
        className="relative isolate flex h-[52px] w-[58px] items-center justify-center font-logo text-[19px] text-white before:absolute before:inset-0 before:-z-10 before:-skew-x-[10deg] before:rounded-lg before:bg-gradient-to-b before:from-[#3A3F47] before:to-[#1B1E23]"
      >
        {initials(c.name)}
      </span>
      <span className="min-w-0">
        <h2 className="truncate text-[18px] leading-tight font-extrabold tracking-normal text-ink">{c.name}</h2>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-[#3A404A]">
          <span className="inline-flex items-center gap-1.5">
            <KindIcon width={16} height={16} className="text-[#6B717A]" />
            {kindLabel(c.kind)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ico d={ICONS.pin} size={16} className="text-[#6B717A]" />
            {c.city} <CC code={c.country} />
          </span>
          {c.vatCode && <span className="text-[#6B717A]">CUI {c.vatCode}</span>}
        </span>
        <span className="mt-2 block">
          <VerifiedPill ok={c.verified} />
        </span>
      </span>
      <span className="col-span-2 flex border-t border-[#EEE7E6] pt-3 md:col-span-1 md:border-t-0 md:pt-0">
        {nums.map(([n, label], i) => (
          <span key={label} className={`flex flex-1 flex-col items-center px-3 md:min-w-[88px] md:flex-none ${i > 0 ? "border-l border-[#E4E0DE]" : ""}`}>
            <b className="font-logo text-[22px] leading-tight font-normal">{n}</b>
            <span className="text-xs font-semibold whitespace-nowrap text-[#6B717A]">{label}</span>
          </span>
        ))}
      </span>
      <span className={`${btnCls("sm")} col-span-2 md:col-span-1`}>
        <Skew />
        Vezi fișa
      </span>
    </Link>
  );
}

function Filters({ f, countries, kinds }: { f: { q?: string; kind?: string; country?: string; city?: string; minFleet?: number; verified: boolean }; countries: CountryItem[]; kinds: Ref["kinds"] }) {
  const n = [f.q, f.kind, f.country || f.city, f.minFleet, f.verified].filter(Boolean).length;
  const chip = (value: string, label: string) => (
    <label key={value || "toate"} className="cursor-pointer">
      <input type="radio" name="tip" value={value} defaultChecked={(f.kind ?? "") === value} className="peer sr-only" />
      <span className="inline-flex h-[38px] items-center rounded-[10px] border-[1.5px] border-[#D9D2D0] bg-white px-3.5 text-sm font-bold peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">
        {label}
      </span>
    </label>
  );
  return (
    <div className="lg:sticky lg:top-[173px] xl:top-[124px]">
      {/* pe telefon filtrele stau ascunse sub un buton (merge și fără JavaScript) */}
      <input type="checkbox" id="arata-filtre-firme" className="peer sr-only" />
      <label
        htmlFor="arata-filtre-firme"
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#E4E0DE] bg-white px-[18px] py-3.5 font-logo text-base peer-checked:rounded-b-none peer-checked:border-b-0 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500 lg:hidden"
      >
        <span>Filtrează{n > 0 && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 font-sans text-xs font-bold text-white">{n}</span>}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </label>
      <form action="/firme" className="hidden flex-col gap-3.5 rounded-2xl border border-[#E4E0DE] bg-white p-[18px] peer-checked:flex peer-checked:rounded-t-none peer-checked:border-t-0 lg:flex">
        <h2 className="hidden font-logo text-base font-normal tracking-normal lg:block">Filtrează</h2>
        <Field label="Nume sau CUI" htmlFor="fir-q">
          <div className={inputBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="shrink-0 text-[#6B717A]">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input id="fir-q" name="q" defaultValue={f.q ?? ""} placeholder="ex. Atlas sau RO123" className={inputCls} />
          </div>
        </Field>
        <Field label="Tipul firmei">
          <div className="flex flex-wrap gap-2">
            {chip("", "Toate")}
            {kinds.map((k) => chip(k.code, k.label))}
          </div>
        </Field>
        <PlaceField label="Sediul" cityName="oras" countryName="tara" countries={countries} defaultPlace={startPlace(f.country, f.city, countries)} placeholder="Oriunde" />
        <Field label="Flota de cel puțin" htmlFor="fir-flota">
          <div className={inputBox}>
            <input id="fir-flota" name="flota" inputMode="numeric" defaultValue={f.minFleet ?? ""} placeholder="oricât" className={inputCls} />
            <span className="text-sm font-bold text-[#6B717A]">camioane</span>
          </div>
        </Field>
        <Check name="verificat" label="Doar firme verificate ANAF" defaultChecked={f.verified} />
        <button type="submit" className={`${btnCls("md", "dark")} w-full`}>
          <Skew tone="dark" />
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          Arată firmele
        </button>
        {n > 0 && (
          <Link href="/firme" className="text-center text-sm font-bold text-brand-600 underline underline-offset-[3px]">
            Șterge filtrele
          </Link>
        )}
      </form>
    </div>
  );
}
