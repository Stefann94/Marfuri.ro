"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

type Pos = { left: number; top: number; width: number; arrowX: number; above: boolean; maxH: number };

const GAP = 12; // distanța dintre câmp și fereastră (acolo stă săgeata)
const EDGE = 8; // marginea minimă față de ecran

/**
 * Fereastra care se deschide sub un câmp din căutarea hero-ului (varianta A: foaie albă cu antet grafit).
 * - săgeata pornește din mijlocul câmpului apăsat;
 * - fereastra se aliniază la câmp, dar nu iese din chenar și nici din ecran;
 * - pe ecrane înguste ia toată lățimea chenarului;
 * - dacă nu are loc dedesubt, se deschide deasupra (săgeata în jos); conținutul lung derulează în interior.
 */
export function HeroPopover({
  anchor,
  card,
  width,
  title,
  onClose,
  children,
  id,
}: {
  anchor: RefObject<HTMLElement | null>;
  card: RefObject<HTMLElement | null>;
  width: number;
  title: string;
  onClose: () => void;
  children: ReactNode;
  id?: string;
}) {
  const head = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const scrolled = useRef(false);

  const place = useCallback(() => {
    const a = anchor.current;
    const c = card.current;
    if (!a || !c || !head.current || !body.current) return;
    const ar = a.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    const vv = window.visualViewport;
    const vw = document.documentElement.clientWidth;
    const vh = vv?.height ?? window.innerHeight;

    const w = Math.min(cr.width < 560 ? cr.width : Math.min(width, cr.width), vw - 2 * EDGE);
    let left = Math.min(Math.max(ar.left - 4, cr.left), cr.right - w);
    left = Math.max(EDGE, Math.min(left, vw - w - EDGE));
    const arrowX = Math.min(Math.max(ar.left + ar.width / 2 - left, 22), w - 22);

    const natural = head.current.offsetHeight + body.current.scrollHeight + 2;
    const headerBottom = Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
    const tabBar = vw < 768 ? 76 : 0; // bara de jos de pe telefon
    const spaceBelow = vh - tabBar - ar.bottom - GAP - EDGE;
    const spaceAbove = ar.top - headerBottom - GAP - EDGE;
    // La deschidere, dacă fereastra nu încape dedesubt, derulăm pagina (cât se poate) ca să încapă sub câmp.
    if (!scrolled.current) {
      scrolled.current = true;
      const need = Math.min(natural - spaceBelow, ar.top - headerBottom - EDGE);
      const room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const by = Math.min(need, room);
      if (by > 0) {
        window.scrollBy({ top: by, behavior: "instant" });
        return; // evenimentul de derulare repoziționează fereastra
      }
    }
    const above = natural > spaceBelow && spaceAbove > spaceBelow;
    const maxH = Math.max(200, above ? spaceAbove : spaceBelow);
    const h = Math.min(natural, maxH);
    setPos({ left, top: above ? ar.top - GAP - h : ar.bottom + GAP, width: w, arrowX, above, maxH });
  }, [anchor, card, width]);

  useLayoutEffect(place, [place]);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    window.addEventListener("scroll", on, { passive: true, capture: true });
    window.addEventListener("resize", on);
    window.visualViewport?.addEventListener("resize", on);
    const ro = new ResizeObserver(on);
    if (inner.current) ro.observe(inner.current);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on, { capture: true });
      window.removeEventListener("resize", on);
      window.visualViewport?.removeEventListener("resize", on);
      ro.disconnect();
    };
  }, [place]);

  return (
    <div
      id={id}
      role="dialog"
      aria-label={title}
      className="fixed z-30"
      style={pos ? { left: pos.left, top: pos.top, width: pos.width } : { left: 0, top: 0, width, visibility: "hidden" }}
    >
      {/* săgeata spre câmp: grafit sus (din antet), albă jos când fereastra stă deasupra câmpului */}
      <span
        aria-hidden
        className={`absolute size-[18px] rotate-45 rounded-[3px] ${pos?.above ? "-bottom-[8px] border-r border-b border-[#D2CBC9] bg-white" : "-top-[8px] bg-[#363B43]"}`}
        style={{ left: (pos?.arrowX ?? 40) - 9 }}
      />
      <div
        className="relative flex flex-col overflow-hidden rounded-[14px] border border-[#D2CBC9] bg-white shadow-[0_28px_56px_-18px_rgb(0_0_0/0.55),0_4px_14px_rgb(20_22_26/0.18)]"
        style={{ maxHeight: pos?.maxH }}
      >
        <div ref={head} className="flex h-10 shrink-0 items-center justify-between border-b-[3px] border-brand-600 bg-gradient-to-b from-[#363B43] to-[#1B1E23] pr-1.5 pl-3.5">
          <span className="font-logo text-xs tracking-[0.06em] text-white uppercase">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-[#C9CDD2] hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div ref={inner}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Rândul unei liste (varianta A): fundal cald + bară roșie + bifă când e ales. */
export function PickRow({
  selected,
  active,
  onPick,
  onHover,
  children,
  h = 40,
  id,
}: {
  selected?: boolean;
  active?: boolean;
  onPick: () => void;
  onHover?: () => void;
  children: ReactNode;
  h?: number;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={!!selected}
      onClick={onPick}
      onMouseEnter={onHover}
      className={`relative flex w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-ink transition-colors ${selected || active ? "bg-[#F7F4F3]" : "hover:bg-[#F7F4F3]"}`}
      style={{ minHeight: h }}
    >
      {selected && <span aria-hidden className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-[3px] bg-brand-600" />}
      {children}
      {selected && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8201A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      )}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="px-3.5 pt-2.5 pb-1.5 font-logo text-[11px] tracking-[0.08em] text-[#4A4F57] uppercase">{children}</div>;
}

export function CountryBadge({ code }: { code: string }) {
  return (
    <span className="flex h-5 w-[30px] shrink-0 items-center justify-center rounded bg-[#EEEAE9] text-[11px] font-extrabold tracking-[0.04em] text-graphite">
      {code}
    </span>
  );
}

/** Buton mic (scurtături: Azi, Mâine, țări); cel ales e grafit. */
export function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex cursor-pointer items-center gap-[7px] rounded-lg border-[1.5px] px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors ${
        on ? "border-graphite bg-graphite font-extrabold text-white" : "border-[#D2CBC9] bg-white font-bold text-ink hover:border-graphite"
      }`}
    >
      {children}
    </button>
  );
}
