import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { countryRoutes, searchLoads, searchTrucks } from "@/lib/queries";
import { fmtInt } from "@/lib/format";
import { LoadList, TruckList } from "@/components/Listings";
import { Breadcrumbs } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { getRef } from "@/lib/ref";
import { featuredCities } from "@/lib/places";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ from: string }> };

async function resolve(params: Props["params"]) {
  const c = (await getRef()).countryBySlug((await params).from);
  if (!c) notFound();
  return c;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { countryName, countryBySlug, routePath } = await getRef();
  const c = await resolve(params);
  return {
    title: `Transport marfă ${c.name}: curse din și spre ${c.name}, camioane libere`,
    description: `Oferte de transport marfă din ${c.name} și spre ${c.name}, camioane libere și rute active. Firme verificate, publicare gratuită.`,
    alternates: { canonical: `/transport-marfa/${c.slug}` },
  };
}

export default async function CountryPage({ params }: Props) {
  const { countryName, countryBySlug, routePath } = await getRef();
  const c = await resolve(params);
  const [outbound, inbound, fromLoads, toLoads, trucksHere] = await Promise.all([
    countryRoutes(c.code, "from"),
    countryRoutes(c.code, "to"),
    searchLoads({ from: c.code, page: 1 }, 10),
    searchLoads({ to: c.code, page: 1 }, 10),
    searchTrucks({ from: c.code, page: 1 }, 8),
  ]);
  const cities = (await featuredCities()).filter((x) => x.country === c.code);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[{ name: "Rute", href: "/transport-marfa" }, { name: c.name, href: `/transport-marfa/${c.slug}` }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Transport marfă {c.name}</h1>
        <p className="mt-3 text-lg text-slate-600">
          Curse de transport din {c.name} spre Europa și din Europa spre {c.name}: {fmtInt(fromLoads.total)} oferte de marfă cu încărcare în {c.name}, {fmtInt(toLoads.total)} cu descărcare în {c.name} și {fmtInt(trucksHere.total)} camioane libere.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RouteCounts title={`Din ${c.name} spre`} rows={outbound.map((r) => ({ href: routePath(c.code, r.country), label: r.country === c.code ? `Intern ${c.name}` : countryName(r.country), n: r.n }))} />
        <RouteCounts title={`Spre ${c.name} din`} rows={inbound.filter((r) => r.country !== c.code).map((r) => ({ href: routePath(r.country, c.code), label: countryName(r.country), n: r.n }))} />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Marfă cu încărcare în {c.name}</h2>
          <Link href={`/marfa?din=${c.code}`} className="btn btn-ghost text-brand-700">Toate <ArrowRight /></Link>
        </div>
        <LoadList items={fromLoads.items} />
      </section>
      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Marfă cu descărcare în {c.name}</h2>
          <Link href={`/marfa?spre=${c.code}`} className="btn btn-ghost text-brand-700">Toate <ArrowRight /></Link>
        </div>
        <LoadList items={toLoads.items} />
      </section>
      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Camioane libere în {c.name}</h2>
          <Link href={`/camioane?din=${c.code}`} className="btn btn-ghost text-brand-700">Toate <ArrowRight /></Link>
        </div>
        <TruckList items={trucksHere.items} />
      </section>

      {cities.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Transport marfă pe orașe din {c.name}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cities.map((city) => (
              <li key={city.slug}>
                <Link href={`/orase/${city.slug}`} className="inline-block rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:text-brand-700 hover:ring-brand-200">
                  {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RouteCounts({ title, rows }: { title: string; rows: { href: string; label: string; n: number }[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Momentan nu sunt oferte active.</p>
      ) : (
        <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
          {rows.slice(0, 14).map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm hover:text-brand-700">
                <span>{r.label}</span>
                <span className="text-slate-500 tabular-nums">{fmtInt(r.n)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
