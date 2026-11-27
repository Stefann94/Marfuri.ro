import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { fmtInt } from "@/lib/format";
import type { RouteSupply } from "@/lib/queries";
import type { CountryItem } from "@/lib/places";
import { Ban, Calc, Paste, Plus, Search, Shield, Star, Truck } from "@/components/icons";
import { HeroSearch } from "./HeroSearch";
import { HeroTrasee } from "./HeroTrasee";
import heroImg from "../../../public/brand/hero-drona.jpg";

type Stats = { loads: number; trucks: number; companies: number; verified: number };

const TOOLS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/instrumente/preturi-rute",
    label: "Preț mediu pe rută",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12V4h8l10 10-8 8z" />
        <circle cx="7.5" cy="8.5" r="1.5" />
      </svg>
    ),
  },
  { href: "/instrumente/calculator-cursa", label: "Calculator cost cursă", icon: <Calc width={17} height={17} /> },
  { href: "/instrumente/restrictii", label: "Restricții de circulație", icon: <Ban width={17} height={17} /> },
  { href: "/cont/evaluari", label: "Evaluează-ți partenerul", icon: <Star width={17} height={17} /> },
];

/** Bloc înclinat (−14°), ca butoanele din navbar. */
const Skew = ({ className }: { className: string }) => <span aria-hidden className={`absolute inset-0 -skew-x-[14deg] rounded-[4px] ${className}`} />;

/**
 * Hero „primul ecran” (varianta 1): fotografia din dronă pe tot ecranul, cu TIR-ul în stânga
 * mergând spre dreapta, unde stau căutarea, publicarea, verificarea firmei și uneltele.
 * Pe ecran de laptop (1440×900) încape întreg, cu tot cu navbarul.
 */
export function HeroPrimEcran({ stats, countries, routes }: { stats: Stats; countries: CountryItem[]; routes: RouteSupply[] }) {
  const nums = [
    [stats.loads, "mărfuri active"],
    [stats.trucks, "camioane libere"],
    [stats.companies, "firme înscrise"],
    [stats.verified, "verificate ANAF"],
  ] as const;

  return (
    <section aria-labelledby="hero-titlu" className="relative overflow-hidden bg-[#14161A]">
      <Image
        src={heroImg}
        alt=""
        priority
        placeholder="blur"
        sizes="100vw"
        className="absolute inset-0 h-[340px] w-full object-cover object-left lg:h-full"
      />
      <div
        aria-hidden
        className="absolute inset-0 h-[340px] lg:h-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,22,26,0.15) 0%, rgba(20,22,26,0.35) 40%, rgba(20,22,26,0.82) 62%, rgba(20,22,26,0.9) 100%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1680px] gap-6 px-4 pt-8 pb-8 md:px-10 lg:h-[764px] lg:grid-cols-[1fr_640px] lg:gap-10 lg:px-16 lg:pt-9 lg:pb-9">
        {/* Stânga: titlul sus, traseele la mijloc, cifrele jos. Pe telefon traseele coboară sub căutare (ordinea din grilă). */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:justify-between lg:gap-6 lg:pt-2">
          <div className="order-1 flex min-h-[276px] min-w-0 flex-col justify-between gap-6 lg:contents">
            <div className="flex flex-col gap-4 lg:order-1">
              <h1 id="hero-titlu" className="max-w-[600px] font-logo text-[34px] leading-[1.08] font-normal tracking-normal text-white sm:text-[42px] lg:text-[48px]">
                Marfă și camioane,
                <br />
                găsite <span className="text-[#FF5A4F]">în câteva minute.</span>
              </h1>
            </div>
            <dl className="flex w-fit flex-wrap items-center gap-x-[22px] gap-y-3 rounded-2xl bg-[#14161A]/70 px-[22px] py-[18px] backdrop-blur-md lg:order-3">
              {nums.map(([n, label], i) => (
                <div key={label} className="flex items-center gap-[22px]">
                  <div className="flex flex-col-reverse">
                    <dt className="mt-[3px] text-[12.5px] font-semibold text-[#C9CDD2]">{label}</dt>
                    <dd className="font-logo text-[26px] leading-none text-white tabular-nums">{fmtInt(n)}</dd>
                  </div>
                  {i < nums.length - 1 && <span aria-hidden className="hidden h-[34px] w-px -skew-x-[14deg] bg-white/30 sm:block" />}
                </div>
              ))}
            </dl>
          </div>
          {/* Între 1024 și 1279 px coloana din stânga e prea îngustă pentru trasee */}
          <div className="order-3 min-w-0 lg:order-2 lg:hidden xl:block">
            <HeroTrasee routes={routes} />
          </div>
        </div>

        {/* Dreapta: tot ce poți face */}
        <div className="order-2 flex min-w-0 flex-col gap-4">
          <HeroSearch loads={stats.loads} trucks={stats.trucks} countries={countries} />

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/am-marfa" className="group relative flex items-center gap-[9px] px-[22px] py-[13px] text-[15px] font-extrabold whitespace-nowrap text-white">
              <Skew className="bg-gradient-to-b from-[#DC2A21] to-[#B8190F] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.18)] transition-[filter] group-hover:brightness-110" />
              <Plus width={18} height={18} strokeWidth={2.6} className="relative" />
              <span className="relative">Am marfă de transportat</span>
            </Link>
            <Link href="/am-camion-liber" className="group relative flex items-center gap-[9px] px-[22px] py-[13px] text-[15px] font-extrabold whitespace-nowrap text-white">
              <Skew className="border-2 border-white transition-colors group-hover:bg-white/10" />
              <Truck width={18} height={18} className="relative" />
              <span className="relative">Am camion liber</span>
            </Link>
            <Link href="/publica/whatsapp" className="flex items-center gap-[7px] text-sm font-bold text-white hover:text-[#FF8A80]">
              <Paste width={17} height={17} className="text-[#FF8A80]" />
              Lipește din WhatsApp
            </Link>
          </div>

          <form method="get" action="/firme" className="flex flex-col gap-2">
            <label htmlFor="verifica-firma" className="flex items-center gap-2 text-[15px] font-extrabold text-white">
              <Shield width={18} height={18} className="text-[#FF8A80]" />
              Verifică o firmă înainte să lucrezi cu ea
            </label>
            <div className="flex h-[52px] items-center rounded-xl border border-[#E4DFDD] bg-white pr-1.5 pl-4">
              <Search width={18} height={18} className="shrink-0 text-[#6B717A]" />
              <input
                id="verifica-firma"
                name="q"
                placeholder="CUI, nume firmă sau număr de telefon"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-2.5 text-[15px] text-ink outline-none placeholder:text-[#6B717A]"
              />
              <button type="submit" className="group relative cursor-pointer px-5 py-2.5 text-sm font-extrabold text-white">
                <Skew className="bg-gradient-to-b from-[#363B43] to-[#1B1E23] transition-[filter] group-hover:brightness-125" />
                <span className="relative">Verifică</span>
              </button>
            </div>
            <span className="text-[12.5px] text-[#C9CDD2]">ANAF · insolvență · incidente de plată · recenzii de la alți transportatori</span>
          </form>

          <nav aria-label="Unelte gratuite" className="flex flex-wrap gap-3">
            {TOOLS.map((t) => (
              <Link key={t.href} href={t.href} className="group relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-white">
                <Skew className="border-[1.5px] border-white/35 bg-white/[0.08] transition-colors group-hover:bg-white/[0.16]" />
                <span className="relative flex text-[#FF8A80]">{t.icon}</span>
                <span className="relative">{t.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
