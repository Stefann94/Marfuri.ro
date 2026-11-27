import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { myAccepted, myPublished } from "@/lib/cereri";
import { closeOwn } from "@/lib/cereri-actions";
import { vehicleShort } from "@/lib/vehicles";
import { countryName } from "@/lib/geo";
import { fmtDate, fmtInt, fmtNum } from "@/lib/format";
import { CC, Ico, ICONS, Skew, VerifiedPill, ago, btnCls } from "@/components/cereri/ui";
import { CereriShell } from "@/components/cereri/pages";

export const metadata: Metadata = { title: "Contul meu", robots: { index: false, follow: false } };

const STATUS: Record<string, [string, string]> = {
  active: ["Așteaptă", "bg-[#EEEAE9] text-graphite"],
  accepted: ["Acceptată", "bg-[#E6F4EA] text-[#157F3B]"],
  closed: ["Închisă", "bg-[#F1EFEE] text-[#6B717A]"],
};

function Phone({ phone }: { phone: string | null }) {
  if (!phone) return null;
  return (
    <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 font-extrabold text-brand-600 underline underline-offset-[3px]">
      <Ico d={ICONS.phone} size={16} />
      {phone}
    </a>
  );
}

function Section({ title, empty, children, count }: { title: string; empty: React.ReactNode; children: React.ReactNode; count: number }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-logo text-[20px] font-normal tracking-normal">
        {title} <span className="text-[#6B717A]">({count})</span>
      </h2>
      {count === 0 ? <div className="rounded-2xl border border-[#E4E0DE] bg-white px-6 py-8 text-center text-[15px] text-[#3A404A]">{empty}</div> : <div className="flex flex-col gap-3">{children}</div>}
    </section>
  );
}

function Row({ route, meta, status, children, close }: { route: React.ReactNode; meta: React.ReactNode; status?: string; children?: React.ReactNode; close?: () => Promise<void> }) {
  const [label, cls] = STATUS[status ?? "accepted"] ?? STATUS.active;
  return (
    <article className="rounded-2xl border border-[#E4E0DE] bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[7px] text-[17px] font-extrabold">{route}</div>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[13.5px] font-semibold text-[#3A404A]">{meta}</div>
        </div>
        <div className="flex items-center gap-2.5">
          {status && <span className={`inline-flex h-[30px] items-center rounded-full px-3 text-[13px] font-bold ${cls}`}>{label}</span>}
          {close && (
            <form action={close}>
              <button type="submit" className="cursor-pointer text-[13.5px] font-bold text-[#6B717A] underline underline-offset-[3px] hover:text-brand-600">
                Închide
              </button>
            </form>
          )}
        </div>
      </div>
      {children && <div className="mt-3 rounded-xl border border-[#E4E0DE] bg-[#F7F5F4] px-4 py-3 text-[14.5px]">{children}</div>}
    </article>
  );
}

const route = (from: string, fc: string, to: string | null, tc: string | null) => (
  <>
    {from}
    <CC code={fc} />
    <Ico d={ICONS.right} size={17} className="text-brand-600" />
    {tc ? (
      <>
        {to || countryName(tc)}
        <CC code={tc} />
      </>
    ) : (
      <span className="font-bold text-[#6B717A]">Orice destinație</span>
    )}
  </>
);

export default async function AccountPage() {
  const user = await requireUser("/cont");
  const [pub, acc] = await Promise.all([myPublished(user.company.id), myAccepted(user.company.id)]);
  const published = pub.loads.length + pub.trucks.length;
  const accepted = acc.loads.length + acc.trucks.length;

  return (
    <CereriShell>
      <div className="pt-[30px] pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium text-[#6B717A]">Contul meu</p>
            <h1 className="mt-1 font-logo text-[28px] leading-tight font-normal tracking-normal sm:text-[34px]">{user.company.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[14.5px] text-[#3A404A]">
              <VerifiedPill ok={user.company.verified} />
              {user.company.vatCode && <span>CUI {user.company.vatCode}</span>}
              <span>
                {user.name} · {user.phone}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Link href="/cauta-camion" className={btnCls("md")}>
              <Skew />
              Caută camion
            </Link>
            <Link href="/cauta-marfa" className={btnCls("md", "dark")}>
              <Skew tone="dark" />
              Caută marfă
            </Link>
          </div>
        </div>

        <Section
          title="Ce am publicat"
          count={published}
          empty={
            <>
              Încă nu ai publicat nimic. Ai marfă? <Link href="/cauta-camion" className="font-bold text-brand-600 underline">Caută camion</Link>. Ai camion liber?{" "}
              <Link href="/cauta-marfa" className="font-bold text-brand-600 underline">Caută marfă</Link>.
            </>
          }
        >
          {pub.loads.map((l) => (
            <Row
              key={`l${l.id}`}
              status={l.status}
              route={route(l.fromCity, l.fromCountry, l.toCity, l.toCountry)}
              meta={
                <>
                  <span>Marfă · încărcare {fmtDate(l.date)}</span>
                  {l.weightT != null && <span>{fmtNum(l.weightT)} t</span>}
                  <span>{vehicleShort(l.vehicle)}</span>
                  <span>{l.price ? `${fmtInt(l.price)} €` : "aștepți oferte"}</span>
                  <span className="text-[#6B717A]">publicată {ago(l.createdAt)}</span>
                </>
              }
              close={l.status === "active" ? closeOwn.bind(null, "load", l.id) : undefined}
            >
              {l.status === "accepted" && l.accCompany && (
                <>
                  <b>Acceptată de {l.accCompany}</b> {l.accVerified && <VerifiedPill ok />} {l.acceptedAt && <span className="text-[#6B717A]">· {ago(l.acceptedAt)}</span>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {l.accName && <span>{l.accName}</span>}
                    <Phone phone={l.accPhone} />
                    {l.accEmail && <a href={`mailto:${l.accEmail}`} className="underline">{l.accEmail}</a>}
                  </div>
                  {l.acceptNote && <div className="mt-1 text-[#3A404A]">Camion: {l.acceptNote}</div>}
                  {l.acceptPrice && <div className="mt-1 text-[#3A404A]">Preț propus: {fmtInt(l.acceptPrice)} €</div>}
                </>
              )}
            </Row>
          ))}
          {pub.trucks.map((t) => (
            <Row
              key={`t${t.id}`}
              status={t.status}
              route={route(t.fromCity, t.fromCountry, t.toCity, t.toCountry)}
              meta={
                <>
                  <span>Camion liber · de la {fmtDate(t.date)}</span>
                  <span>{vehicleShort(t.vehicle)}</span>
                  {t.capacityT != null && <span>{fmtNum(t.capacityT)} t</span>}
                  <span className="text-[#6B717A]">publicat {ago(t.createdAt)}</span>
                </>
              }
              close={t.status === "active" ? closeOwn.bind(null, "truck", t.id) : undefined}
            >
              {t.status === "accepted" && t.accCompany && (
                <>
                  <b>Acceptat de {t.accCompany}</b> {t.accVerified && <VerifiedPill ok />} {t.acceptedAt && <span className="text-[#6B717A]">· {ago(t.acceptedAt)}</span>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {t.accName && <span>{t.accName}</span>}
                    <Phone phone={t.accPhone} />
                    {t.accEmail && <a href={`mailto:${t.accEmail}`} className="underline">{t.accEmail}</a>}
                  </div>
                  {t.acceptNote && <div className="mt-1 text-[#3A404A]">Marfa: {t.acceptNote}</div>}
                  {t.acceptPrice && <div className="mt-1 text-[#3A404A]">Preț propus: {fmtInt(t.acceptPrice)} €</div>}
                </>
              )}
            </Row>
          ))}
        </Section>

        <Section
          title="Ce am acceptat"
          count={accepted}
          empty={
            <>
              Încă n-ai acceptat nimic. Vezi <Link href="/am-camion-liber" className="font-bold text-brand-600 underline">marfa care caută camion</Link> sau{" "}
              <Link href="/am-marfa" className="font-bold text-brand-600 underline">camioanele libere</Link>.
            </>
          }
        >
          {acc.loads.map((l) => (
            <Row
              key={`al${l.id}`}
              route={route(l.fromCity, l.fromCountry, l.toCity, l.toCountry)}
              meta={
                <>
                  <span>Cursă · încărcare {fmtDate(l.date)}</span>
                  {l.weightT != null && <span>{fmtNum(l.weightT)} t</span>}
                  <span>{l.price ? `${fmtInt(l.price)} €` : l.acceptPrice ? `ai propus ${fmtInt(l.acceptPrice)} €` : "preț de stabilit"}</span>
                </>
              }
            >
              <b>{l.company}</b> {l.verified && <VerifiedPill ok />}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                {l.contactName && <span>{l.contactName}</span>}
                <Phone phone={l.contactPhone} />
              </div>
            </Row>
          ))}
          {acc.trucks.map((t) => (
            <Row
              key={`at${t.id}`}
              route={route(t.fromCity, t.fromCountry, t.toCity, t.toCountry)}
              meta={
                <>
                  <span>Camion · liber de la {fmtDate(t.date)}</span>
                  <span>{vehicleShort(t.vehicle)}</span>
                  {t.capacityT != null && <span>{fmtNum(t.capacityT)} t</span>}
                </>
              }
            >
              <b>{t.company}</b> {t.verified && <VerifiedPill ok />}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                {t.contactName && <span>{t.contactName}</span>}
                <Phone phone={t.contactPhone} />
              </div>
              {t.acceptNote && <div className="mt-1 text-[#3A404A]">Marfa trimisă: {t.acceptNote}</div>}
            </Row>
          ))}
        </Section>

        <form action="/cont/iesire" method="post" className="mt-10">
          <button type="submit" className="cursor-pointer text-[14.5px] font-bold text-[#6B717A] underline underline-offset-[3px] hover:text-brand-600">
            Ieși din cont
          </button>
        </form>
      </div>
    </CereriShell>
  );
}
