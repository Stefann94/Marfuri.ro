import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LIST_SIZE, listOpenTrucks, myOpenLoads } from "@/lib/cereri";
import { parseFilters } from "@/lib/queries";
import { listCountries } from "@/lib/places";
import { getRef } from "@/lib/ref";
import { fmtDate, fmtInt, fmtNum } from "@/lib/format";
import { MetaItem, PageHead, ReqCard, RouteLine, Skew, ago, btnCls, isFresh } from "@/components/cereri/ui";
import { AcceptTruck } from "@/components/cereri/client";
import { CereriShell } from "@/components/cereri/pages";
import { ListFilters } from "@/components/cereri/ListFilters";
import { Pagination } from "@/components/ui";

export const metadata: Metadata = {
  title: "Camioane libere care caută marfă",
  description: "Transportatorii care au anunțat un camion liber. Acceptă unul potrivit pentru marfa ta și transportatorul primește datele tale.",
  alternates: { canonical: "/am-marfa" },
};

type SP = Record<string, string | string[] | undefined>;

export default async function AmMarfaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ref = await getRef();
  const { vehicleShort, countryName } = ref;
  const f = parseFilters(sp, ref);
  const verified = sp.verificat === "1";
  const newId = Number(sp.nou) || 0;
  const user = await getCurrentUser();
  const [{ items, total }, mine, countries] = await Promise.all([
    listOpenTrucks({ from: f.from, to: f.to, fromCity: f.fromCity, toCity: f.toCity, date: f.date, vehicle: f.vehicle, weight: f.weight, verified, page: f.page }),
    user ? myOpenLoads(user.company.id) : Promise.resolve([]),
    listCountries(),
  ]);
  const myLoads = mine.map((l) => ({ id: l.id, label: `${l.fromCity} → ${l.toCity}, ${fmtDate(l.loadDate)}${l.weightT ? `, ${fmtNum(l.weightT)} t` : ""}` }));
  const pages = Math.max(1, Math.ceil(total / LIST_SIZE));
  const qs = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "pagina" && k !== "nou") q.set(k, v);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return `/am-marfa${s ? `?${s}` : ""}`;
  };

  return (
    <CereriShell>
      <PageHead
        crumb="Am marfă de transportat"
        title="Camioane libere care caută marfă"
        sub="Transportatorii care au anunțat un camion liber, la „Caută marfă”. Acceptă unul potrivit pentru marfa ta: îi trimiți marfa, iar el primește datele tale."
      />
      <div className="grid grid-cols-1 items-start gap-[26px] pt-[26px] pb-[70px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <ListFilters action="/am-marfa" p={{ from: f.from, to: f.to, fromCity: f.fromCity, toCity: f.toCity, date: f.date, vehicle: f.vehicle, weight: f.weight, verified }} countries={countries} weightLabel="Capacitate de cel puțin" />
        <div>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <b className="text-[15px] font-bold">
              <span className="font-logo font-normal">{fmtInt(total)}</span> {total === 1 ? "camion liber" : "camioane libere"}
            </b>
            <Link href="/cauta-marfa" className={btnCls("sm", "light")}>
              <Skew tone="light" />
              Ai camion? Anunță-l
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="rounded-2xl border border-[#E4E0DE] bg-white px-6 py-10 text-center text-[15px] text-[#3A404A]">Niciun camion pentru filtrele alese. Încearcă fără unele filtre.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((t) => {
                const own = user?.company.id === t.companyId;
                const until = t.availableTo && t.availableTo !== t.availableFrom ? ` – ${fmtDate(t.availableTo)}` : "";
                const size = [t.capacityT != null && `${fmtNum(t.capacityT)} t`, t.ldm != null && `${fmtNum(t.ldm)} m`].filter(Boolean).join(" · ");
                return (
                  <ReqCard
                    key={t.id}
                    id={`c${t.id}`}
                    highlight={t.id === newId}
                    mine={own}
                    route={<RouteLine from={t.fromCity} fromCc={t.fromCountry} to={t.toCity} toCc={t.toCountry} toName={countryName(t.toCountry)} anyDest={!t.toCountry} isNew={isFresh(t.createdAt)} />}
                    meta={
                      <>
                        <MetaItem icon="cal">
                          Liber {fmtDate(t.availableFrom)}
                          {until}
                        </MetaItem>
                        <MetaItem icon="truck">{vehicleShort(t.vehicle)}</MetaItem>
                        {size && <MetaItem icon="weight">{size}</MetaItem>}
                      </>
                    }
                    company={own ? `${t.companyName} · camionul tău` : t.companyName}
                    verified={t.verified}
                    when={ago(t.createdAt)}
                    right={
                      <>
                        <div className="text-[14.5px] font-bold text-[#6B717A]">Caută marfă</div>
                        {own ? (
                          <span className="inline-flex h-[30px] items-center rounded-full bg-[#EEEAE9] px-3 text-[13px] font-bold text-graphite">Camionul tău · așteaptă</span>
                        ) : (
                          <AcceptTruck
                            id={t.id}
                            loggedIn={!!user}
                            next={qs(f.page)}
                            myLoads={myLoads}
                            summary={
                              <>
                                <span className="block text-[16px] font-extrabold">
                                  {t.fromCity} ({t.fromCountry}) → {t.toCountry ? `${t.toCity || countryName(t.toCountry)} (${t.toCountry})` : "orice destinație"}
                                </span>
                                <span className="mt-1 block font-medium text-[#3A404A]">
                                  Liber {fmtDate(t.availableFrom)}
                                  {until} · {vehicleShort(t.vehicle)}
                                  {size && ` · ${size}`}
                                </span>
                                <span className="mt-1 block">{t.companyName}</span>
                              </>
                            }
                          />
                        )}
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-6">
              <Pagination page={f.page} totalPages={pages} href={qs} />
            </div>
          )}
        </div>
      </div>
    </CereriShell>
  );
}
