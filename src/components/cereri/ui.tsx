import Link from "next/link";
import type { ReactNode } from "react";

/* Componentele paginilor de cereri (Caută camion / Caută marfă / Am camion liber / Am marfă),
   în stilul machetelor alese: alb + grafit + roșu, Russo One la titluri, butoane înclinate. */

export const inputBox =
  "flex h-[50px] items-center gap-2.5 rounded-[11px] border-[1.5px] border-[#D9D2D0] bg-white px-3.5 focus-within:border-graphite focus-within:shadow-[0_0_0_3px_rgb(42_46_53/0.1)]";
export const inputCls = "min-w-0 flex-1 bg-transparent text-[15.5px] text-ink outline-none placeholder:text-[#8A9099]";

/** Butoane înclinate, ca pe site: roșu (principal), grafit, alb cu contur. */
export function Skew({ tone = "red", className = "" }: { tone?: "red" | "dark" | "light"; className?: string }) {
  const bg =
    tone === "red"
      ? "bg-gradient-to-b from-[#DC2A21] to-[#B8190F] shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.16)] group-hover:brightness-110"
      : tone === "dark"
        ? "bg-gradient-to-b from-[#3A3F47] to-[#1B1E23] group-hover:brightness-125"
        : "bg-white shadow-[inset_0_0_0_1.5px_#CFC8C6] group-hover:shadow-[inset_0_0_0_1.5px_#2A2E35]";
  return <span aria-hidden className={`absolute inset-0 -z-10 -skew-x-[14deg] rounded-[4px] transition ${bg} ${className}`} />;
}

export const btnCls = (size: "sm" | "md" | "lg" = "md", tone: "red" | "dark" | "light" = "red") =>
  `group relative isolate inline-flex cursor-pointer items-center justify-center gap-2.5 font-extrabold whitespace-nowrap disabled:cursor-wait disabled:opacity-70 ${
    tone === "light" ? "text-ink" : "text-white"
  } ${size === "sm" ? "h-[38px] px-4 text-sm" : size === "lg" ? "h-[54px] px-7 text-[16.5px]" : "h-[46px] px-[22px] text-[15px]"}`;

export function PageHead({ crumb, title, sub }: { crumb: string; title: string; sub: ReactNode }) {
  return (
    <div className="pt-[30px] pb-2">
      <nav aria-label="Navigare" className="text-[13.5px] font-medium text-[#6B717A]">
        <Link href="/" className="hover:text-brand-600">Acasă</Link> / {crumb}
      </nav>
      <h1 className="mt-2 font-logo text-[25px] leading-[1.15] font-normal tracking-normal text-ink sm:text-[34px]">{title}</h1>
      <p className="mt-2 max-w-[760px] text-[15px] text-[#3A404A] sm:text-[16.5px]">{sub}</p>
    </div>
  );
}

export function FormSection({ n, title, hint, children }: { n: number; title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-[#E4E0DE] px-4 pt-[18px] pb-5 first:border-t-0 sm:px-6 sm:pt-[22px] sm:pb-6">
      <h2 className="mb-1 flex items-center gap-2.5 font-logo text-lg font-normal tracking-normal text-ink">
        <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-graphite text-[13px] text-white">{n}</span>
        {title}
      </h2>
      {hint && <p className="mb-4 text-sm text-[#6B717A]">{hint}</p>}
      {children}
    </section>
  );
}

export function Field({ label, optional, children, className = "", htmlFor }: { label: string; optional?: boolean; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[11.5px] font-extrabold tracking-[0.06em] text-[#4A4F57] uppercase">
        {label}
        {optional && <em className="font-semibold tracking-normal text-[#6B717A] normal-case not-italic"> (opțional)</em>}
      </label>
      {children}
    </div>
  );
}

/** Opțiune „chip”: checkbox sau radio nativ, stilizat (fără JavaScript). */
export function Chip({ name, value, label, type = "checkbox", defaultChecked }: { name: string; value: string; label: string; type?: "checkbox" | "radio"; defaultChecked?: boolean }) {
  return (
    <label className="cursor-pointer select-none">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="inline-flex h-[38px] items-center rounded-[10px] border-[1.5px] border-[#D9D2D0] bg-white px-3.5 text-sm font-bold text-ink transition-colors peer-checked:border-graphite peer-checked:bg-graphite peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500 hover:border-graphite">
        {label}
      </span>
    </label>
  );
}

/** Bifă pătrată roșie, ca în machetă. */
export function Check({ name, label, defaultChecked, value = "1" }: { name: string; label: string; defaultChecked?: boolean; value?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-[9px] text-[14.5px] font-semibold text-ink select-none">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex size-5 items-center justify-center rounded-md border-[1.5px] border-[#BDB5B3] bg-white text-transparent peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand-500">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      {label}
    </label>
  );
}

export function VerifiedPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-[#E6F4EA] px-2 text-xs font-bold whitespace-nowrap text-[#157F3B]">
      <Shield />
      Verificată ANAF
    </span>
  ) : (
    <span className="inline-flex h-[22px] items-center rounded-full bg-[#F1EFEE] px-2 text-xs font-bold whitespace-nowrap text-[#6B717A]">Neverificată încă</span>
  );
}

export const Shield = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

export const Ico = ({ d, size = 15, className = "" }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`}>
    <path d={d} />
  </svg>
);

export const ICONS = {
  cal: "M3.5 5h17v15h-17zM3.5 10h17M8 3v4M16 3v4",
  box: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9",
  truck: "M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8zM6 17.5a1.8 1.8 0 1 0 .01 0M17 17.5a1.8 1.8 0 1 0 .01 0",
  weight: "M6.5 8h11l2.5 12H4zM12 3a2.5 2.5 0 1 0 .01 0",
  right: "M5 12h14M13 6l6 6-6 6",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 .01 0",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
};

export const CC = ({ code }: { code: string | null }) =>
  code ? <span className="rounded-[5px] bg-[#EEEAE9] px-1.5 py-0.5 text-[11px] font-extrabold tracking-[0.04em] text-graphite">{code}</span> : null;

/** Cardul unei cereri, în listă și în panoul contului. */
export function ReqCard({
  route,
  meta,
  company,
  verified,
  when,
  right,
  mine,
  highlight,
  id,
  compact,
}: {
  route: ReactNode;
  meta: ReactNode;
  company: string;
  verified: boolean;
  when: string;
  right: ReactNode;
  mine?: boolean;
  highlight?: boolean;
  id?: string;
  /** previzualizare îngustă: totul pe o coloană */
  compact?: boolean;
}) {
  return (
    <article
      id={id}
      className={`grid scroll-mt-24 grid-cols-1 items-center gap-3 rounded-2xl border bg-white p-4 transition hover:border-[#BDB5B3] hover:shadow-[0_12px_28px_-20px_rgb(20_22_26/0.45)] ${compact ? "" : "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_210px] md:gap-5 md:px-5 md:py-[18px]"} ${
        highlight || mine ? "border-graphite shadow-[0_0_0_3px_rgb(42_46_53/0.08)]" : "border-[#E4E0DE]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-[7px] text-[17px] font-extrabold text-ink">{route}</div>
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13.5px] font-semibold text-[#3A404A]">{meta}</div>
      </div>
      <div className="min-w-0">
        <b className="block text-[14.5px] font-bold text-ink">{company}</b>
        <VerifiedPill ok={verified} />
        <div className="mt-1 text-[12.5px] font-medium text-[#6B717A]">{when}</div>
      </div>
      <div className={`flex flex-row items-center justify-between gap-2.5 ${compact ? "" : "md:flex-col md:items-end"}`}>{right}</div>
    </article>
  );
}

export function MetaItem({ icon, children }: { icon: keyof typeof ICONS; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Ico d={ICONS[icon]} className="text-[#6B717A]" />
      {children}
    </span>
  );
}

/** Ruta unei cereri. `toName` (numele țării) se afișează când lipsește orașul de destinație. */
export function RouteLine({ from, fromCc, to, toCc, toName, anyDest, isNew }: { from: string; fromCc: string; to?: string | null; toCc?: string | null; toName?: string; anyDest?: boolean; isNew?: boolean }) {
  return (
    <>
      {from}
      <CC code={fromCc} />
      <Ico d={ICONS.right} size={17} className="text-brand-600" />
      {anyDest ? (
        <span className="font-bold text-[#6B717A]">Orice destinație</span>
      ) : (
        <>
          {to || toName || toCc}
          <CC code={toCc ?? null} />
        </>
      )}
      {isNew && <span className="inline-flex h-5 items-center rounded-[5px] bg-brand-600 px-[7px] text-[10.5px] font-extrabold tracking-[0.06em] text-white">NOU</span>}
    </>
  );
}

const rtf = new Intl.RelativeTimeFormat("ro", { numeric: "auto" });
const dShort = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "Europe/Bucharest" });

/** „acum 12 minute”, „acum 3 ore”, „ieri”, „26 nov.” */
export function ago(d: Date) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "chiar acum";
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86_400) return rtf.format(-Math.round(s / 3600), "hour");
  if (s < 2 * 86_400) return "ieri";
  return dShort.format(d);
}

export const isFresh = (d: Date) => Date.now() - d.getTime() < 3600_000;
