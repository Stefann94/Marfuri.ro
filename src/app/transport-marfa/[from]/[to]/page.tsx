import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTRIES, POPULAR_DESTINATIONS, countryBySlug, countryName, countryPath, isPopularRoute, routePath } from "@/lib/geo";
import { routeStats, searchLoads, searchTrucks } from "@/lib/queries";
import { routeArticle, routeFaq, routeIntro } from "@/lib/seo-content";
import { fmtInt } from "@/lib/format";
import { LoadList, TruckList } from "@/components/Listings";
import { Breadcrumbs, FaqList, StatTile } from "@/components/ui";
import { ArrowRight } from "@/components/icons";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ from: string; to: string }> };

async function resolve(params: Props["params"]) {
  const p = await params;
  const a = countryBySlug(p.from);
  const b = countryBySlug(p.to);
  if (!a || !b) notFound();
  return { a, b };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await resolve(params);
  const s = await routeStats(a.code, b.code);
  const domestic = a.code === b.code;
  const title = domestic ? `Transport marfă intern ${a.name} – curse și camioane libere` : `Transport marfă ${a.name} – ${b.name}: curse și camioane libere`;
  return {
    title,
    description: domestic
      ? `${fmtInt(s.loads)} oferte de transport marfă intern în ${a.name} și ${fmtInt(s.trucks)} camioane libere. Firme verificate, publicare gratuită.`
      : `${fmtInt(s.loads)} oferte de marfă din ${a.name} în ${b.name} și ${fmtInt(s.trucks)} camioane libere pe rută.${s.median ? ` Preț median ~${fmtInt(s.median)} €.` : ""} Firme verificate, publicare gratuită.`,
    alternates: { canonical: routePath(a.code, b.code) },
    // rutele rare fără nicio ofertă nu se indexează (conținut subțire)
    robots: s.loads + s.trucks === 0 && !isPopularRoute(a.code, b.code) ? { index: false, follow: true } : undefined,
  };
}

export default async function RoutePage({ params }: Props) {
  const { a, b } = await resolve(params);
  const [s, loadsRes, trucksRes] = await Promise.all([
    routeStats(a.code, b.code),
    searchLoads({ from: a.code, to: b.code, page: 1 }, 20),
    searchTrucks({ from: a.code, to: b.code, page: 1 }, 8),
  ]);
  const domestic = a.code === b.code;
  const h1 = domestic ? `Transport marfă intern în ${a.name}` : `Transport marfă ${a.name} – ${b.name}`;
  const query = `?din=${a.code}&spre=${b.code}`;
  const related = POPULAR_DESTINATIONS.filter((c) => c !== b.code && c !== a.code).slice(0, 8);

  return (
    <div className="container-page pt-8">
      <Breadcrumbs
        items={[
          { name: "Rute", href: "/transport-marfa" },
          { name: a.name, href: countryPath(a.code) },
          { name: domestic ? "Intern" : b.name, href: routePath(a.code, b.code) },
        ]}
      />
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">{h1}</h1>
        <p className="mt-3 text-lg text-slate-600">{routeIntro(a.code, b.code, s)}</p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Oferte de marfă" value={fmtInt(s.loads)} hint="active acum" />
        <StatTile label="Camioane libere" value={fmtInt(s.trucks)} hint="pe această rută" />
        <StatTile label="Preț median" value={s.median ? `${fmtInt(s.median)} €` : "—"} hint="ultimele 90 de zile" />
        <StatTile label="Interval uzual" value={s.p25 && s.p75 ? `${fmtInt(s.p25)}–${fmtInt(s.p75)} €` : "—"} hint="50% dintre oferte" />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Marfă de transportat {domestic ? `în ${a.name}` : `${a.name} → ${b.name}`}</h2>
          <Link href={`/marfa${query}`} className="btn btn-ghost text-brand-700">Filtrează toate <ArrowRight /></Link>
        </div>
        <LoadList items={loadsRes.items} empty={<>Fii primul care publică o ofertă pe această rută. <Link className="text-brand-700 underline" href="/cont/inregistrare">Publică gratuit</Link></>} />
      </section>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Camioane libere {domestic ? `în ${a.name}` : `din ${a.name} spre ${b.name}`}</h2>
          <Link href={`/camioane${query}`} className="btn btn-ghost text-brand-700">Toate camioanele <ArrowRight /></Link>
        </div>
        <TruckList items={trucksRes.items} />
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <article className="prose-lite">
          {routeArticle(a.code, b.code, s).map((sec) => (
            <section key={sec.h}>
              <h2>{sec.h}</h2>
              {sec.p.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <h2>Întrebări frecvente</h2>
          <FaqList items={routeFaq(a.code, b.code, s)} />
        </article>

        <aside className="space-y-6">
          {!domestic && (
            <Link href={routePath(b.code, a.code)} className="card flex items-center justify-between gap-3 p-5 transition hover:border-brand-200">
              <span>
                <span className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">Ruta de retur</span>
                <span className="mt-1 block font-semibold text-slate-900">{b.name} → {a.name}</span>
              </span>
              <ArrowRight className="text-brand-600" />
            </Link>
          )}
          <LinkBox title={`Din ${a.name} spre`} links={[a.code === "RO" ? "RO" : null, ...related].filter(Boolean).map((c) => ({ href: routePath(a.code, c!), label: c === a.code ? `Intern ${a.name}` : countryName(c) }))} />
          <LinkBox title={`Spre ${b.name} din`} links={related.filter((c) => c !== b.code).map((c) => ({ href: routePath(c, b.code), label: countryName(c) }))} />
          <LinkBox title="Toate țările" links={COUNTRIES.slice(0, 12).map((c) => ({ href: countryPath(c.code), label: `Transport ${c.name}` }))} />
        </aside>
      </div>
    </div>
  );
}

function LinkBox({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
