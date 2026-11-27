"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CountryItem } from "@/lib/places";
import { PlacePicker, type Place } from "@/components/home/PlacePicker";
import { CountryBadge } from "@/components/home/HeroPopover";
import { Field, Ico, ICONS } from "./ui";

/**
 * Câmp de locație pentru paginile de cereri (formulare și filtre): același selector ca în hero
 * (țara, apoi orașele ei), dar într-un meniu alb care se deschide lipit sub câmp, cu săgeată spre el.
 * Valoarea pleacă în formular prin `cityName` (orașul; gol la „Toată țara”) și `countryName` (codul țării).
 */
export function PlaceField({
  label,
  cityName,
  countryName,
  countries,
  defaultPlace,
  placeholder = "Alege țara și orașul",
  required = false,
  optional,
  allowWhole = !required,
  compact = false,
  bare = false,
}: {
  label: string;
  cityName: string;
  countryName: string;
  countries: CountryItem[];
  defaultPlace?: Place;
  placeholder?: string;
  /** orașul e obligatoriu (la publicare) */
  required?: boolean;
  optional?: boolean;
  allowWhole?: boolean;
  /** varianta mai joasă (44px), pentru formularul de căutare de pe /marfa și /camioane */
  compact?: boolean;
  /** fără eticheta de deasupra (o pune pagina) */
  bare?: boolean;
}) {
  const id = useId();
  const [place, setPlace] = useState<Place>(defaultPlace ?? { text: "" });
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const first = useRef(true);

  // anunță formularul că s-a schimbat valoarea (pentru previzualizarea din dreapta)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    wrap.current
      ?.closest("form")
      ?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [place]);

  // clic în afară sau Esc închid meniul
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (p: Place) => {
    setPlace(p);
    setOpen(false);
    btn.current?.focus();
  };

  const empty = !place.text;
  const city = place.whole ? "" : place.text.trim();

  const box = (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        id={`${id}-b`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          bare ? `${label}: ${empty ? placeholder : place.text}` : undefined
        }
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[11px] border-[1.5px] bg-white text-left transition-colors ${compact ? "h-11 px-3" : "h-[50px] px-3.5"} ${
          open
            ? "border-graphite shadow-[0_0_0_3px_rgb(42_46_53/0.1)]"
            : "border-[#D9D2D0] hover:border-[#B9B1AF]"
        }`}
      >
        <Ico d={ICONS.pin} size={18} className="shrink-0 text-[#6B717A]" />
        <span
          className={`min-w-0 flex-1 truncate text-[15.5px] ${empty ? "text-[#8A9099]" : "font-semibold text-ink"}`}
        >
          {empty ? (
            placeholder
          ) : place.whole ? (
            <>Toată țara · {place.text}</>
          ) : (
            place.text
          )}
        </span>
        {!empty && place.country && !place.whole && (
          <CountryBadge code={place.country} />
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`shrink-0 text-graphite transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* valorile pentru formular; câmpul de oraș e și cel pe care îl verifică browserul când e obligatoriu */}
      <input
        tabIndex={-1}
        aria-hidden
        name={required || city ? cityName : undefined}
        value={city}
        required={required}
        onChange={() => {}}
        onInvalid={(e) => {
          // în locul bulei browserului deschidem meniul, dar doar pentru primul câmp necompletat
          e.preventDefault();
          const firstBad = e.currentTarget.form?.querySelector(
            "input:invalid, select:invalid, textarea:invalid",
          );
          if (firstBad === e.currentTarget) {
            setOpen(true);
            btn.current?.scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          }
        }}
        className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
      />
      {place.country && (
        <input type="hidden" name={countryName} value={place.country} />
      )}

      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute top-full left-0 z-20 mt-2.5 w-full animate-[dd-drop_.16s_ease-out] sm:w-[max(100%,360px)]"
        >
          <div className="overflow-hidden rounded-[14px] border border-[#D2CBC9] bg-white shadow-[0_22px_44px_-16px_rgb(0_0_0/0.4),0_4px_12px_rgb(20_22_26/0.12)]">
            <PlacePicker
              which={`${id}-pp`}
              place={place}
              countries={countries}
              onPick={pick}
              allowWhole={allowWhole}
              listMax={compact ? 250 : 256}
            />
          </div>
          {/* săgeata spre câmp, peste marginea de sus a meniului */}
          <span
            aria-hidden
            className="absolute -top-[7px] left-6 size-3.5 rotate-45 rounded-[2px] border-t border-l border-[#D2CBC9] bg-white"
          />
        </div>
      )}
    </div>
  );

  return bare ? (
    box
  ) : (
    <Field label={label} optional={optional} htmlFor={`${id}-b`}>
      {box}
    </Field>
  );
}
