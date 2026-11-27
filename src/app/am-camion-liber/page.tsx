import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LIST_SIZE, listOpenLoads } from "@/lib/cereri";
import { parseFilters } from "@/lib/queries";
import { vehicleShort } from "@/lib/vehicles";
import { fmtDate, fmtInt, fmtNum } from "@/lib/format";
import { MetaItem, PageHead, ReqCard, RouteLine, Skew, ago, btnCls, isFresh } from "@/components/cereri/ui";
import { AcceptLoad } from "@/components/cereri/client";
import { CereriShell } from "@/components/cereri/pages";
import { ListFilters } from "@/components/cereri/ListFilters";
import { Pagination } from "@/components/ui";

export const metadata: Metadata = {
  title: "Marfă care caută camion",
  description: "Cererile firmelor cu marfă. Acceptă una potrivită pentru camionul tău și firma primește datele tale.",
  alternates: { canonical: "/am-camion-liber" },
};

type SP = Record<string, string | string[] | undefined>;

export default async function AmCamionLiberPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const verified = sp.verificat === "1";
  const newId = Number(sp.nou) || 0;
  const [user, { items, total }] = await Promise.all([
    getCurrentUser(),
    listOpenLoads({ fromCity: f.fromCity, toCity: f.toCity, date: f.date, vehicle: f.vehicle, weight: f.weight, verified, page: f.page }),
  ]);
  const pages = Math.max(1, Math.ceil(total / LIST_SIZE));
  const qs = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "pagina" && k !== "nou") q.set(k, v);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return `/am-camion-liber${s ? `?${s}` : ""}`;
  };

  return (
    <CereriShell>
      <PageHead
        crumb="Am camion liber"
        title="Marfă care caută camion"
        sub="Cererile publicate de firmele cu marfă, la „Caută camion”. Acceptă una potrivită pentru camionul tău: cererea trece în „acceptată”, iar firma primește datele tale."
      />
      <div className="grid grid-cols-1 items-start gap-[26px] pt-[26px] pb-[70px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <ListFilters action="/am-camion-liber" p={{ fromCity: f.fromCity, toCity: f.toCity, date: f.date, vehicle: f.vehicle, weight: f.weight, verified }} weightLabel="Greutate până la" />
        <div>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <b className="text-[15px] font-bold">
              <span className="font-logo font-normal">{fmtInt(total)}</span> {total === 1 ? "cerere de transport" : "cereri de transport"}
            </b>
            <Link href="/cauta-camion" className={btnCls("sm", "light")}>
              <Skew tone="light" />
              Ai marfă? Publică o cerere
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="rounded-2xl border border-[#E4E0DE] bg-white px-6 py-10 text-center text-[15px] text-[#3A404A]">Nicio cerere pentru filtrele alese. Încearcă fără unele filtre.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((l) => {
                const mine = user?.company.id === l.companyId;
                const size = [l.weightT != null && `${fmtNum(l.weightT)} t`, l.ldm != null && `${fmtNum(l.ldm)} m`].filter(Boolean).join(" · ");
                return (
                  <ReqCard
                    key={l.id}
                    id={`c${l.id}`}
                    highlight={l.id === newId}
                    mine={mine}
                    route={<RouteLine from={l.fromCity} fromCc={l.fromCountry} to={l.toCity} toCc={l.toCountry} isNew={isFresh(l.createdAt)} />}
                    meta={
                      <>
                        <MetaItem icon="cal">Încărcare {fmtDate(l.loadDate)}</MetaItem>
                        {size && <MetaItem icon="box">{size}</MetaItem>}
                        <MetaItem icon="truck">Camion: {vehicleShort(l.vehicle)}</MetaItem>
                        {l.goods && <span className="text-[#6B717A]">{l.goods}</span>}
                      </>
                    }
                    company={mine ? `${l.companyName} · cererea ta` : l.companyName}
                    verified={l.verified}
                    when={ago(l.createdAt)}
                    right={
                      <>
                        {l.price ? (
                          <div className="text-right font-logo text-[22px]">
                            {fmtInt(l.price)} €<small className="block font-sans text-xs font-medium text-[#6B717A]">preț oferit</small>
                          </div>
                        ) : (
                          <div className="text-[14.5px] font-bold text-[#6B717A]">Așteaptă oferte</div>
                        )}
                        {mine ? (
                          <span className="inline-flex h-[30px] items-center rounded-full bg-[#EEEAE9] px-3 text-[13px] font-bold text-graphite">Cererea ta · așteaptă</span>
                        ) : (
                          <AcceptLoad
                            id={l.id}
                            hasPrice={l.price != null}
                            loggedIn={!!user}
                            next={qs(f.page)}
                            summary={
                              <>
                                <span className="flex flex-wrap items-center gap-1.5 text-[16px] font-extrabold">
                                  {l.fromCity} ({l.fromCountry}) → {l.toCity} ({l.toCountry})
                                </span>
                                <span className="mt-1 block font-medium text-[#3A404A]">
                                  Încărcare {fmtDate(l.loadDate)}
                                  {size && ` · ${size}`} · {vehicleShort(l.vehicle)}
                                  {l.price ? ` · ${fmtInt(l.price)} €` : ""}
                                </span>
                                <span className="mt-1 block">{l.companyName}</span>
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
