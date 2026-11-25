import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLoad, searchLoads } from "@/lib/queries";
import { countryName, routePath } from "@/lib/geo";
import { vehicleLabel } from "@/lib/vehicles";
import { fmtDate, fmtNum, fmtPrice } from "@/lib/format";
import { LoadList } from "@/components/Listings";
import { CompanyCard, RouteHero, Specs } from "@/components/Detail";
import { Breadcrumbs } from "@/components/ui";

// ISR: pagina se generează la prima vizită și se reîmprospătează la 5 minute.
export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

async function load(params: Props["params"]) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const row = await getLoad(id);
  if (!row) notFound();
  return row;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { load: l, isActive } = await load(params);
  const what = [l.weightT != null && `${fmtNum(l.weightT)} t`, vehicleLabel(l.vehicle).toLowerCase()].filter(Boolean).join(", ");
  return {
    title: `Marfă ${l.fromCity} → ${l.toCity}, ${fmtDate(l.loadDate)} (${what})`,
    description: `Ofertă de transport marfă din ${l.fromCity} (${countryName(l.fromCountry)}) în ${l.toCity} (${countryName(l.toCountry)}), încărcare ${fmtDate(l.loadDate)}. ${l.goods ?? ""} ${what}.`.trim(),
    alternates: { canonical: `/marfa/${l.id}` },
    robots: isActive ? undefined : { index: false, follow: true },
  };
}

export default async function LoadDetailPage({ params }: Props) {
  const { load: l, company, isActive } = await load(params);
  const similar = (await searchLoads({ from: l.fromCountry, to: l.toCountry, page: 1 }, 6)).items.filter((x) => x.id !== l.id).slice(0, 5);
  const route = routePath(l.fromCountry, l.toCountry);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs
        items={[
          { name: "Marfă", href: "/marfa" },
          { name: `${countryName(l.fromCountry)} – ${countryName(l.toCountry)}`, href: route },
          { name: `${l.fromCity} → ${l.toCity}`, href: `/marfa/${l.id}` },
        ]}
      />
      {!isActive && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Această ofertă a expirat. Vezi mai jos oferte active pe aceeași rută.
        </p>
      )}
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <p className="eyebrow">Ofertă de marfă #{l.id}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
            Transport marfă {l.fromCity} → {l.toCity}
          </h1>
          <p className="mt-2 text-slate-600">
            {l.goods ?? "Marfă generală"} · {vehicleLabel(l.vehicle)}
          </p>

          <div className="mt-6">
            <RouteHero
              from={{ city: l.fromCity, country: l.fromCountry, date: l.loadDate, dateLabel: "Încărcare" }}
              to={{ city: l.toCity, country: l.toCountry, date: l.unloadDate, dateLabel: "Descărcare" }}
            />
          </div>

          <h2 className="mt-8 mb-3 text-lg font-bold">Detalii marfă</h2>
          <Specs
            rows={[
              ["Preț oferit", fmtPrice(l.price, l.currency) ?? "La cerere"],
              ["Vehicul", vehicleLabel(l.vehicle)],
              ["Greutate", l.weightT != null ? `${fmtNum(l.weightT)} t` : null],
              ["Metri liniari (LDM)", l.ldm != null ? `${fmtNum(l.ldm)} m` : null],
              ["Volum", l.volumeM3 != null ? `${fmtNum(l.volumeM3)} m³` : null],
              ["Tip marfă", l.goods],
            ]}
          />
          {l.notes && (
            <>
              <h2 className="mt-8 mb-3 text-lg font-bold">Observații</h2>
              <p className="card p-5 leading-relaxed whitespace-pre-line text-slate-700">{l.notes}</p>
            </>
          )}
        </article>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CompanyCard {...company} />
        </div>
      </div>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold">
            Alte oferte {countryName(l.fromCountry)} → {countryName(l.toCountry)}
          </h2>
          <Link href={route} className="text-sm font-medium text-brand-700 hover:underline">Vezi toată ruta →</Link>
        </div>
        <LoadList items={similar} />
      </section>
    </div>
  );
}
