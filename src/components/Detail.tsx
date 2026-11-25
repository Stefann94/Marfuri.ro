import Link from "next/link";
import { countryName } from "@/lib/geo";
import { fmtDateLong, fmtMonthYear } from "@/lib/format";
import { Calendar, Lock, Pin } from "./icons";
import { CountryTag, VerifiedBadge } from "./ui";

export function RouteHero(props: {
  from: { city: string; country: string; date?: string; dateLabel: string };
  to: { city: string | null; country: string | null; date?: string | null; dateLabel: string };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <Stop {...props.from} />
      <div aria-hidden className="hidden items-center gap-1 sm:flex">
        <span className="h-px w-10 bg-slate-300" />
        <span className="size-2 rotate-45 border-t-2 border-r-2 border-slate-400" />
      </div>
      <Stop city={props.to.city} country={props.to.country} date={props.to.date ?? undefined} dateLabel={props.to.dateLabel} />
    </div>
  );
}

function Stop({ city, country, date, dateLabel }: { city: string | null; country: string | null; date?: string; dateLabel: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 ring-inset">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        <Pin /> {dateLabel}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-xl font-bold text-slate-900">
        {city ?? (country ? countryName(country) : "Orice destinație")} <CountryTag code={country} />
      </p>
      {country && city && <p className="text-sm text-slate-500">{countryName(country)}</p>}
      {date && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Calendar className="text-slate-400" /> {fmtDateLong(date)}
        </p>
      )}
    </div>
  );
}

export function Specs({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-white px-4 py-3.5">
          <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{k}</dt>
          <dd className="mt-1 font-semibold text-slate-900">{v ?? <span className="font-normal text-slate-400">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

const KIND: Record<string, string> = { carrier: "Transportator", forwarder: "Casă de expediții", shipper: "Expeditor / producător" };

export function CompanyCard(props: { name: string; slug: string; city: string; country: string; kind: string; verifiedAt: Date | null; createdAt: Date; fleetSize?: number | null }) {
  return (
    <aside className="card p-6">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Publicat de</p>
      <Link href={`/firme/${props.slug}`} className="mt-2 block text-lg font-bold text-slate-900 hover:text-brand-700">{props.name}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        {props.verifiedAt && <VerifiedBadge />}
        <span>{KIND[props.kind] ?? props.kind}</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        <li>📍 {props.city}, {countryName(props.country)}</li>
        {props.fleetSize ? <li>🚛 Flotă: {props.fleetSize} vehicule</li> : null}
        <li>🗓️ Membru din {fmtMonthYear(props.createdAt)}</li>
      </ul>
      <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 ring-inset">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <Lock className="text-slate-500" /> Date de contact
        </p>
        <p className="mt-1 text-sm text-slate-600">Telefonul și e-mailul sunt vizibile gratuit după autentificare.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/cont/inregistrare" className="btn btn-primary flex-1">Creează cont gratuit</Link>
          <Link href="/cont/autentificare" className="btn btn-outline flex-1">Am cont</Link>
        </div>
      </div>
    </aside>
  );
}
