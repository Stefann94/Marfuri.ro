import type { Metadata } from "next";
import Link from "next/link";
import { filtersToQuery, hasFilters, parseFilters, searchTrucks, PAGE_SIZE } from "@/lib/queries";
import { describeFilters } from "@/lib/describe";
import { fmtInt } from "@/lib/format";
import { SearchForm } from "@/components/SearchForm";
import { listCountries } from "@/lib/places";
import { TruckList } from "@/components/Listings";
import { Breadcrumbs, Pagination } from "@/components/ui";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const desc = describeFilters(f);
  return {
    title: desc ? `Camioane libere ${desc}` : "Camioane libere – transportatori disponibili azi",
    description: "Camioane libere și transportatori disponibili în România și Europa. Găsește rapid un camion pentru marfa ta, după rută, dată și tipul vehiculului.",
    alternates: { canonical: "/camioane" },
    robots: hasFilters(f) || f.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function TrucksPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const { items, total } = await searchTrucks(f);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const desc = describeFilters(f);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[{ name: "Camioane libere", href: "/camioane" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Camioane libere {desc && <span className="text-slate-500">{desc}</span>}</h1>
          <p className="mt-2 text-slate-600">{fmtInt(total)} camioane disponibile{f.page > 1 && ` · pagina ${f.page}`}</p>
        </div>
        <Link href="/cont/inregistrare" className="btn btn-primary">+ Anunță camion liber</Link>
      </div>
      <div className="card mt-6 p-4 sm:p-5">
        <SearchForm defaults={f} mode="trucks" countries={await listCountries()} />
      </div>
      <div className="mt-6">
        <TruckList items={items} empty={<>Încearcă alte filtre sau <Link className="text-brand-700 underline" href="/cont/inregistrare">publică oferta ta de marfă</Link> și lasă transportatorii să te găsească.</>} />
      </div>
      <Pagination page={f.page} totalPages={totalPages} href={(p) => `/camioane${filtersToQuery(f, p)}`} />
    </div>
  );
}
