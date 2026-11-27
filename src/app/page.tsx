import Link from "next/link";
import { connection } from "next/server";
import { SITE, absUrl } from "@/lib/site";
import { getFaqs, getRef } from "@/lib/ref";
import { fmtInt } from "@/lib/format";
import { routeSupply, searchLoads, searchTrucks, siteStats, topRoutes } from "@/lib/queries";
import { listCountries } from "@/lib/places";
import { HeroPrimEcran } from "@/components/home/HeroPrimEcran";
import { LoadList, TruckList } from "@/components/Listings";
import { FaqList, JsonLd } from "@/components/ui";
import { ArrowRight, Bell, Bolt, Box, Shield, Truck } from "@/components/icons";

export const metadata = {
  alternates: { canonical: "/" },
};


export default async function HomePage() {
  await connection(); // conținut proaspăt la fiecare cerere; agregatele sunt în cache
  const [ref, faq, stats, latestLoads, latestTrucks, routes, countries, supply] = await Promise.all([
    getRef(),
    getFaqs("home"),
    siteStats(),
    searchLoads({}, 8),
    searchTrucks({}, 6),
    topRoutes(12),
    listCountries(),
    routeSupply(15),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "@id": absUrl("/#org"), name: SITE.name, url: absUrl("/"), logo: absUrl("/icon.svg") },
            {
              "@type": "WebSite",
              "@id": absUrl("/#website"),
              name: SITE.name,
              url: absUrl("/"),
              inLanguage: "ro-RO",
              publisher: { "@id": absUrl("/#org") },
              potentialAction: {
                "@type": "SearchAction",
                target: { "@type": "EntryPoint", urlTemplate: `${absUrl("/marfa")}?oras_din={search_term_string}` },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }}
      />

      {/* HERO: primul ecran (varianta 1) */}
      <HeroPrimEcran stats={stats} countries={countries} routes={supply} vehicles={ref.vehicles} weights={ref.weights} />

      {/* ULTIMELE OFERTE */}
      <section className="container-page mt-16 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Pentru transportatori</p>
              <h2 className="section-title mt-1">Marfă de transportat</h2>
            </div>
            <Link href="/marfa" className="btn btn-ghost text-brand-700">
              Toate ofertele <ArrowRight />
            </Link>
          </div>
          <LoadList items={latestLoads.items} />
        </div>
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Pentru expeditori</p>
              <h2 className="section-title mt-1">Camioane libere</h2>
            </div>
            <Link href="/camioane" className="btn btn-ghost text-brand-700">
              Toate <ArrowRight />
            </Link>
          </div>
          <TruckList items={latestTrucks.items} />
        </div>
      </section>

      {/* AVANTAJE */}
      <section className="container-page mt-24">
        <div className="max-w-2xl">
          <p className="eyebrow">De ce {SITE.name}</p>
          <h2 className="section-title mt-1">Construită pentru cei care chiar fac transport</h2>
          <p className="mt-3 text-slate-600">Fără interfețe învechite și fără costuri ascunse. Tot ce îți trebuie ca să umpli camionul sau să trimiți marfa azi.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Shield, title: "Firme verificate", text: "Fiecare CUI e validat automat la ANAF. Vezi din prima cu cine lucrezi." },
            { icon: Bolt, title: "Rapidă pe telefon", text: "Se încarcă instant, chiar și pe 4G slab, din cabină sau din depozit." },
            { icon: Box, title: "Publicare gratuită", text: "Pui oferta de marfă sau camionul liber în mai puțin de un minut." },
            { icon: Bell, title: "Alerte pe rută", text: "Primești notificare când apare marfă pe ruta camionului tău. (în curând)" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <Icon />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RUTE */}
      <section className="container-page mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Cele mai active rute</p>
            <h2 className="section-title mt-1">Transport marfă pe rutele populare</h2>
          </div>
          <Link href="/transport-marfa" className="btn btn-ghost text-brand-700">
            Toate rutele <ArrowRight />
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(routes.length ? routes : ref.popular.map((c) => ({ from: "RO", to: c, n: 0 }))).map((r) => (
            <li key={`${r.from}-${r.to}`}>
              <Link href={ref.routePath(r.from, r.to)} className="card group flex items-center justify-between gap-3 px-5 py-4 transition hover:border-brand-200 hover:shadow-md">
                <span className="font-semibold text-slate-900">
                  {ref.countryName(r.from)} <span className="text-slate-400">→</span> {ref.countryName(r.to)}
                </span>
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  {r.n > 0 && <span className="tabular-nums">{fmtInt(r.n)} oferte</span>}
                  <ArrowRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* CUM FUNCȚIONEAZĂ */}
      <section className="container-page mt-24 grid gap-6 lg:grid-cols-2">
        <HowTo
          icon={<Truck />}
          eyebrow="Ai camion"
          title="Găsește marfă pentru camionul tău"
          steps={["Caută după țară, oraș, dată și tipul de vehicul.", "Deschide oferta și vezi detaliile complete și firma.", "Sună direct expeditorul și negociați cursa."]}
          cta={{ href: "/marfa", label: "Vezi marfa disponibilă" }}
        />
        <HowTo
          icon={<Box />}
          eyebrow="Ai marfă"
          title="Găsește transportator în câteva minute"
          steps={["Publică oferta gratuit: rută, dată, greutate, vehicul.", "Transportatorii interesați te contactează direct.", "Sau caută tu printre camioanele libere de pe rută."]}
          cta={{ href: "/camioane", label: "Vezi camioanele libere" }}
          accent
        />
      </section>

      {/* FAQ */}
      <section className="container-page mt-24 grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="eyebrow">Întrebări frecvente</p>
          <h2 className="section-title mt-1">Despre bursa de transport</h2>
          <p className="mt-3 text-slate-600">Tot ce trebuie să știi înainte să publici prima ofertă.</p>
        </div>
        <FaqList items={faq} />
      </section>
    </>
  );
}

function HowTo(props: { icon: React.ReactNode; eyebrow: string; title: string; steps: string[]; cta: { href: string; label: string }; accent?: boolean }) {
  return (
    <div className="card p-7 sm:p-9">
      <span className={`inline-flex size-11 items-center justify-center rounded-xl ${props.accent ? "bg-orange-50 text-accent-600 ring-orange-100" : "bg-brand-50 text-brand-700 ring-brand-100"} ring-1`}>
        {props.icon}
      </span>
      <p className="eyebrow mt-5">{props.eyebrow}</p>
      <h2 className="mt-1 text-xl font-bold sm:text-2xl">{props.title}</h2>
      <ol className="mt-5 space-y-3">
        {props.steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-slate-600">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <Link href={props.cta.href} className={`btn mt-7 ${props.accent ? "btn-accent" : "btn-primary"}`}>
        {props.cta.label} <ArrowRight />
      </Link>
    </div>
  );
}
