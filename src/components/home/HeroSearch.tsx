"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { CITIES } from "@/lib/geo";
import { VEHICLES } from "@/lib/vehicles";
import { fmtInt } from "@/lib/format";
import { Bell, Box, Calendar, ChevronDown, Pin, Search, Truck } from "@/components/icons";

/** „1.030 de oferte”, „5 oferte”: în română, de la 20 în sus (și la 0) se pune „de”. */
function roCount(n: number, one: string, many: string) {
  if (n === 1) return `1 ${one}`;
  const lastTwo = n % 100;
  return `${fmtInt(n)} ${n === 0 || lastTwo === 0 || lastTwo >= 20 ? "de " : ""}${many}`;
}

/** Câmp din căutare; săgeata din dreapta arată că se deschide o listă (orașe, date, tipuri de camion). */
function Field({ label, icon, children, grow = 1 }: { label: string; icon: ReactNode; children: ReactNode; grow?: number }) {
  /** Un clic oriunde pe câmp deschide lista: calendarul, sugestiile de orașe sau opțiunile. */
  const open = (e: MouseEvent<HTMLLabelElement>) => {
    const c = e.currentTarget.querySelector<HTMLInputElement | HTMLSelectElement>("input, select");
    if (!c || (c instanceof HTMLSelectElement && e.target === c)) return; // lista nativă se deschide singură
    try {
      c.showPicker?.();
    } catch {
      /* browserul nu permite: câmpul primește oricum focus */
    }
  };
  return (
    <label
      onClick={open}
      className="group/f relative flex min-w-[40%] cursor-pointer items-center gap-[11px] rounded-[10px] px-3 transition-colors hover:bg-[#F7F4F3] sm:min-w-0 sm:px-4"
      style={{ flex: grow }}
    >
      {icon}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-[#4A4F57] uppercase">{label}</span>
        {children}
      </span>
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-[#EEEAE9] text-graphite transition-colors group-hover/f:bg-graphite group-hover/f:text-white">
        <ChevronDown width={15} height={15} strokeWidth={2.6} />
      </span>
    </label>
  );
}

const input =
  "w-full min-w-0 cursor-pointer bg-transparent p-0 pr-8 text-base font-bold text-ink outline-none placeholder:font-semibold placeholder:text-[#5E636B] [&::-webkit-calendar-picker-indicator]:hidden";
const Div = () => <span aria-hidden className="hidden h-[34px] w-px shrink-0 bg-[#D9D2D0] sm:block" />;

/**
 * Căutarea din hero: comutator „caut camion / caut marfă”, rută, dată, camion, greutate.
 * Formular GET obișnuit (merge și fără JavaScript), trimis spre /camioane sau /marfa.
 */
export function HeroSearch({ loads, trucks }: { loads: number; trucks: number }) {
  const [role, setRole] = useState<"camion" | "marfa">("camion");
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const action = role === "camion" ? "/camioane" : "/marfa";

  const swap = () => {
    if (!fromRef.current || !toRef.current) return;
    const a = fromRef.current.value;
    fromRef.current.value = toRef.current.value;
    toRef.current.value = a;
  };

  const tab = (value: "camion" | "marfa", icon: ReactNode, text: string, short: string) => {
    const on = role === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setRole(value)}
        className={`relative flex cursor-pointer items-center gap-2 px-[18px] py-[9px] text-sm ${on ? "font-extrabold text-white" : "font-bold text-[#E6E9EC]"}`}
      >
        {on && <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[4px] bg-gradient-to-b from-[#DC2A21] to-[#B8190F]" />}
        <span className="relative flex">{icon}</span>
        <span className="relative hidden sm:inline">{text}</span>
        <span className="relative sm:hidden">{short}</span>
      </button>
    );
  };

  return (
    <form method="get" action={action} className="overflow-hidden rounded-[18px] shadow-[0_30px_60px_-28px_rgb(0_0_0/0.8)]">
      {/* Antetul grafit cu dunga roșie (varianta E) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-brand-600 bg-gradient-to-b from-[#363B43] to-[#1B1E23] px-4 py-3">
        <div role="group" aria-label="Ce cauți" className="relative inline-flex p-1">
          <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[6px] bg-gradient-to-b from-[#363B43] to-[#1B1E23]" />
          {tab("camion", <Box width={17} height={17} />, "Caut camion pentru marfă", "Caut camion")}
          {tab("marfa", <Truck width={17} height={17} />, "Caut marfă pentru camion", "Caut marfă")}
        </div>
        <Link href={action} className="text-[13px] font-bold text-[#C9CDD2] underline underline-offset-[3px] hover:text-white">
          Filtre avansate
        </Link>
      </div>

      <div className="flex flex-col gap-2.5 bg-[#EEEAE9] px-4 pt-3.5 pb-4">

      <div className="flex h-[58px] items-center rounded-xl border-[1.5px] border-[#D2CBC9] bg-white px-1.5">
        <Field label="De unde" grow={1.2} icon={<Pin width={20} height={20} className="shrink-0 text-brand-600" />}>
          <input ref={fromRef} name="oras_din" list="hero-orase" placeholder="Oraș de încărcare" autoComplete="off" className={input} />
        </Field>
        <button
          type="button"
          onClick={swap}
          aria-label="Inversează ruta"
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-[#B9B1AF] bg-white text-graphite hover:border-graphite"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </button>
        <Field label="Până unde" grow={1.2} icon={<Pin width={20} height={20} className="shrink-0 text-graphite" />}>
          <input ref={toRef} name="oras_spre" list="hero-orase" placeholder="Oriunde în UE" autoComplete="off" className={input} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-y-1 rounded-xl border-[1.5px] border-[#D2CBC9] bg-white px-1.5 py-2 sm:h-[58px] sm:flex-nowrap sm:py-0">
        <Field label="Data încărcării" grow={1.2} icon={<Calendar width={20} height={20} className="shrink-0 text-graphite" />}>
          <input type="date" name="data" className={`${input} [color-scheme:light]`} />
        </Field>
        <Div />
        <Field label="Camion" icon={<Truck width={20} height={20} className="shrink-0 text-graphite" />}>
          <select name="vehicul" defaultValue="" className={`${input} cursor-pointer appearance-none`}>
            <option value="">Oricare</option>
            {VEHICLES.map((v) => (
              <option key={v.slug} value={v.slug}>{v.short}</option>
            ))}
          </select>
        </Field>
        <Div />
        <Field label="Greutate" grow={0.85} icon={<Box width={20} height={20} className="shrink-0 text-graphite" />}>
          <select name="tone" defaultValue="" className={`${input} cursor-pointer appearance-none`}>
            <option value="">Oricât</option>
            <option value="3.5">până la 3,5 t</option>
            <option value="7.5">până la 7,5 t</option>
            <option value="12">până la 12 t</option>
            <option value="24">până la 24 t</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 sm:flex-nowrap">
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] leading-snug text-[#B8190F]">
          <Bell width={15} height={15} className="shrink-0" />
          <Link href="/cont/alerte" className="font-bold text-[#B8190F] hover:text-brand-800">
            Salvează căutarea și primește alertă pe WhatsApp
          </Link>
        </span>
        <button type="submit" className="group relative flex shrink-0 cursor-pointer items-center gap-[9px] px-[22px] py-3.5 text-base font-extrabold whitespace-nowrap text-white">
          <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[4px] bg-gradient-to-b from-[#DC2A21] to-[#B8190F] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.18)] transition-[filter] group-hover:brightness-110" />
          <Search width={18} height={18} className="relative" />
          <span className="relative">{role === "camion" ? `Caută ${roCount(trucks, "camion", "camioane")}` : `Caută ${roCount(loads, "ofertă", "oferte")}`}</span>
        </button>
      </div>
      </div>

      <datalist id="hero-orase">
        {CITIES.map((c) => (
          <option key={c.slug} value={c.name} />
        ))}
      </datalist>
    </form>
  );
}
