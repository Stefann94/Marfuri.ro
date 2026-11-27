import Link from "next/link";
import type { LoadListItem, TruckListItem } from "@/lib/queries";
import { fmtDate, fmtNum, fmtPrice } from "@/lib/format";
import { getRef } from "@/lib/ref";
import { ArrowRight } from "./icons";
import { EmptyState, Place, VerifiedBadge } from "./ui";

const loadGrid = "md:grid md:grid-cols-[5.5rem_minmax(0,1fr)_8.5rem_7.5rem_6.5rem] md:items-center md:gap-4";
const truckGrid = "md:grid md:grid-cols-[7.5rem_minmax(0,1fr)_8.5rem_7.5rem] md:items-center md:gap-4";

function Route({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {a}
      <ArrowRight className="shrink-0 text-slate-400" />
      {b}
    </span>
  );
}

export async function LoadList({ items, empty }: { items: LoadListItem[]; empty?: React.ReactNode }) {
  const { vehicleShort } = await getRef();
  if (items.length === 0) return <EmptyState title="Nicio ofertă de marfă activă aici">{empty}</EmptyState>;
  return (
    <div className="card overflow-hidden">
      <div className={`hidden border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase ${loadGrid}`}>
        <span>Încărcare</span>
        <span>Rută</span>
        <span>Vehicul</span>
        <span>Marfă</span>
        <span className="text-right">Preț</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((l) => (
          <li key={l.id}>
            <Link
              href={`/marfa/${l.id}`}
              prefetch={false}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-brand-50/50 ${loadGrid}`}
            >
              <span className="w-full md:order-2 md:w-auto">
                <Route a={<Place city={l.fromCity} country={l.fromCountry} />} b={<Place city={l.toCity} country={l.toCountry} />} />
                <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{l.companyName}</span>
                  {l.companyVerified && <VerifiedBadge small />}
                </span>
              </span>
              <span className="text-sm font-medium text-slate-700 md:order-1">{fmtDate(l.loadDate)}</span>
              <span className="text-sm text-slate-600 md:order-3">{vehicleShort(l.vehicle)}</span>
              <span className="text-sm text-slate-600 tabular-nums md:order-4">
                {l.weightT != null && `${fmtNum(l.weightT)} t`}
                {l.ldm != null && <span className="text-slate-400"> · {fmtNum(l.ldm)} m</span>}
              </span>
              <span className="ml-auto text-sm font-semibold tabular-nums md:order-5 md:ml-0 md:text-right">
                {fmtPrice(l.price, l.currency) ?? <span className="font-normal text-slate-400">La cerere</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function TruckList({ items, empty }: { items: TruckListItem[]; empty?: React.ReactNode }) {
  const { vehicleShort } = await getRef();
  if (items.length === 0) return <EmptyState title="Niciun camion liber aici">{empty}</EmptyState>;
  return (
    <div className="card overflow-hidden">
      <div className={`hidden border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase ${truckGrid}`}>
        <span>Disponibil</span>
        <span>Liber în → direcția</span>
        <span>Vehicul</span>
        <span className="text-right">Capacitate</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((t) => (
          <li key={t.id}>
            <Link
              href={`/camioane/${t.id}`}
              prefetch={false}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3.5 transition-colors hover:bg-brand-50/50 ${truckGrid}`}
            >
              <span className="w-full md:order-2 md:w-auto">
                <Route a={<Place city={t.fromCity} country={t.fromCountry} />} b={<Place city={t.toCity} country={t.toCountry} />} />
                <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span className="truncate">{t.companyName}</span>
                  {t.companyVerified && <VerifiedBadge small />}
                </span>
              </span>
              <span className="text-sm font-medium text-slate-700 md:order-1">
                {fmtDate(t.availableFrom)}
                {t.availableTo && <span className="text-slate-400"> – {fmtDate(t.availableTo)}</span>}
              </span>
              <span className="text-sm text-slate-600 md:order-3">{vehicleShort(t.vehicle)}</span>
              <span className="ml-auto text-sm text-slate-600 tabular-nums md:order-4 md:ml-0 md:text-right">
                {t.capacityT != null && `${fmtNum(t.capacityT)} t`}
                {t.ldm != null && <span className="text-slate-400"> · {fmtNum(t.ldm)} m</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
