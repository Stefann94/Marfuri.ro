"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { fmtInt, fmtPrice } from "@/lib/format";

type Place = { country: string; city: string };
type LiveItem = { id: number; from: Place; to: Place; vehicle: string; weightT: number | null; price: number | null; currency: string; at: string };
type LiveStats = { loads: number; trucks: number; companies: number; verified: number };
type Live = { stats: LiveStats | null; items: LiveItem[] };

/* O singură cerere pe pagină, împărțită între bandă și cifrele din meniu. */
let cache: Live | null = null;
let pending: Promise<Live> | null = null;
function loadLive(): Promise<Live> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetch("/api/live")
    .then((r) => (r.ok ? r.json() : { stats: null, items: [] }))
    .catch(() => ({ stats: null, items: [] }))
    .then((d: Live) => (cache = d));
  return pending;
}

export function useLive() {
  const [data, setData] = useState<Live | null>(cache);
  useEffect(() => {
    let alive = true;
    loadLive().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** Textul mic de sub un buton din meniu, cu cifra live când a sosit. */
export function LiveCount({ stat, label, fallback }: { stat: keyof LiveStats; label: string; fallback?: string }) {
  const n = useLive()?.stats?.[stat];
  return <>{n != null ? `${fmtInt(n)} ${label}` : (fallback ?? label)}</>;
}

function ago(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 60) return `acum ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "acum o oră" : `acum ${h} ore`;
  const d = Math.round(h / 24);
  return d === 1 ? "ieri" : `acum ${d} zile`;
}

const Flag = ({ code }: { code: string }) => (
  <span className="rounded-[4px] bg-[#D9DDE2] px-[5px] py-px text-[10px] font-extrabold text-[#14161A] md:text-[10.5px]">{code}</span>
);

function Item({ l, hidden }: { l: LiveItem; hidden?: boolean }) {
  const price = fmtPrice(l.price, l.currency);
  return (
    <Link
      href={`/marfa/${l.id}`}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
      className="inline-flex items-center gap-2 border-r border-[#2F343C] px-4 transition-colors hover:bg-white/5 md:px-[22px]"
    >
      <Flag code={l.from.country} />
      <span className="text-white">{l.from.city}</span>
      <span className="text-[#FF8A80]" aria-label="spre">→</span>
      <Flag code={l.to.country} />
      <span className="text-white">{l.to.city}</span>
      <span className="hidden text-[#8A9099] sm:inline">
        {l.vehicle}
        {l.weightT ? ` ${String(l.weightT).replace(".", ",")} t` : ""}
      </span>
      {price && <span className="font-extrabold text-white">{price}</span>}
      <span className="text-[#7D838C]">{ago(l.at)}</span>
    </Link>
  );
}

/** Banda „Bursă live”: ultimele mărfuri publicate curg continuu, ca la bursă. */
export function LiveTicker() {
  const live = useLive();
  const items = live?.items ?? [];
  const stats = live?.stats;

  return (
    <div className="flex h-[30px] items-stretch overflow-hidden bg-[#14161A] text-[11.5px] font-semibold text-[#C9CDD2] md:h-9 md:text-[12.5px]">
      <Link
        href="/marfa"
        className="relative z-10 flex shrink-0 items-center gap-2 bg-brand-600 pr-[22px] pl-3 text-[10px] font-extrabold tracking-[0.14em] text-white [clip-path:polygon(0_0,100%_0,calc(100%-11px)_100%,0_100%)] md:pr-[26px] md:pl-[18px] md:text-[11px]"
      >
        <span className="size-[7px] rounded-full bg-white motion-safe:animate-[mf-pulse_1.6s_ease-out_infinite]" />
        LIVE
        <span className="sr-only">: ultimele mărfuri publicate</span>
      </Link>
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_32px,#000_calc(100%-32px),transparent)]">
        {items.length > 0 ? (
          <div className="flex h-full w-max items-stretch whitespace-nowrap hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-safe:animate-[mf-ticker_var(--dur)_linear_infinite]" style={{ "--dur": `${items.length * 7}s` } as CSSProperties}>
            {items.map((l) => (
              <Item key={l.id} l={l} />
            ))}
            {items.map((l) => (
              <Item key={`b${l.id}`} l={l} hidden />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center px-4 text-[#8A9099]">{live ? "Bursa de transport pentru România și UE" : "Se încarcă ultimele oferte…"}</div>
        )}
      </div>
      {stats && (
        <div className="hidden shrink-0 items-center gap-3.5 border-l border-[#2F343C] px-[18px] whitespace-nowrap lg:flex">
          <Link href="/marfa" className="hover:text-white"><b className="text-white">{fmtInt(stats.loads)}</b> mărfuri</Link>
          <Link href="/camioane" className="hover:text-white"><b className="text-white">{fmtInt(stats.trucks)}</b> camioane libere</Link>
        </div>
      )}
    </div>
  );
}
