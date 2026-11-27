"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import type { RefVehicle, RefWeight } from "@/lib/ref";
import { fmtInt } from "@/lib/format";
import type { CountryItem } from "@/lib/places";
import { Bell, Box, Calendar, ChevronDown, Pin, Search, Truck } from "@/components/icons";
import { VehicleIcon } from "@/components/VehicleIcon";
import { Chip, HeroPopover, PickRow } from "./HeroPopover";
import { PlacePicker, type Place } from "./PlacePicker";

/** „1.030 de oferte”, „5 oferte”: în română, de la 20 în sus (și la 0) se pune „de”. */
function roCount(n: number, one: string, many: string) {
  if (n === 1) return `1 ${one}`;
  const lastTwo = n % 100;
  return `${fmtInt(n)} ${n === 0 || lastTwo === 0 || lastTwo >= 20 ? "de " : ""}${many}`;
}

type Role = "camion" | "marfa";
type Open = "from" | "to" | "date" | "truck" | "w8" | null;

/* ------------------------------------------------------------------ date */

const MONTHS = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const SHORT = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sept", "oct", "nov", "dec"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const dm = (s: string) => {
  const d = parse(s);
  return `${d.getDate()} ${SHORT[d.getMonth()]}`;
};

function dateLabel(start: string | null, end: string | null) {
  if (!start) return null;
  const today = iso(new Date());
  const e = end ?? start;
  if (e === start) return start === today ? "Azi" : start === addDays(today, 1) ? "Mâine" : dm(start);
  if (start === today && e === addDays(today, 3)) return "Azi – 3 zile";
  const a = parse(start);
  const b = parse(e);
  return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${SHORT[b.getMonth()]}` : `${dm(start)} – ${dm(e)}`;
}

/* ------------------------------------------------------------------ camion, greutate */

/* Tipurile de camion și treptele de greutate vin din baza de date (vehicle_types, weight_classes). */

const tons = (t: string) => `${t.replace(".", ",")} t`;

/* ------------------------------------------------------------------ câmpul */

function Field({
  label,
  icon,
  open,
  grow = 1,
  fieldRef,
  onClick,
  children,
}: {
  label: string;
  icon: ReactNode;
  open: boolean;
  grow?: number;
  fieldRef: RefObject<HTMLDivElement | null>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={fieldRef}
      onClick={onClick}
      className={`group/f relative flex h-[46px] min-w-[40%] cursor-pointer items-center gap-[11px] rounded-[10px] px-3 transition-colors sm:min-w-0 sm:px-4 ${
        open ? "bg-[#F7F4F3] shadow-[inset_0_0_0_2px_#2A2E35]" : "hover:bg-[#F7F4F3]"
      }`}
      style={{ flex: grow }}
    >
      {/* pe telefon iconița cedează locul valorii, ca să nu se taie textul */}
      <span className="hidden sm:flex">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-[#4A4F57] uppercase">{label}</span>
        {children}
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
          open ? "bg-graphite text-white" : "bg-[#EEEAE9] text-graphite group-hover/f:bg-graphite group-hover/f:text-white"
        }`}
      >
        <ChevronDown width={15} height={15} strokeWidth={2.6} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
    </div>
  );
}

const valueText = (empty: boolean) =>
  `block w-full truncate pr-8 text-left text-base ${empty ? "font-semibold text-[#5E636B]" : "font-bold text-ink"}`;
const Div = () => <span aria-hidden className="hidden h-[34px] w-px shrink-0 bg-[#D9D2D0] sm:block" />;

/* ------------------------------------------------------------------ calendarul */

function DatePicker({
  start,
  end,
  onChange,
  onDone,
}: {
  start: string | null;
  end: string | null;
  onChange: (s: string | null, e: string | null) => void;
  onDone: () => void;
}) {
  const today = iso(new Date());
  const [view, setView] = useState(() => {
    const d = parse(start ?? today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [picking, setPicking] = useState(false);
  const t = parse(today);
  const atFirst = view.y === t.getFullYear() && view.m === t.getMonth();
  const move = (k: number) => setView((v) => ({ y: v.y + Math.floor((v.m + k) / 12), m: (v.m + k + 12) % 12 }));

  const sunday = addDays(today, (7 - t.getDay()) % 7);
  const quick: [string, string, string][] = [
    ["Azi", today, today],
    ["Mâine", addDays(today, 1), addDays(today, 1)],
    ["Azi – 3 zile", today, addDays(today, 3)],
    ["Săptămâna asta", today, sunday],
  ];
  const e = end ?? start;

  const first = new Date(view.y, view.m, 1);
  const lead = (first.getDay() + 6) % 7; // luni = prima zi
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(view.y, view.m, i + 1)))];

  const click = (d: string) => {
    if (!picking || !start || d < start) {
      onChange(d, d);
      setPicking(true);
    } else {
      onChange(start, d);
      setPicking(false);
    }
  };

  const nDays = start && e ? Math.round((parse(e).getTime() - parse(start).getTime()) / 86_400_000) + 1 : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2 px-3.5 pt-3 pb-1">
        {quick.map(([label, a, b]) => (
          <Chip
            key={label}
            on={start === a && e === b}
            onClick={() => {
              onChange(a, b);
              setPicking(false);
              const d = parse(a);
              setView({ y: d.getFullYear(), m: d.getMonth() });
            }}
          >
            {label}
          </Chip>
        ))}
      </div>
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={atFirst}
          aria-label="Luna anterioară"
          className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-[#D2CBC9] text-ink hover:border-graphite disabled:cursor-default disabled:opacity-35 disabled:hover:border-[#D2CBC9]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <span className="text-[15px] font-extrabold text-ink capitalize">
          {MONTHS[view.m]} {view.y}
        </span>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="Luna următoare"
          className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-[#D2CBC9] text-ink hover:border-graphite"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 px-3.5 pb-1">
        {["LU", "MA", "MI", "JO", "VI", "SÂ", "DU"].map((d) => (
          <span key={d} className="py-1 text-center text-[11px] font-extrabold tracking-[0.06em] text-[#5E636B]">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`x${i}`} className="h-9" />;
          const past = d < today;
          const inRange = !!start && !!e && d >= start && d <= e;
          const edge = d === start || d === e;
          const single = start === e;
          const band = !inRange || single ? "" : d === start ? "bg-gradient-to-r from-transparent from-50% to-brand-600/15 to-50%" : d === e ? "bg-gradient-to-r from-brand-600/15 from-50% to-transparent to-50%" : "bg-brand-600/15";
          return (
            <span key={d} className={`flex h-9 items-center justify-center ${band}`}>
              <button
                type="button"
                disabled={past}
                onClick={() => click(d)}
                aria-pressed={inRange}
                aria-label={`${parse(d).getDate()} ${MONTHS[view.m]}`}
                className={`flex size-[34px] items-center justify-center rounded-full text-sm transition-colors ${
                  edge && inRange
                    ? "bg-gradient-to-b from-[#DC2A21] to-[#B8190F] font-extrabold text-white"
                    : past
                      ? "cursor-default font-semibold text-[#5E636B] line-through opacity-55"
                      : `cursor-pointer font-bold text-ink hover:bg-[#EEEAE9] ${d === today ? "ring-[1.5px] ring-graphite ring-inset" : ""}`
                }`}
              >
                {parse(d).getDate()}
              </button>
            </span>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-[#EEE7E6] px-3.5 pt-3 pb-3.5">
        <span className="min-w-0 text-[13px] font-bold text-[#5E636B]">
          {start ? (
            <>
              {dateLabel(start, end)} · <span className="text-ink">{nDays === 1 ? "o zi" : `${nDays} zile`}</span>{" "}
              <button type="button" onClick={() => onChange(null, null)} className="ml-1 cursor-pointer text-[#B8190F] underline underline-offset-2">
                Șterge
              </button>
            </>
          ) : (
            "Alege o zi sau o perioadă"
          )}
        </span>
        <button type="button" onClick={onDone} className="relative shrink-0 cursor-pointer px-5 py-2 text-sm font-extrabold text-white">
          <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[4px] bg-gradient-to-b from-[#DC2A21] to-[#B8190F]" />
          <span className="relative">Gata</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ căutarea */

/**
 * Căutarea din hero: comutator „caut camion / caut marfă”, rută, perioadă, camion, greutate.
 * Fiecare câmp deschide o fereastră proprie (varianta A), cu săgeată spre câmp.
 * Formular GET spre /camioane sau /marfa; valorile alese pleacă în câmpuri ascunse.
 */
export function HeroSearch({
  loads,
  trucks,
  countries,
  vehicles,
  weights: weightRows,
}: {
  loads: number;
  trucks: number;
  countries: CountryItem[];
  vehicles: RefVehicle[];
  weights: RefWeight[];
}) {
  // cele mai folosite tipuri întâi; restul apar la „Încă … tipuri”
  const truckFirst = vehicles.filter((v) => v.common).map((v) => v.slug);
  const truckOrder = [...truckFirst, ...vehicles.filter((v) => !v.common).map((v) => v.slug)];
  const vBySlug = new Map(vehicles.map((v) => [v.slug, v]));
  const truckName = (slug: string) => vBySlug.get(slug)?.title ?? slug;
  const WEIGHTS = weightRows.map((w) => ({ t: w.tons == null ? "" : String(w.tons), name: w.name, sub: w.sub, fill: w.fill }));
  const [role, setRole] = useState<Role>("camion");
  const [open, setOpen] = useState<Open>(null);
  const [from, setFrom] = useState<Place>({ text: "" });
  const [to, setTo] = useState<Place>({ text: "" });
  const [locating, setLocating] = useState<"idle" | "busy" | "error">("idle");
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState("");
  const [moreTrucks, setMoreTrucks] = useState(false);
  const [weight, setWeight] = useState("");
  const [exact, setExact] = useState("");

  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLFormElement>(null);
  const refs = {
    from: useRef<HTMLDivElement>(null),
    to: useRef<HTMLDivElement>(null),
    date: useRef<HTMLDivElement>(null),
    truck: useRef<HTMLDivElement>(null),
    w8: useRef<HTMLDivElement>(null),
  };

  const action = role === "camion" ? "/camioane" : "/marfa";

  // Clic în afară sau Esc închid fereastra.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const show = (o: Exclude<Open, null>) => setOpen(o);
  const toggle = (o: Exclude<Open, null>) => (open === o ? setOpen(null) : show(o));

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const locate = () => {
    if (!navigator.geolocation) return setLocating("error");
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`/api/localitati?lat=${coords.latitude}&lng=${coords.longitude}`);
          const { city } = await r.json();
          if (!city) throw new Error("fără oraș");
          setFrom({ text: city.name, country: city.country });
          setLocating("idle");
          setOpen(null);
        } catch {
          setLocating("error");
        }
      },
      () => setLocating("error"),
      { timeout: 8000, maximumAge: 600_000 },
    );
  };

  /** Câmpurile „De unde / Până unde”: un buton care deschide fereastra cu țări și orașe. */
  const cityField = (which: "from" | "to") => {
    const place = which === "from" ? from : to;
    const empty = !place.text;
    const text = empty ? (which === "from" ? "Oraș de încărcare" : "Oriunde în UE") : place.text;
    const label = which === "from" ? "De unde" : "Până unde";
    return (
      <Field
        label={label}
        grow={1.2}
        open={open === which}
        fieldRef={refs[which]}
        onClick={() => toggle(which)}
        icon={<Pin width={20} height={20} className={`shrink-0 ${which === "from" ? "text-brand-600" : "text-graphite"}`} />}
      >
        <button type="button" aria-haspopup="dialog" aria-expanded={open === which} aria-label={`${label}: ${text}`} className={valueText(empty)}>
          {text}
          {!empty && place.country && (
            <span className="ml-1.5 align-[1px] text-xs font-extrabold tracking-[0.04em] text-[#6B717A]">{place.whole ? "toată țara" : place.country}</span>
          )}
        </button>
      </Field>
    );
  };

  const listButton = (o: Exclude<Open, null>, text: string, empty: boolean, label: string) => (
    <button type="button" aria-haspopup="dialog" aria-expanded={open === o} aria-label={`${label}: ${text}`} className={valueText(empty)}>
      {text}
    </button>
  );

  const pickCity = (which: "from" | "to") => (p: Place) => {
    (which === "from" ? setFrom : setTo)(p);
    setOpen(null);
  };

  const showAll = moreTrucks || (!!vehicle && !truckFirst.includes(vehicle));
  const truckList = showAll ? truckOrder : truckFirst;
  const hidden = truckOrder.filter((s) => !truckFirst.includes(s));
  const weightText = weight ? (WEIGHTS.some((w) => w.t === weight) ? WEIGHTS.find((w) => w.t === weight)!.name : tons(weight)) : "Oricât";
  const dLabel = dateLabel(start, end);

  const tab = (value: Role, icon: ReactNode, text: string, short: string) => {
    const on = role === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setRole(value)}
        className={`relative flex cursor-pointer items-center gap-2 px-[18px] py-[9px] text-sm ${on ? "font-extrabold text-white" : "font-bold text-white"}`}
      >
        {on && <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[4px] bg-gradient-to-b from-[#DC2A21] to-[#B8190F]" />}
        <span className="relative flex">{icon}</span>
        <span className="relative hidden sm:inline">{text}</span>
        <span className="relative sm:hidden">{short}</span>
      </button>
    );
  };

  const hiddenInput = (name: string, value: string | undefined | null) => (value ? <input type="hidden" name={name} value={value} /> : null);

  return (
    <div ref={wrap} className="relative">
      <form
        ref={card}
        method="get"
        action={action}
        className="overflow-hidden rounded-[18px] border-t-[3px] border-brand-600 shadow-[0_34px_70px_-24px_rgb(0_0_0/0.9)]"
      >
        {hiddenInput("oras_din", from.whole ? null : from.text.trim())}
        {hiddenInput("din", from.country)}
        {hiddenInput("oras_spre", to.whole ? null : to.text.trim())}
        {hiddenInput("spre", to.country)}
        {hiddenInput("data", start)}
        {hiddenInput("pana", start ? (end ?? start) : null)}
        {hiddenInput("vehicul", vehicle)}
        {hiddenInput("tone", weight)}

        {/* Antetul din sticlă mată (varianta C): grafit semitransparent, fotografia se vede estompat prin el */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.18] bg-gradient-to-b from-[rgb(92_98_108/0.78)] to-[rgb(62_67_75/0.82)] px-4 py-3 backdrop-blur-[16px] backdrop-saturate-[1.2]">
          <div role="group" aria-label="Ce cauți" className="relative inline-flex p-1">
            <span aria-hidden className="absolute inset-0 -skew-x-[14deg] rounded-[6px] bg-black/[0.22] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]" />
            {tab("camion", <Box width={17} height={17} />, "Caut camion pentru marfă", "Caut camion")}
            {tab("marfa", <Truck width={17} height={17} />, "Caut marfă pentru camion", "Caut marfă")}
          </div>
          <Link href={action} className="text-[13px] font-bold text-white underline underline-offset-[3px] hover:text-[#FFD9D6]">
            Filtre avansate
          </Link>
        </div>

        <div className="flex flex-col gap-2.5 bg-[#F7F5F4] px-4 pt-3.5 pb-4">
          <div className="flex h-[58px] items-center rounded-xl border-[1.5px] border-[#D2CBC9] bg-white px-1.5">
            {cityField("from")}
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
            {cityField("to")}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 rounded-xl border-[1.5px] border-[#D2CBC9] bg-white px-1.5 py-[5px] sm:h-[58px] sm:flex-nowrap sm:py-0">
            <Field label="Data încărcării" grow={1.2} open={open === "date"} fieldRef={refs.date} onClick={() => toggle("date")} icon={<Calendar width={20} height={20} className="shrink-0 text-graphite" />}>
              {listButton("date", dLabel ?? "Oricând", !dLabel, "Data încărcării")}
            </Field>
            <Div />
            <Field label="Camion" open={open === "truck"} fieldRef={refs.truck} onClick={() => toggle("truck")} icon={<Truck width={20} height={20} className="shrink-0 text-graphite" />}>
              {listButton("truck", vehicle ? (vBySlug.get(vehicle)?.short ?? vehicle) : "Oricare", !vehicle, "Camion")}
            </Field>
            <Div />
            <Field label="Greutate" grow={0.85} open={open === "w8"} fieldRef={refs.w8} onClick={() => toggle("w8")} icon={<Box width={20} height={20} className="shrink-0 text-graphite" />}>
              {listButton("w8", weightText, !weight, "Greutate")}
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
      </form>

      {(open === "from" || open === "to") && (
        <HeroPopover key={open} anchor={refs[open]} card={card} width={420} title={open === "from" ? "De unde încarci?" : "Unde descarci?"} onClose={() => setOpen(null)}>
          <PlacePicker
            which={open}
            place={open === "from" ? from : to}
            countries={countries}
            onPick={pickCity(open)}
            onLocate={open === "from" ? locate : undefined}
            locating={locating}
          />
        </HeroPopover>
      )}

      {open === "date" && (
        <HeroPopover anchor={refs.date} card={card} width={340} title="Când încarci?" onClose={() => setOpen(null)}>
          <DatePicker
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
            onDone={() => setOpen(null)}
          />
        </HeroPopover>
      )}

      {open === "truck" && (
        <HeroPopover anchor={refs.truck} card={card} width={330} title="Ce camion cauți?" onClose={() => setOpen(null)}>
          <div role="listbox" aria-label="Tipul camionului" className="pt-1.5">
            {["", ...truckList].map((slug) => (
              <PickRow
                key={slug || "oricare"}
                h={46}
                selected={vehicle === slug}
                onPick={() => {
                  setVehicle(slug);
                  setOpen(null);
                }}
              >
                <VehicleIcon slug={slug} width={30} height={19} className={`shrink-0 ${vehicle === slug ? "text-brand-600" : "text-[#5E636B]"}`} />
                <span className="flex min-w-0 flex-1 flex-col py-1">
                  <span className="text-[15px] leading-tight font-bold">{slug ? truckName(slug) : "Oricare"}</span>
                  <span className="text-xs leading-snug font-medium text-[#5E636B]">{slug ? vBySlug.get(slug)?.description : "toate tipurile de camion"}</span>
                </span>
              </PickRow>
            ))}
          </div>
          {!showAll && hidden.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreTrucks(true)}
              className="mt-1 flex w-full cursor-pointer items-center justify-between border-t border-[#EEE7E6] px-3.5 pt-2.5 pb-3 text-left text-[13px] font-extrabold text-[#B8190F] hover:bg-[#F7F4F3]"
            >
              Încă {hidden.length} tipuri: {hidden.slice(0, 2).map((s) => truckName(s).toLowerCase()).join(", ")}…
              <ChevronDown width={15} height={15} className="shrink-0 text-[#5E636B]" />
            </button>
          )}
        </HeroPopover>
      )}

      {open === "w8" && (
        <HeroPopover anchor={refs.w8} card={card} width={330} title={role === "camion" ? "Cât cântărește marfa?" : "Cât poate duce camionul?"} onClose={() => setOpen(null)}>
          <div role="listbox" aria-label="Greutate" className="pt-1.5">
            {WEIGHTS.map((w) => {
              const on = weight === w.t && (w.t === "" || exact === "");
              return (
                <PickRow
                  key={w.name}
                  h={42}
                  selected={on}
                  onPick={() => {
                    setWeight(w.t);
                    setExact("");
                    setOpen(null);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold">
                    {w.name}
                    {w.sub && <span className="text-[13px] font-medium text-[#5E636B]"> · {w.sub}</span>}
                  </span>
                  <span aria-hidden className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[#E6E0DE]">
                    {w.fill > 0 && <span className={`block h-full ${on ? "bg-brand-600" : "bg-graphite"}`} style={{ width: `${w.fill * 100}%` }} />}
                  </span>
                </PickRow>
              );
            })}
          </div>
          <label className="mt-1.5 flex items-center gap-2.5 border-t border-[#EEE7E6] px-3.5 pt-3 pb-3.5">
            <span className="text-[13px] font-bold text-[#5E636B]">Exact:</span>
            <span className="flex h-[34px] flex-1 items-center rounded-lg border-[1.5px] border-[#D2CBC9] bg-white px-2.5 focus-within:border-graphite">
              <input
                type="number"
                inputMode="decimal"
                min={0.1}
                max={40}
                step={0.1}
                value={exact}
                onChange={(e) => {
                  setExact(e.target.value);
                  const v = Number.parseFloat(e.target.value);
                  setWeight(v > 0 && v <= 40 ? String(Math.round(v * 10) / 10) : "");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setOpen(null);
                  }
                }}
                placeholder="ex. 18"
                className="w-full min-w-0 bg-transparent text-sm font-bold text-ink outline-none placeholder:font-semibold placeholder:text-[#8A8F96] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm font-bold text-[#5E636B]">tone</span>
            </span>
          </label>
        </HeroPopover>
      )}
    </div>
  );
}
