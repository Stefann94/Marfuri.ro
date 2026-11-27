"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

export type TraseuRand = { key: string; from: string; to: string; href: string; loads: number; trucks: number; hint: string; hot: boolean };

/** Cât stă un ecran înainte să treacă la următorul (trebuie să fie egal cu durata animației `trasee-fill`). */
const SECUNDE = 7;

const WIDE = "(min-width: 90rem)"; // breakpoint-ul `wide` (1440 px)
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
/** 5 trasee pe ecran de la 1440 px în sus, 3 în rest (pe server pornim cu 5; CSS-ul ascunde rândurile 4–5 până la hidratare). */
const useWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => true);

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8A80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

function Bar({ value, max, red, label }: { value: number; max: number; red?: boolean; label: string }) {
  return (
    <div className="grid grid-cols-[1fr_116px] items-center gap-2.5">
      <span aria-hidden className="h-[7px] overflow-hidden rounded-full bg-white/10">
        <span
          className={`block h-full rounded-full ${red ? "bg-gradient-to-r from-[#DC2A21] to-[#FF5A4F]" : "bg-[#E6E9EC]"}`}
          style={{ width: `${max ? Math.max(2, Math.round((value / max) * 100)) : 0}%` }}
        />
      </span>
      <span className="text-xs font-semibold whitespace-nowrap text-[#C9CDD2]">
        <b className="font-logo text-sm font-normal text-white tabular-nums">{value}</b> {label}
      </span>
    </div>
  );
}

/** Împarte traseele în ecrane; ultimul ecran se completează cu primele trasee, ca toate ecranele să aibă aceeași înălțime. */
function pagini(rows: TraseuRand[], per: number) {
  if (rows.length <= per) return [rows];
  const out: TraseuRand[][] = [];
  for (let i = 0; i < rows.length; i += per) {
    const p = rows.slice(i, i + per);
    for (let k = 0; p.length < per; k++) p.push(rows[k]);
    out.push(p);
  }
  return out;
}

/**
 * Derulatorul cu trasee: la fiecare 7 secunde apare alt ecran (opacitate + alunecare, doar transform/opacity).
 * Timpul îl ține animația CSS din punctul activ; la `animationend` trecem mai departe, așa că pauza
 * (mouse deasupra, focus, butonul de pauză) oprește tot fără timere în JS. Cu „reduce motion” nu derulează singur.
 */
export function TraseeDerulator({ rows, max }: { rows: TraseuRand[]; max: number }) {
  const wide = useWide();
  const pages = pagini(rows, wide ? 5 : 3);
  const n = pages.length;
  const [state, setState] = useState({ cur: 0, prev: -1 });
  const [hold, setHold] = useState(false); // mouse deasupra sau focus înăuntru
  const [paused, setPaused] = useState(false); // butonul de pauză
  const cur = state.cur % n;

  const go = (i: number) => setState((s) => ({ cur: ((i % n) + n) % n, prev: s.cur % n }));
  const stopped = hold || paused;

  return (
    <section
      aria-labelledby="trasee-titlu"
      aria-roledescription="derulator"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
      className="w-full max-w-[600px] overflow-hidden rounded-2xl bg-[#14161A]/45 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07),0_24px_50px_-24px_rgb(0_0_0/0.6)] backdrop-blur-[6px]"
    >
      <div className="flex items-center justify-between gap-2.5 border-b border-white/[0.07] px-4 pt-[13px] pb-[11px]">
        <h2 id="trasee-titlu" className="font-logo text-[13px] tracking-[0.06em] text-white uppercase">
          Trasee: marfă și șoferi
        </h2>
        <span aria-hidden className="hidden items-center gap-3 text-[11.5px] font-semibold text-[#C9CDD2] sm:flex">
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 rounded-[3px] bg-[#DC2A21]" />
            marfă
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 rounded-[3px] bg-[#E6E9EC]" />
            șoferi
          </span>
        </span>
      </div>

      {/* Toate ecranele stau în aceeași celulă de grilă: chenarul are înălțimea celui mai înalt și nu „sare” la schimbare. */}
      <div className="grid">
        {pages.map((pg, pi) => {
          const on = pi === cur;
          const leaving = pi === state.prev % n && !on;
          return (
            <ul
              key={pi}
              aria-hidden={!on}
              inert={!on}
              aria-label={`Ecranul ${pi + 1} din ${n}`}
              className={`[grid-area:1/1] ${on ? "" : "pointer-events-none"}`}
            >
              {pg.map((r, i) => (
                <li
                  key={`${pi}-${r.key}-${i}`}
                  className={`${i >= 3 ? "hidden wide:block" : ""} ${i ? "border-t border-white/[0.05]" : ""} transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform motion-reduce:transition-none ${
                    on ? "translate-y-0 opacity-100" : leaving ? "-translate-y-2 opacity-0" : "translate-y-2 opacity-0"
                  }`}
                  style={{ transitionDelay: on ? `${120 + i * 55}ms` : `${i * 30}ms` }}
                >
                  <Link href={r.href} className="grid gap-[7px] px-4 py-2.5 transition-colors hover:bg-white/[0.06] sm:grid-cols-[180px_1fr] sm:items-center sm:gap-3.5">
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-[14.5px] font-bold whitespace-nowrap">
                        {r.from}
                        <Arrow />
                        {r.to}
                      </span>
                      <span className={`text-[11.5px] font-semibold ${r.hot ? "text-[#FFB3AD]" : "text-[#9AA0A8]"}`}>{r.hint}</span>
                    </span>
                    <span className="flex flex-col gap-[5px]">
                      <Bar value={r.loads} max={max} red label="caută șofer" />
                      <Bar value={r.trucks} max={max} label={r.trucks === 1 ? "șofer liber" : "șoferi liberi"} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 pt-[9px] pb-2.5">
        <Link href="/transport-marfa" className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#FF8A80] underline underline-offset-[3px] hover:text-white">
          Vezi toate traseele
          <Arrow />
        </Link>

        {n > 1 && (
          <div className="flex items-center gap-1.5">
            {pages.map((_, pi) => (
              <button
                key={pi}
                type="button"
                onClick={() => go(pi)}
                aria-label={`Arată ecranul ${pi + 1} din ${n}`}
                aria-current={pi === cur ? "true" : undefined}
                className="group/d flex h-6 cursor-pointer items-center px-[3px]"
              >
                <span className={`relative block h-1.5 -skew-x-[14deg] overflow-hidden rounded-[2px] bg-white/25 transition-[width] duration-300 group-hover/d:bg-white/45 ${pi === cur ? "w-7" : "w-3.5"}`}>
                  {pi === cur && (
                    <span
                      key={`${cur}-${n}`}
                      onAnimationEnd={() => go(cur + 1)}
                      className="absolute inset-0 origin-left animate-[trasee-fill_linear_forwards] bg-[#FF5A4F] motion-reduce:animate-none"
                      style={{ animationPlayState: stopped ? "paused" : "running", animationDuration: `${SECUNDE}s` }}
                    />
                  )}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Pornește derularea traseelor" : "Oprește derularea traseelor"}
              className="ml-1 flex size-7 cursor-pointer items-center justify-center rounded-md text-[#C9CDD2] hover:bg-white/10 hover:text-white"
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
