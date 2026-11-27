"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { normalize } from "@/lib/text";
import type { CityItem, CountryItem } from "@/lib/places";
import { CountryBadge, PickRow, SectionLabel } from "./HeroPopover";

/** Un loc ales în căutare: oraș (cu țara) sau țară întreagă. */
export type Place = { text: string; country?: string; whole?: boolean };

const cache = new Map<string, CityItem[]>();

/** Orașe din baza de date (/api/localitati), cu întârziere mică la tastare și cache pe sesiune. */
function useCities(country: string | null, q: string, enabled: boolean) {
  const key = `${country ?? "*"}|${normalize(q)}`;
  const [state, setState] = useState<{ key: string; items: CityItem[] } | null>(null);
  useEffect(() => {
    if (!enabled || (!country && !q.trim())) return;
    const hit = cache.get(key);
    if (hit) {
      setState({ key, items: hit });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const p = new URLSearchParams();
        if (country) p.set("tara", country);
        if (q.trim()) p.set("q", q.trim());
        const r = await fetch(`/api/localitati?${p}`, { signal: ctrl.signal });
        const j = await r.json();
        const items: CityItem[] = j.cities ?? [];
        cache.set(key, items);
        setState({ key, items });
      } catch {
        /* întrerupt sau fără rețea: rămâne lista veche */
      }
    }, q.trim() ? 160 : 0);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [key, country, q, enabled]);
  return { items: state?.key === key ? state.items : null, stale: state && state.key !== key ? state.items : null };
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = normalize(text).indexOf(normalize(q));
  if (!q.trim() || i < 0) return <>{text}</>;
  const n = q.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-brand-600">{text.slice(i, i + n)}</span>
      {text.slice(i + n)}
    </>
  );
}

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden className="shrink-0 text-[#6B717A]">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const listCls = "pp-scroll overflow-y-auto overscroll-contain pb-1.5";

const Chevron = ({ left }: { left?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    <path d={left ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
  </svg>
);

/**
 * Alegerea unui loc: întâi țara (cu căutare în țări și orașe), apoi, cu o glisare,
 * orașele țării alese (cu căutare și, dacă e permis, „Toată țara”). Datele vin din baza de date.
 * Lista are înălțime fixă și se derulează, ca fereastra să rămână mică.
 * Folosit în hero (în HeroPopover) și în paginile de cereri (în PlaceField).
 */
export function PlacePicker({
  which,
  place,
  countries,
  onPick,
  onLocate,
  locating = "idle",
  allowWhole = true,
  listMax = 264,
}: {
  /** prefix unic pentru id-urile din listă */
  which: string;
  place: Place;
  countries: CountryItem[];
  onPick: (p: Place) => void;
  onLocate?: () => void;
  locating?: "idle" | "busy" | "error";
  /** „Toată țara” ca alegere (nu și la publicare, unde orașul e obligatoriu) */
  allowWhole?: boolean;
  /** înălțimea maximă a listei, în pixeli */
  listMax?: number;
}) {
  const startCountry = place.country ? (countries.find((c) => c.code === place.country) ?? null) : null;
  const [country, setCountry] = useState<CountryItem | null>(startCountry);
  const [dir, setDir] = useState<"in" | "back">("in");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const byKeys = useRef(false);

  // pe calculator cursorul intră direct în căutare; pe telefon nu deschidem tastatura singuri
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) input.current?.focus({ preventScroll: true });
  }, [country]);

  const step = country ? "cities" : "countries";
  const { items, stale } = useCities(country?.code ?? null, q, step === "cities" || q.trim().length > 1);
  const cityList = items ?? stale ?? [];
  const loading = items === null && (step === "cities" || q.trim().length > 1);

  const matchedCountries = useMemo(() => {
    const n = normalize(q);
    if (!n) return countries;
    return countries.filter((c) => normalize(c.name).includes(n) || c.code.toLowerCase() === n);
  }, [q, countries]);

  const openCountry = (c: CountryItem) => {
    setDir("in");
    setCountry(c);
    setQ("");
    setActive(0);
  };
  const back = () => {
    setDir("back");
    setCountry(null);
    setQ("");
    setActive(0);
  };
  const pickCity = (c: CityItem) => onPick({ text: c.name, country: c.country });
  const pickWhole = (c: CountryItem) => onPick({ text: c.name, country: c.code, whole: true });

  // opțiunile navigabile cu săgețile, în ordinea în care apar
  type Opt = { key: string; run: () => void };
  const opts: Opt[] =
    step === "countries"
      ? [
          ...matchedCountries.map((c) => ({ key: `c-${c.code}`, run: () => openCountry(c) })),
          ...(q.trim().length > 1 ? cityList.slice(0, 12).map((c) => ({ key: `o-${c.id}`, run: () => pickCity(c) })) : []),
        ]
      : [
          ...(allowWhole && !q.trim() && country ? [{ key: "whole", run: () => pickWhole(country) }] : []),
          ...cityList.map((c) => ({ key: `o-${c.id}`, run: () => pickCity(c) })),
        ];
  const idx = (key: string) => opts.findIndex((o) => o.key === key);

  // cu săgețile, rândul ales rămâne la vedere în lista care se derulează
  const activeKey = opts[active]?.key;
  useEffect(() => {
    if (!byKeys.current || !activeKey) return;
    byKeys.current = false;
    document.getElementById(`${which}-${activeKey}`)?.scrollIntoView({ block: "nearest" });
  }, [activeKey, which]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      byKeys.current = true;
      const n = opts.length;
      if (n) setActive((i) => (e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n));
    } else if (e.key === "Enter") {
      e.preventDefault();
      opts[active]?.run();
    } else if (e.key === "Backspace" && !q && country) {
      back();
    }
  };

  const search = (
    <div className="sticky top-0 z-10 border-b border-[#EEE7E6] bg-white px-3 py-2.5">
      <label className="flex h-[42px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-[#D2CBC9] bg-white px-3 focus-within:border-graphite focus-within:shadow-[0_0_0_3px_rgb(42_46_53/0.1)]">
        <SearchIcon />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          placeholder={country ? `Caută un oraș din ${country.name}` : "Caută țara sau orașul"}
          aria-label={country ? `Caută un oraș din ${country.name}` : "Caută țara sau orașul"}
          aria-controls={`${which}-list`}
          aria-activedescendant={opts[active] ? `${which}-${opts[active].key}` : undefined}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-[#8A9099]"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Șterge căutarea" className="cursor-pointer rounded-md px-1.5 text-lg leading-none text-[#6B717A] hover:text-ink">
            ×
          </button>
        )}
      </label>
    </div>
  );

  const cityRow = (c: CityItem, showCountry: boolean) => {
    const key = `o-${c.id}`;
    const sel = !place.whole && place.text === c.name && place.country === c.country;
    return (
      <PickRow key={key} id={`${which}-${key}`} selected={sel} active={opts[active]?.key === key} onHover={() => setActive(idx(key))} onPick={() => pickCity(c)}>
        {showCountry && <CountryBadge code={c.country} />}
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold">
          <Highlight text={c.name} q={q} />
          {c.region && c.region !== c.name && <span className="font-medium text-[#6B717A]">, {c.region}</span>}
        </span>
      </PickRow>
    );
  };

  return (
    <div key={step} className={dir === "in" && step === "cities" ? "animate-[pp-in_.28s_cubic-bezier(.22,1,.36,1)]" : step === "countries" && dir === "back" ? "animate-[pp-back_.28s_cubic-bezier(.22,1,.36,1)]" : ""}>
      {step === "cities" && country && (
        <div className="flex items-center gap-2 border-b border-[#EEE7E6] px-2 py-1.5">
          <button type="button" onClick={back} className="flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-bold text-[#4A4F57] hover:bg-[#F7F4F3] hover:text-ink">
            <Chevron left />
            Toate țările
          </button>
          <span className="ml-auto flex items-center gap-2 pr-2 text-[15px] font-extrabold">
            <CountryBadge code={country.code} />
            {country.name}
          </span>
        </div>
      )}
      {search}

      {step === "countries" && onLocate && !q && (
        <button
          type="button"
          onClick={onLocate}
          disabled={locating === "busy"}
          className="flex h-10 w-full cursor-pointer items-center gap-2.5 border-b border-[#EEE7E6] px-3.5 text-left text-sm font-extrabold text-[#B8190F] hover:bg-[#F7F4F3] disabled:cursor-wait"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C8201A" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {locating === "busy" ? "Caut locația…" : locating === "error" ? "Nu am putut afla locația. Alege țara." : "Folosește locația mea"}
        </button>
      )}

      {step === "countries" ? (
        <div role="listbox" id={`${which}-list`} className={listCls} style={{ maxHeight: listMax }}>
          {matchedCountries.length > 0 && <SectionLabel>{q ? "Țări" : "Alege țara"}</SectionLabel>}
          {matchedCountries.map((c) => {
            const key = `c-${c.code}`;
            return (
              <PickRow key={key} id={`${which}-${key}`} selected={place.country === c.code} active={opts[active]?.key === key} onHover={() => setActive(idx(key))} onPick={() => openCountry(c)}>
                <CountryBadge code={c.code} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold">
                  <Highlight text={c.name} q={q} />
                </span>
                <span className="text-[#9AA0A8]">
                  <Chevron />
                </span>
              </PickRow>
            );
          })}
          {q.trim().length > 1 && (
            <>
              <SectionLabel>Orașe</SectionLabel>
              {loading && cityList.length === 0 ? (
                <p className="px-3.5 py-2.5 text-sm text-[#6B717A]">Caut…</p>
              ) : cityList.length ? (
                cityList.slice(0, 12).map((c) => cityRow(c, true))
              ) : (
                <p className="px-3.5 py-2.5 text-sm text-[#4A4F57]">Nu am găsit „{q.trim()}”. Încearcă fără diacritice sau alege întâi țara.</p>
              )}
            </>
          )}
        </div>
      ) : (
        country && (
          <div role="listbox" id={`${which}-list`} className={listCls} style={{ maxHeight: listMax }}>
            {allowWhole && !q.trim() && (
              <PickRow
                id={`${which}-whole`}
                selected={!!place.whole && place.country === country.code}
                active={opts[active]?.key === "whole"}
                onHover={() => setActive(idx("whole"))}
                onPick={() => pickWhole(country)}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-graphite text-white">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold">
                  Toată țara <span className="font-medium text-[#6B717A]">· {country.name}</span>
                </span>
              </PickRow>
            )}
            <SectionLabel>{q.trim() ? "Rezultate" : "Cele mai mari orașe"}</SectionLabel>
            {loading && cityList.length === 0 ? (
              <div className="flex flex-col gap-2 px-3.5 py-2" aria-hidden>
                {[70, 55, 62, 48].map((w) => (
                  <span key={w} className="h-4 animate-pulse rounded bg-[#EEEAE9]" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : cityList.length ? (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>{cityList.map((c) => cityRow(c, false))}</div>
            ) : (
              <p className="px-3.5 py-2.5 text-sm text-[#4A4F57]">
                Nu am găsit „{q.trim()}” în {country.name}. Poți alege „Toată țara” sau încearcă altfel.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
