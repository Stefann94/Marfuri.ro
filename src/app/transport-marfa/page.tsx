import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui";
import { ArrowRight } from "@/components/icons";
import { getRef } from "@/lib/ref";

export const metadata: Metadata = {
  title: "Rute de transport marfă în Europa – România, Germania, Italia și altele",
  description: "Toate rutele de transport marfă din și spre România: oferte de marfă, camioane libere și prețuri medii pentru fiecare țară din Europa.",
  alternates: { canonical: "/transport-marfa" },
};

export default async function RoutesIndexPage() {
  const { countryName, countryPath, routePath, popular: POPULAR_DESTINATIONS, countries: COUNTRIES } = await getRef();
  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[{ name: "Rute", href: "/transport-marfa" }]} />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Rute de transport marfă</h1>
        <p className="mt-3 text-lg text-slate-600">
          Alege ruta care te interesează ca să vezi ofertele de marfă active, camioanele libere și prețul median al transporturilor publicate.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <RouteGrid title="Din România spre" links={["RO", ...POPULAR_DESTINATIONS].map((c) => ({ href: routePath("RO", c), label: c === "RO" ? "Transport intern România" : `România → ${countryName(c)}` }))} />
        <RouteGrid title="Spre România din" links={POPULAR_DESTINATIONS.map((c) => ({ href: routePath(c, "RO"), label: `${countryName(c)} → România` }))} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Transport marfă pe țări</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTRIES.map((c) => (
            <li key={c.code}>
              <Link href={countryPath(c.code)} className="card group flex items-center justify-between px-4 py-3 hover:border-brand-200">
                <span className="font-medium text-slate-800">Transport {c.name}</span>
                <ArrowRight className="text-slate-300 group-hover:text-brand-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RouteGrid({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm text-slate-700 hover:text-brand-700">
              {l.label} <ArrowRight className="text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
