import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTruck, searchLoads, searchTrucks } from "@/lib/queries";
import { countryName, countryPath } from "@/lib/geo";
import { vehicleLabel } from "@/lib/vehicles";
import { fmtDate, fmtNum } from "@/lib/format";
import { LoadList, TruckList } from "@/components/Listings";
import { CompanyCard, RouteHero, Specs } from "@/components/Detail";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const row = await getTruck(id);
  if (!row) notFound();
  return row;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { truck: t, isActive } = await load(params);
  const dest = t.toCity ?? (t.toCountry ? countryName(t.toCountry) : "orice destinație");
  return {
    title: `Camion liber ${t.fromCity} → ${dest}, ${fmtDate(t.availableFrom)} (${vehicleLabel(t.vehicle).toLowerCase()})`,
    description: `Camion liber în ${t.fromCity} (${countryName(t.fromCountry)}), disponibil din ${fmtDate(t.availableFrom)}, direcția ${dest}. ${vehicleLabel(t.vehicle)}${t.capacityT ? `, ${fmtNum(t.capacityT)} t` : ""}.`,
    alternates: { canonical: `/camioane/${t.id}` },
    robots: isActive ? undefined : { index: false, follow: true },
  };
}

export default async function TruckDetailPage({ params }: Props) {
  const { truck: t, company, isActive } = await load(params);
  const [matchingLoads, otherTrucks] = await Promise.all([
    searchLoads({ from: t.fromCountry, to: t.toCountry ?? undefined, page: 1 }, 5),
    searchTrucks({ from: t.fromCountry, page: 1 }, 6),
  ]);
  const dest = t.toCity ?? (t.toCountry ? countryName(t.toCountry) : "orice destinație");

  return (
    <div className="container-page pt-8">
      <Breadcrumbs
        items={[
          { name: "Camioane libere", href: "/camioane" },
          { name: countryName(t.fromCountry), href: countryPath(t.fromCountry) },
          { name: `${t.fromCity} → ${dest}`, href: `/camioane/${t.id}` },
        ]}
      />
      {!isActive && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">Acest anunț a expirat.</p>
      )}
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <p className="eyebrow">Camion liber #{t.id}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
            Camion liber în {t.fromCity}, direcția {dest}
          </h1>
          <p className="mt-2 text-slate-600">{vehicleLabel(t.vehicle)}</p>
          <div className="mt-6">
            <RouteHero
              from={{ city: t.fromCity, country: t.fromCountry, date: t.availableFrom, dateLabel: "Liber din" }}
              to={{ city: t.toCity, country: t.toCountry, date: t.availableTo, dateLabel: t.availableTo ? "Disponibil până la" : "Direcția" }}
            />
          </div>
          <h2 className="mt-8 mb-3 text-lg font-bold">Detalii vehicul</h2>
          <Specs
            rows={[
              ["Vehicul", vehicleLabel(t.vehicle)],
              ["Capacitate", t.capacityT != null ? `${fmtNum(t.capacityT)} t` : null],
              ["Metri liniari (LDM)", t.ldm != null ? `${fmtNum(t.ldm)} m` : null],
            ]}
          />
          {t.notes && (
            <>
              <h2 className="mt-8 mb-3 text-lg font-bold">Observații</h2>
              <p className="card p-5 leading-relaxed whitespace-pre-line text-slate-700">{t.notes}</p>
            </>
          )}
        </article>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CompanyCard {...company} />
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-4 text-xl font-bold">Marfă potrivită pentru acest camion</h2>
        <LoadList items={matchingLoads.items} />
      </section>
      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold">Alte camioane libere în {countryName(t.fromCountry)}</h2>
          <Link href={`/camioane?din=${t.fromCountry}`} className="text-sm font-medium text-brand-700 hover:underline">Vezi toate →</Link>
        </div>
        <TruckList items={otherTrucks.items.filter((x) => x.id !== t.id).slice(0, 5)} />
      </section>
    </div>
  );
}
