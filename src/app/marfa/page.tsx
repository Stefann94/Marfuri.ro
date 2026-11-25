import type { Metadata } from "next";
import Link from "next/link";
import { filtersToQuery, hasFilters, parseFilters, searchLoads, PAGE_SIZE } from "@/lib/queries";
import { describeFilters } from "@/lib/describe";
import { fmtInt } from "@/lib/format";
import { routePath } from "@/lib/geo";
import { SearchForm } from "@/components/SearchForm";
import { LoadList } from "@/components/Listings";
import { Breadcrumbs, Pagination } from "@/components/ui";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const desc = describeFilters(f);
  // Paginile cu filtre arbitrare nu se indexează; paginile de rută (/transport-marfa/...) sunt cele canonice pentru SEO.
  return {
    title: desc ? `Marfă de transportat ${desc}` : "Marfă de transportat – oferte de transport actuale",
    description: "Oferte actuale de marfă de transportat în România și Europa, de la firme verificate. Filtrează după rută, dată și tipul vehiculului.",
    alternates: { canonical: "/marfa" },
    robots: hasFilters(f) || f.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function LoadsPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const { items, total } = await searchLoads(f);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const desc = describeFilters(f);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[{ name: "Marfă de transportat", href: "/marfa" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Marfă de transportat {desc && <span className="text-slate-500">{desc}</span>}</h1>
          <p className="mt-2 text-slate-600">{fmtInt(total)} oferte active{f.page > 1 && ` · pagina ${f.page}`}</p>
        </div>
        <Link href="/cont/inregistrare" className="btn btn-accent">+ Publică marfă gratuit</Link>
      </div>
      <div className="card mt-6 p-4 sm:p-5">
        <SearchForm defaults={f} mode="loads" />
      </div>
      {f.from && f.to && !f.fromCity && !f.toCity && (
        <p className="mt-4 text-sm text-slate-600">
          Vezi și pagina rutei:{" "}
          <Link className="font-medium text-brand-700 hover:underline" href={routePath(f.from, f.to)}>
            prețuri medii și statistici pentru această rută
          </Link>
        </p>
      )}
      <div className="mt-6">
        <LoadList items={items} empty={<>Încearcă să lărgești filtrele sau <Link className="text-brand-700 underline" href="/camioane">caută printre camioanele libere</Link>.</>} />
      </div>
      <Pagination page={f.page} totalPages={totalPages} href={(p) => `/marfa${filtersToQuery(f, p)}`} />
    </div>
  );
}
