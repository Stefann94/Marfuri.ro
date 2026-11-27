import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowRight, Ban, Bell, Book, Box, Building, Calc, Card, Chat, ChevronDown, Doc, Fuel, Gear, Grid, Help, LogOut, Paste, Plus, RouteIcon, Shield, Star, Truck, Users,
} from "@/components/icons";
import { Dropdown, MobileTabBar, NavLink, navTrack, skewBg } from "./NavClient";
import { LiveTicker } from "./LiveTicker";

export type NavNotification = { id: string; title: string; text: string; when: string; unread: boolean; kind: "load" | "offer" | "doc" | "rating" };
export type NavUser = { company: string; initials: string; verified: boolean; unreadMessages: number; notifications: NavNotification[] };

const TOOLS = [
  { href: "/instrumente/calculator-cursa", title: "Calculator de cursă", text: "Km, taxe de drum, motorină, cost pe km", icon: Calc },
  { href: "/instrumente/preturi-rute", title: "Prețuri medii pe rute", text: "Cât se plătește acum pe o rută", icon: RouteIcon },
  { href: "/instrumente/restrictii", title: "Restricții de circulație", text: "Europa, zile libere, acces București", icon: Ban },
  { href: "/instrumente/motorina-curs", title: "Motorină și curs BNR", text: "Prețuri pe țări, conversie valutară", icon: Fuel },
  { href: "/instrumente/formulare", title: "Formulare", text: "Adeverință șofer, comandă, CMR", icon: Doc },
  { href: "/instrumente/calculator-ldm", title: "Calculator LDM și paleți", text: "Câți metri de podea ocupă marfa", icon: Box },
];

const ACCOUNT = [
  { href: "/cont", label: "Panoul meu", icon: Grid },
  { href: "/cont/firma", label: "Firma mea (fișa de încredere)", icon: Building },
  { href: "/cont/flota", label: "Flota mea", icon: Truck },
  { href: "/cont/alerte", label: "Alerte", icon: Bell },
  { href: "/cont/evaluari", label: "Evaluări și incidente", icon: Star },
  { href: "/cont/echipa", label: "Echipa", icon: Users },
  { href: "/cont/abonament", label: "Abonament și facturi", icon: Card },
  { href: "/cont/setari", label: "Setări", icon: Gear },
  { href: "/cont/ajutor", label: "Ajutor", icon: Help },
];

const iconBtn = "relative flex size-11 items-center justify-center rounded-xl text-graphite transition-colors hover:bg-slate-100";

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">
      {n > 9 ? "9+" : n}
    </span>
  );
}

/** Rândul unui meniu (varianta A): plăcuță cu iconiță; la trecere și la cel evidențiat, fundal cald și bară roșie. */
function MenuRow({ href, icon, title, text, highlight }: { href: string; icon: ReactNode; title: string; text?: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-[10px] px-3 py-[11px] transition-colors before:absolute before:top-[9px] before:bottom-[9px] before:left-0 before:w-[3px] before:rounded-r-[3px] before:bg-brand-600 after:absolute after:top-[9px] after:right-0 after:bottom-[9px] after:w-[3px] after:rounded-l-[3px] after:bg-brand-600 hover:bg-[#F7F4F3] hover:before:opacity-100 hover:after:opacity-100 ${
        highlight ? "bg-[#F7F4F3] before:opacity-100 after:opacity-100" : "before:opacity-0 after:opacity-0"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${
          highlight ? "bg-gradient-to-b from-[#DC2A21] to-[#B8190F] text-white" : "bg-[#EEEAE9] text-graphite"
        }`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] leading-tight font-bold text-ink">{title}</span>
        {text && <span className="mt-0.5 text-[13px] leading-snug text-muted">{text}</span>}
      </span>
    </Link>
  );
}

/** Legătura roșie din subsolul unui meniu. */
const footLink = "inline-flex items-center gap-1.5 font-extrabold text-brand-700 hover:text-brand-800";

function ToolsMenu() {
  return (
    <Dropdown
      buttonClass="group relative flex flex-col justify-center px-3.5 py-[7px] text-left wide:px-3 xwide:px-3.5"
      trigger={
        <>
          <span aria-hidden className={`${skewBg} group-hover:bg-white/10 group-aria-expanded:bg-white/10`} />
          <span className="relative flex items-center gap-1 font-logo text-[13px] wide:text-[14px] xwide:text-[15px] tracking-[0.03em] text-[#E6E9EC] uppercase">
            Instrumente
            <ChevronDown className="transition-transform group-aria-expanded:rotate-180" />
          </span>
          <span className="relative mt-0.5 text-[11px] wide:text-xs font-semibold whitespace-nowrap text-[#9AA0A8]">calculatoare, rute</span>
        </>
      }
      title="Instrumente gratuite"
      meta={`${TOOLS.length} unelte`}
      width={560}
      panelClass="grid grid-cols-2 gap-0.5 p-2"
      footer={
        <Link href="/ghiduri" className={`${footLink} w-full justify-between`}>
          <span className="flex items-center gap-2">
            <Book width={17} height={17} />
            Ghiduri pentru transportatori și expeditori
          </span>
          <ArrowRight width={16} height={16} className="text-ink" />
        </Link>
      }
    >
      {TOOLS.map((t, i) => (
        <MenuRow key={t.href} href={t.href} icon={<t.icon />} title={t.title} text={t.text} highlight={i === 0} />
      ))}
    </Dropdown>
  );
}

function PublishMenu({ loggedIn }: { loggedIn: boolean }) {
  return (
    <Dropdown
      align="right"
      buttonClass="group relative flex cursor-pointer items-center px-5 py-3 text-[15px] font-extrabold text-white"
      trigger={
        <>
          <span
            aria-hidden
            className="absolute inset-0 -skew-x-[14deg] overflow-hidden rounded-[4px] bg-gradient-to-b from-[#DC2A21] to-[#B8190F] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.22)] transition-[filter] group-hover:brightness-110 group-aria-expanded:brightness-90"
          >
            <span className="absolute inset-y-0 -left-[70px] w-11 bg-gradient-to-r from-white/0 via-white/50 to-white/0 motion-safe:group-hover:animate-[mf-shine_1.1s_ease-in-out_infinite]" />
          </span>
          <span className="relative flex items-center gap-2">
            <Plus strokeWidth={2.8} width={16} height={16} />
            <span>
              Publică{!loggedIn && <span className="xl:hidden wide:inline"> gratuit</span>}
            </span>
            {loggedIn && <ChevronDown />}
          </span>
        </>
      }
      title={loggedIn ? "Ce publici?" : "Ce vrei să publici?"}
      meta="gratuit"
      width={loggedIn ? 380 : 420}
      panelClass={loggedIn ? "p-2" : "p-3"}
    >
      {loggedIn ? (
        <>
          <MenuRow href="/cauta-camion" icon={<Box />} title="Publică marfă" text="În 3 pași, cu previzualizare" highlight />
          <MenuRow href="/cauta-marfa" icon={<Truck />} title="Anunță camion liber" text="Din flota ta, se republică automat" />
          <MenuRow href="/publica/whatsapp" icon={<Paste />} title="Lipește din WhatsApp" text="Lipești textul, formularul se completează singur" />
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Link href="/cauta-camion" className="flex items-center gap-3.5 rounded-xl border-[1.5px] border-brand-600 bg-[#FFF8F7] p-3.5 hover:bg-brand-50">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#DC2A21] to-[#B8190F] text-white"><Box width={24} height={24} /></span>
            <span><span className="block text-[15px] font-bold text-ink">Am marfă de transportat</span><span className="text-[13px] text-muted">Transportatorii te sună direct</span></span>
          </Link>
          <Link href="/cauta-marfa" className="flex items-center gap-3.5 rounded-xl border-[1.5px] border-line p-3.5 hover:border-[#CFC8C6] hover:bg-[#F7F4F3]">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-graphite text-white"><Truck width={24} height={24} /></span>
            <span><span className="block text-[15px] font-bold text-ink">Am camion liber</span><span className="text-[13px] text-muted">Primești marfă potrivită pe ruta ta</span></span>
          </Link>
          <p className="mx-1.5 mt-1 text-[13px] text-muted">Contul îl faci în timpul publicării, în mai puțin de un minut.</p>
        </div>
      )}
    </Dropdown>
  );
}

const NOTIF_ICON = { load: Box, offer: Chat, doc: Doc, rating: Star } as const;

function NotificationsMenu({ user }: { user: NavUser }) {
  const unread = user.notifications.filter((n) => n.unread).length;
  return (
    <Dropdown
      align="right"
      label={`Notificări${unread ? `, ${unread} noi` : ""}`}
      buttonClass={iconBtn}
      openClass="bg-brand-100 text-brand-600"
      trigger={<><Bell width={22} height={22} /><Badge n={unread} /></>}
      title="Notificări"
      meta={unread ? `${unread} ${unread === 1 ? "nouă" : "noi"}` : undefined}
      width={400}
      footer={
        <>
          <Link href="/cont/alerte" className={footLink}>
            Vezi toate <ArrowRight width={16} height={16} />
          </Link>
          <Link href="/cont/alerte" className="font-semibold text-muted hover:text-ink">
            Marchează tot ca citit
          </Link>
        </>
      }
    >
      {user.notifications.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">Nu ai notificări noi.</p>
      ) : (
        user.notifications.map((n) => {
          const Icon = NOTIF_ICON[n.kind];
          return (
            <Link
              key={n.id}
              href="/cont/alerte"
              className={`relative flex gap-3 border-b border-[#EEE7E6] px-4 py-3 last:border-b-0 hover:bg-[#F7F4F3] ${
                n.unread ? "bg-[#FFF8F7] before:absolute before:top-3 before:bottom-3 before:left-0 before:w-[3px] before:rounded-r-[3px] before:bg-brand-600" : ""
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-[9px] ${
                  n.kind === "load" ? "bg-gradient-to-b from-[#DC2A21] to-[#B8190F] text-white" : "bg-[#EEEAE9] text-graphite"
                }`}
              >
                <Icon width={19} height={19} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-bold text-ink">{n.title}</span>
                <span className="text-[13px] text-muted">{n.text}</span>
                <span className="mt-0.5 text-xs text-[#9AA0A8]">{n.when}</span>
              </span>
            </Link>
          );
        })
      )}
    </Dropdown>
  );
}

function AccountMenu({ user }: { user: NavUser }) {
  return (
    <Dropdown
      align="right"
      label="Contul meu"
      buttonClass="ml-1 flex items-center gap-1 rounded-full p-1 pr-1.5 text-graphite hover:bg-slate-100"
      openClass="bg-slate-100"
      trigger={<><span className="flex size-[38px] items-center justify-center rounded-full bg-graphite text-sm font-extrabold text-white">{user.initials}</span><ChevronDown /></>}
      title="Contul meu"
      meta={user.company}
      width={330}
      panelClass="p-2"
    >
      <div className="mb-1.5 flex items-center gap-3 border-b border-line px-3 pt-2 pb-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-graphite font-extrabold text-white">{user.initials}</span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-bold">{user.company}</span>
          {user.verified ? (
            <span className="flex items-center gap-1 text-xs font-bold text-[#157F3B]">
              <Shield width={14} height={14} />
              Verificată ANAF
            </span>
          ) : (
            <span className="text-xs font-semibold text-muted">Neverificată încă la ANAF</span>
          )}
        </span>
      </div>
      {ACCOUNT.map((a, i) => (
        <Link
          key={a.href}
          href={a.href}
          className={`flex items-center gap-3 rounded-[9px] px-3 py-[9px] text-[15px] font-semibold text-ink hover:bg-[#F7F4F3] ${i === 0 ? "bg-[#F7F4F3]" : ""}`}
        >
          <a.icon width={19} height={19} className={i === 0 ? "text-brand-600" : "text-muted"} />
          {a.label}
        </Link>
      ))}
      <div className="mx-1 my-1.5 h-px bg-line" />
      <form action="/cont/iesire" method="post">
        <button type="submit" className="flex w-full cursor-pointer items-center gap-3 rounded-[9px] px-3 py-[9px] text-[15px] font-semibold text-brand-700 hover:bg-[#FFF8F7]">
          <LogOut width={19} height={19} />
          Ieși din cont
        </button>
      </form>
    </Dropdown>
  );
}

/**
 * Separatorul dintre TIR și butoane (varianta B, „Diagonală dublă”): o dungă roșie de 12 px și una grafit
 * de 2,5 px, drepte, înclinate exact ca butoanele (−14°, adică 1 px pe orizontală la 4 px pe verticală).
 * Stă la jumătatea distanței dintre TIR și butoane; zona roz din stânga ține logo-ul.
 */
function Livery() {
  return (
    <div aria-hidden className="relative h-full min-w-[56px] flex-1 xl:flex-[2_1_28px]">
      <div className="absolute inset-y-0 right-[calc(50%+100px)] w-screen bg-[#FBEDEC]" />
      {/*
        Coordonate în pixeli, centrate pe mijlocul spațiului liber; y=0 e marginea de sus a barei.
        SVG-ul acoperă și dungile de sus (−6…0) și de jos și le redesenează peste capetele dungilor înclinate.
      */}
      <svg viewBox="-100 -6 200 76" className="pointer-events-none absolute -top-1.5 left-1/2 h-[76px] w-[200px] -translate-x-1/2 md:hidden">
        <polygon points="-100,-6 1,-6 -18,70 -100,70" fill="#FBEDEC" />
        <polygon points="21,-6 23.5,-6 4.5,70 2,70" fill="#2A2E35" />
        <polygon points="1,-6 13,-6 -6,70 -18,70" fill="#C8201A" />
        <rect x="-100" y="-4" width="200" height="4" fill="#C8201A" />
        <rect x="-100" y="-6" width="200" height="2" fill="#2A2E35" />
        <rect x="-100" y="64" width="200" height="4" fill="#C8201A" />
        <rect x="-100" y="68" width="200" height="2" fill="#2A2E35" />
      </svg>
      <svg viewBox="-100 -6 200 100" className="pointer-events-none absolute -top-1.5 left-1/2 hidden h-[100px] w-[200px] -translate-x-1/2 md:block">
        <polygon points="-100,-6 4,-6 -21,94 -100,94" fill="#FBEDEC" />
        <polygon points="24,-6 26.5,-6 1.5,94 -1,94" fill="#2A2E35" />
        <polygon points="4,-6 16,-6 -9,94 -21,94" fill="#C8201A" />
        <rect x="-100" y="-4" width="200" height="4" fill="#C8201A" />
        <rect x="-100" y="-6" width="200" height="2" fill="#2A2E35" />
        <rect x="-100" y="88" width="200" height="4" fill="#C8201A" />
        <rect x="-100" y="92" width="200" height="2" fill="#2A2E35" />
      </svg>
    </div>
  );
}

/** Linie subțire, înclinată ca pista, între două butoane din meniu. */
function NavSep() {
  return (
    <span
      aria-hidden
      className="relative shrink-0"
      style={{ width: 1, height: 28, background: "rgb(255 255 255 / 0.25)", transform: "skewX(-14deg)" }}
    />
  );
}

/** Bara principală a site-ului (alb, roșu & grafit), cu TIR-ul Mărfuri.ro ca logo. */
export function SiteHeader({ user, sticky = true }: { user: NavUser | null; sticky?: boolean }) {
  const unreadNotif = user?.notifications.filter((n) => n.unread).length ?? 0;
  const accountLinks = user
    ? [
        { href: "/cont", label: "Panoul meu", group: "Activitatea mea" as const },
        { href: "/cont/anunturi", label: "Anunțurile mele", group: "Activitatea mea" as const },
        { href: "/cont/mesaje", label: "Mesaje", badge: user.unreadMessages, group: "Activitatea mea" as const },
        { href: "/cont/firma", label: "Firma mea și flota", group: "Activitatea mea" as const },
        { href: "/cont/alerte", label: "Alerte", group: "Activitatea mea" as const },
        { href: "/firme", label: "Firme verificate", group: "Explorează" as const },
        { href: "/instrumente", label: "Instrumente", group: "Explorează" as const },
        { href: "/preturi", label: "Prețuri", group: "Explorează" as const },
        { href: "/cont/setari", label: "Setări și ajutor", group: "Explorează" as const },
      ]
    : [];

  return (
    <>
      <LiveTicker />
      <header className={`${sticky ? "sticky top-0" : "relative"} z-40 overflow-x-clip bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90`}>
        {/* Dungile de sus: oglinda celor de jos (grafit la margine, apoi roșu) */}
        <div aria-hidden className="h-0.5 bg-graphite" />
        <div aria-hidden className="h-1 bg-brand-600" />
        {/*
          Logo stânga · dungile la jumătatea distanței dintre TIR și butoane · butoanele fix la mijloc între dungi
          și „Intră în cont” · cont și Publică în dreapta.
          Spațiul liber se împarte 2:1 (stânga:dreapta) plus 28 px în stânga: așa dungile stau la mijlocul
          spațiului din stânga, iar distanța de la dunga grafit (la jumătatea înălțimii, 14 px dreapta de centru)
          până la butoane e egală cu distanța de la butoane până la „Intră în cont”.
        */}
        <div className="mx-auto flex h-16 max-w-[1680px] items-center px-3.5 md:h-[88px] md:px-6">
          <Link href="/" aria-label="Mărfuri.ro, pagina principală" className="relative z-10 shrink-0">
            <Image
              src="/brand/marfuri-tir-foto.webp"
              alt="Mărfuri.ro"
              width={992}
              height={261}
              priority
              sizes="(min-width: 768px) 282px, 206px"
              className="h-[54px] w-auto md:h-[74px] xl:h-[56px] wide:h-[64px] xwide:h-[74px]"
            />
          </Link>
          <Livery />

          <nav aria-label="Principal" className="relative hidden shrink-0 items-center gap-0.5 p-1 xl:flex">
            <span aria-hidden className={navTrack} />
            <NavLink href="/cauta-marfa" sub="pentru camionul tău">Caută marfă</NavLink>
            <NavSep />
            <NavLink href="/cauta-camion" sub="pentru marfa ta">Caută camion</NavLink>
            <NavSep />
            {user ? (
              <>
                <NavLink href="/cont" sub="cereri și acceptări">Contul meu</NavLink>
                <NavSep />
                <NavLink href="/firme" sub="verificate la ANAF">Firme</NavLink>
              </>
            ) : (
              <NavLink href="/firme" sub="verificate la ANAF">Firme verificate</NavLink>
            )}
            <NavSep />
            <ToolsMenu />
            {!user && (
              <>
                <NavSep />
                <NavLink href="/preturi" sub="publicare gratuită">Prețuri</NavLink>
              </>
            )}
          </nav>
          <div aria-hidden className="hidden min-w-0 xl:block xl:flex-[1_1_0px]" />

          <div className="flex shrink-0 items-center gap-1.5">
            {user ? (
              <>
                <Link href="/cont/mesaje" aria-label={`Mesaje${user.unreadMessages ? `, ${user.unreadMessages} necitite` : ""}`} className={`${iconBtn} hidden md:flex`}>
                  <Chat width={22} height={22} />
                  <Badge n={user.unreadMessages} />
                </Link>
                <div className="hidden md:block"><NotificationsMenu user={user} /></div>
                <Link href="/cont/alerte" aria-label={`Notificări${unreadNotif ? `, ${unreadNotif} noi` : ""}`} className={`${iconBtn} md:hidden`}>
                  <Bell width={22} height={22} />
                  <Badge n={unreadNotif} />
                </Link>
                <div className="ml-1 hidden md:block"><PublishMenu loggedIn /></div>
                <div className="hidden md:block"><AccountMenu user={user} /></div>
              </>
            ) : (
              <>
                <Link href="/cont/autentificare" className="group relative mr-2 flex items-center px-3.5 py-2.5 text-sm font-bold text-ink md:px-4 md:text-[15px]">
                  <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[4px] border-2 border-graphite transition-colors group-hover:border-brand-600 group-hover:bg-brand-600" />
                  <span className="relative transition-colors group-hover:text-white">
                    Intră<span className="hidden md:inline xl:hidden wide:inline"> în cont</span>
                  </span>
                </Link>
                <div className="hidden md:block"><PublishMenu loggedIn={false} /></div>
              </>
            )}
          </div>
        </div>
        {/* Dungile de pe prelată: roșu + grafit, pe toată lățimea */}
        <div aria-hidden className="h-1 bg-brand-600" />
        <div aria-hidden className="h-0.5 bg-graphite" />
        {/* Între telefon și ecran mare: linkurile principale pe un rând care se derulează */}
        <nav aria-label="Principal (tabletă)" className="hidden justify-center gap-1 overflow-x-auto border-b border-line px-6 py-1.5 text-sm font-semibold md:flex xl:hidden">
          <Link href="/cauta-marfa" className="rounded-lg px-3 py-2 whitespace-nowrap text-graphite hover:bg-slate-100">Caută marfă</Link>
          <Link href="/cauta-camion" className="rounded-lg px-3 py-2 whitespace-nowrap text-graphite hover:bg-slate-100">Caută camion</Link>
          <Link href="/firme" className="rounded-lg px-3 py-2 whitespace-nowrap text-graphite hover:bg-slate-100">Firme verificate</Link>
          <Link href="/instrumente" className="rounded-lg px-3 py-2 whitespace-nowrap text-graphite hover:bg-slate-100">Instrumente</Link>
          <Link href="/preturi" className="rounded-lg px-3 py-2 whitespace-nowrap text-graphite hover:bg-slate-100">Prețuri</Link>
        </nav>
      </header>
      {sticky && <MobileTabBar loggedIn={!!user} initials={user?.initials} unread={user?.unreadMessages} accountLinks={accountLinks} />}
    </>
  );
}
