import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cityBySlug, citiesOf, countryName, countryPath } from "@/lib/geo";
import { loadsForCity, trucksInCity } from "@/lib/queries";
import { LoadList, TruckList } from "@/components/Listings";
import { Breadcrumbs } from "@/components/ui";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ city: string }> };

async function resolve(params: Props["params"]) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  const [from, to, trucks] = await Promise.all([loadsForCity(city.slug, "from"), loadsForCity(city.slug, "to"), trucksInCity(city.slug)]);
  return { city, from, to, trucks };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, from, to, trucks } = await resolve(params);
  return {
    title: `Transport marfă ${city.name}: curse și camioane libere`,
    description: `Oferte de transport marfă cu încărcare sau descărcare în ${city.name} (${countryName(city.country)}) și camioane libere în zonă. Firme verificate, publicare gratuită.`,
    alternates: { canonical: `/orase/${city.slug}` },
    robots: from.length + to.length + trucks.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function CityPage({ params }: Props) {
  const { city, from, to, trucks } = await resolve(params);
  const neighbours = citiesOf(city.country).filter((c) => c.slug !== city.slug);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs
        items={[
          { name: "Rute", href: "/transport-marfa" },
          { name: countryName(city.country), href: countryPath(city.country) },
          { name: city.name, href: `/orase/${city.slug}` },
        ]}
      />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Transport marfă {city.name}</h1>
        <p className="mt-3 text-lg text-slate-600">
          Curse cu încărcare și descărcare în {city.name}, plus camioane libere în zonă, publicate de transportatori și expeditori verificați.
        </p>
      </header>
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Marfă cu încărcare în {city.name}</h2>
        <LoadList items={from} />
      </section>
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Marfă cu descărcare în {city.name}</h2>
        <LoadList items={to} />
      </section>
      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">Camioane libere în {city.name}</h2>
        <TruckList items={trucks} />
      </section>
      {neighbours.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Alte orașe din {countryName(city.country)}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {neighbours.map((c) => (
              <li key={c.slug}>
                <Link href={`/orase/${c.slug}`} className="inline-block rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:text-brand-700">{c.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
