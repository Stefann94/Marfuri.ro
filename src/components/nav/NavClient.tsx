"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Home, Paste, Plus, Truck, UserIcon, ChevronRight } from "@/components/icons";

/**
 * Meniul „Pistă înclinată” (varianta F): butoanele stau pe o pistă grafit înclinată ca diagonala;
 * fiecare buton are în spate un segment înclinat care se aprinde roșu când ești pe pagina lui.
 */
export const navTrack =
  "absolute inset-0 -skew-x-[14deg] rounded-[6px] bg-gradient-to-b from-[#363B43] to-[#1B1E23] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]";
export const skewBg = "absolute inset-0 -skew-x-[14deg] rounded-[4px] transition-colors";
export const skewActive = "bg-gradient-to-b from-[#DC2A21] to-[#B8190F] shadow-[0_0_14px_rgb(200_32_26/0.55)]";

/** Link din meniul principal: titlu cu fontul din logo, cifra live dedesubt; segment roșu când ești pe pagina lui. */
export function NavLink({ href, children, sub }: { href: string; children: ReactNode; sub?: ReactNode }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="group relative flex flex-col justify-center px-3.5 py-[7px] wide:px-3 xwide:px-3.5">
      <span aria-hidden className={`${skewBg} ${active ? skewActive : "group-hover:bg-white/10"}`} />
      <span className={`relative flex items-center gap-1.5 font-logo text-[13px] wide:text-[14px] xwide:text-[15px] tracking-[0.03em] uppercase ${active ? "text-white" : "text-[#E6E9EC]"}`}>
        {children}
      </span>
      {sub && <span className={`relative mt-0.5 text-[11px] wide:text-xs font-semibold whitespace-nowrap ${active ? "text-white/85" : "text-[#9AA0A8]"}`}>{sub}</span>}
    </Link>
  );
}

/** Meniu care se deschide la clic și se închide cu Esc, clic în afară sau la navigare. */
export function Dropdown({
  trigger,
  children,
  label,
  align = "left",
  className = "",
  buttonClass,
  openClass = "",
  panelClass = "",
}: {
  trigger: ReactNode;
  children: ReactNode;
  label?: string;
  className?: string;
  align?: "left" | "right";
  buttonClass: string;
  openClass?: string;
  panelClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`${buttonClass} ${open ? openClass : ""}`}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 ${align === "right" ? "right-0" : "left-0"} ${panelClass}`}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type Sheet = null | "publish" | "account";

/** Bara de jos pentru telefon, cu butonul „+” și meniul contului. */
export function MobileTabBar({
  loggedIn,
  initials,
  unread,
  accountLinks,
}: {
  loggedIn: boolean;
  initials?: string;
  unread?: number;
  accountLinks: { href: string; label: string; badge?: number; group: "Activitatea mea" | "Explorează" }[];
}) {
  const path = usePathname();
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => setSheet(null), [path]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  const tab = (href: string) => (path === href || (href !== "/" && path.startsWith(`${href}/`)) ? "text-brand-600 font-bold" : "text-muted font-semibold");

  return (
    <>
      <nav
        aria-label="Navigare principală"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <Link href="/" className={`flex h-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${tab("/")}`}>
          <Home width={22} height={22} />
          Acasă
        </Link>
        <Link href="/marfa" className={`flex h-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${tab("/marfa")}`}>
          <Box width={22} height={22} />
          Marfă
        </Link>
        <button
          type="button"
          aria-label="Publică"
          onClick={() => setSheet("publish")}
          className="-mt-6 flex size-[54px] items-center justify-center justify-self-center rounded-[18px] bg-brand-600 text-white shadow-[0_8px_18px_rgba(200,32,26,0.35)]"
        >
          <Plus width={24} height={24} strokeWidth={2.6} />
        </button>
        <Link href="/camioane" className={`flex h-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${tab("/camioane")}`}>
          <Truck width={22} height={22} />
          Camioane
        </Link>
        {loggedIn ? (
          <button
            type="button"
            onClick={() => setSheet("account")}
            className={`relative flex h-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${sheet === "account" ? "font-bold text-brand-600" : "font-semibold text-muted"}`}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-graphite text-[10px] font-extrabold text-white">{initials}</span>
            Cont
            {!!unread && (
              <span className="absolute top-2 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                {unread}
              </span>
            )}
          </button>
        ) : (
          <Link href="/cont/autentificare" className={`flex h-[64px] flex-col items-center justify-center gap-0.5 text-[11px] ${tab("/cont")}`}>
            <UserIcon width={22} height={22} />
            Intră
          </Link>
        )}
      </nav>

      {sheet && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={sheet === "publish" ? "Ce vrei să publici?" : "Contul meu"}>
          <button type="button" aria-label="Închide" className="absolute inset-0 bg-black/45" onClick={() => setSheet(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-300" />
            {sheet === "publish" ? (
              <div className="flex flex-col gap-2.5">
                <p className="text-xl font-extrabold">Ce vrei să publici?</p>
                <SheetOption href="/publica/marfa" title="Am marfă de transportat" text="Găsesc un camion" tone="red" icon={<Box width={22} height={22} />} />
                <SheetOption href="/publica/camion" title="Am camion liber" text="Găsesc marfă" tone="dark" icon={<Truck width={22} height={22} />} />
                {loggedIn && <SheetOption href="/publica/whatsapp" title="Lipește din WhatsApp" text="Se completează singur" tone="soft" icon={<Paste width={22} height={22} />} badge="Nou" />}
                {!loggedIn && <p className="text-sm text-muted">Publicarea e gratuită. Contul îl faci în timpul publicării.</p>}
                <button type="button" onClick={() => setSheet(null)} className="mt-1 min-h-12 rounded-2xl bg-slate-100 font-bold">
                  Renunță
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                {(["Activitatea mea", "Explorează"] as const).map((group) => (
                  <div key={group} className="mb-2">
                    <p className="px-2.5 pt-2 pb-1 text-[11px] font-extrabold tracking-[0.08em] text-slate-400 uppercase">{group}</p>
                    {accountLinks
                      .filter((l) => l.group === group)
                      .map((l) => (
                        <Link key={l.href} href={l.href} className="flex min-h-11 items-center justify-between rounded-xl px-2.5 text-[15px] font-semibold text-ink hover:bg-slate-50">
                          {l.label}
                          {l.badge ? (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-extrabold text-white">{l.badge}</span>
                          ) : (
                            <ChevronRight className="text-slate-300" />
                          )}
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SheetOption(props: { href: string; title: string; text: string; tone: "red" | "dark" | "soft"; icon: ReactNode; badge?: string }) {
  const iconBg = props.tone === "red" ? "bg-brand-600 text-white" : props.tone === "dark" ? "bg-graphite text-white" : "bg-slate-100 text-graphite";
  return (
    <Link href={props.href} className={`flex items-center gap-3 rounded-2xl p-3 ${props.tone === "red" ? "border-2 border-brand-600" : "border border-line"}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{props.icon}</span>
      <span className="flex flex-col">
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
          {props.title}
          {props.badge && <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{props.badge}</span>}
        </span>
        <span className="text-xs text-muted">{props.text}</span>
      </span>
    </Link>
  );
}
