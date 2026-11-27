import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompany } from "@/lib/queries";
import { getRef } from "@/lib/ref";
import { fmtMonthYear } from "@/lib/format";
import { absUrl } from "@/lib/site";
import { LoadList, TruckList } from "@/components/Listings";
import { Breadcrumbs, JsonLd, StatTile, VerifiedBadge } from "@/components/ui";


type Props = { params: Promise<{ slug: string }> };


async function resolve(params: Props["params"]) {
  const data = await getCompany((await params).slug);
  if (!data) notFound();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company: c } = await resolve(params);
  const { kindLabel, countryName } = await getRef();
  return {
    title: `${c.name} – ${kindLabel(c.kind)} din ${c.city}`,
    description: `${c.name}, ${kindLabel(c.kind).toLowerCase()} din ${c.city}, ${countryName(c.country)}. Oferte de transport active și date despre firmă.`,
    alternates: { canonical: `/firme/${c.slug}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { company: c, loads, trucks } = await resolve(params);
  const { kindLabel, countryName } = await getRef();
  return (
    <div className="container-page pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: c.name,
          url: absUrl(`/firme/${c.slug}`),
          ...(c.website ? { sameAs: [c.website] } : {}),
          ...(c.vatCode ? { vatID: c.vatCode } : {}),
          address: { "@type": "PostalAddress", addressLocality: c.city, addressCountry: c.country },
        }}
      />
      <Breadcrumbs items={[{ name: "Firme", href: "/transport-marfa" }, { name: c.name, href: `/firme/${c.slug}` }]} />
      <header className="card mt-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{c.name}</h1>
          {c.verifiedAt && <VerifiedBadge />}
        </div>
        <p className="mt-2 text-slate-600">
          {kindLabel(c.kind)} · {c.city}, {countryName(c.country)} · membru din {fmtMonthYear(c.createdAt)}
        </p>
        {c.description && <p className="mt-4 max-w-3xl leading-relaxed text-slate-700">{c.description}</p>}
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {c.vatCode && (
            <div>
              <dt className="inline text-slate-500">CUI: </dt>
              <dd className="inline font-medium">{c.vatCode}</dd>
            </div>
          )}
          {c.regNumber && (
            <div>
              <dt className="inline text-slate-500">Nr. Reg. Com.: </dt>
              <dd className="inline font-medium">{c.regNumber}</dd>
            </div>
          )}
          {c.website && (
            <div>
              <dt className="inline text-slate-500">Website: </dt>
              <dd className="inline">
                <a href={c.website} rel="nofollow noopener" target="_blank" className="font-medium text-brand-700 hover:underline">{c.website.replace(/^https?:\/\//, "")}</a>
              </dd>
            </div>
          )}
        </dl>
      </header>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Oferte de marfă active" value={String(loads.length)} />
        <StatTile label="Camioane libere" value={String(trucks.length)} />
        {c.fleetSize ? <StatTile label="Flotă" value={`${c.fleetSize} vehicule`} /> : null}
      </div>
      {loads.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Oferte de marfă publicate</h2>
          <LoadList items={loads} />
        </section>
      )}
      {trucks.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Camioane libere</h2>
          <TruckList items={trucks} />
        </section>
      )}
    </div>
  );
}
