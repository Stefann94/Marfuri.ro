"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { acceptLoad, acceptTruck, type AcceptState } from "@/lib/cereri-actions";
import { Check, Field, Ico, ICONS, Skew, btnCls, inputBox, inputCls } from "./ui";

export type CityOpt = { n: string; c: string };
export type CountryOpt = { code: string; name: string };

/** Oraș (cu sugestii din nomenclator) + țara; alegerea unui oraș cunoscut potrivește singură țara. */
export function CityField({
  label,
  cityName,
  countryName,
  cities,
  countries,
  defaultCity = "",
  defaultCountry = "RO",
  placeholder,
  required = true,
  optional,
}: {
  label: string;
  cityName: string;
  countryName: string;
  cities: CityOpt[];
  countries: CountryOpt[];
  defaultCity?: string;
  defaultCountry?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
}) {
  const id = useId();
  const [country, setCountry] = useState(defaultCountry);
  const onCity = (v: string) => {
    const hit = cities.find((c) => c.n.toLowerCase() === v.trim().toLowerCase());
    if (hit) setCountry(hit.c);
  };
  return (
    <Field label={label} optional={optional} htmlFor={`${id}-c`}>
      <div className={inputBox}>
        <Ico d={ICONS.pin} size={18} className="text-[#6B717A]" />
        <input
          id={`${id}-c`}
          name={cityName}
          list={`${id}-l`}
          defaultValue={defaultCity}
          required={required}
          placeholder={placeholder ?? "Scrie orașul"}
          autoComplete="off"
          onChange={(e) => onCity(e.target.value)}
          className={inputCls}
        />
        <select
          name={countryName}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label={`Țara (${label.toLowerCase()})`}
          className="max-w-[96px] cursor-pointer rounded-[5px] bg-[#EEEAE9] px-1.5 py-1 text-xs font-extrabold tracking-[0.04em] text-graphite outline-none"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
      </div>
      <datalist id={`${id}-l`}>
        {cities.map((c) => (
          <option key={`${c.c}-${c.n}`} value={c.n}>
            {c.c}
          </option>
        ))}
      </datalist>
    </Field>
  );
}

export function SubmitButton({ children, size = "lg", full = true }: { children: ReactNode; size?: "md" | "lg"; full?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${btnCls(size)} ${full ? "w-full" : ""}`}>
      <Skew />
      {pending ? "Se trimite…" : children}
    </button>
  );
}

export function ErrorBox({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-[#F3C4C0] bg-[#FDF2F1] px-4 py-3 text-[14.5px] font-semibold text-[#9F1A12]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5h.01" />
      </svg>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------ fereastra de confirmare */

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-32px)] max-w-[520px] overflow-hidden rounded-[18px] border-t-[3px] border-brand-600 bg-white p-0 text-ink shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] backdrop:bg-[rgb(20_22_26/0.55)]"
    >
      <div className="px-6 pt-5 pb-1.5">
        <h2 className="font-logo text-[21px] font-normal tracking-normal">{title}</h2>
      </div>
      {children}
    </dialog>
  );
}

function Summary({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[#E4E0DE] bg-[#F7F5F4] px-4 py-3.5 text-[14.5px] font-semibold">{children}</div>;
}

function Done({ state, onClose, what }: { state: AcceptState; onClose: () => void; what: string }) {
  const c = state.contact;
  return (
    <div className="flex flex-col gap-3.5 px-6 pt-2 pb-6">
      <p className="flex items-center gap-2 font-bold text-[#157F3B]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
        Ai acceptat {what}.
      </p>
      {c && (
        <Summary>
          <span className="block text-[12px] font-extrabold tracking-[0.06em] text-[#6B717A] uppercase">Sună acum</span>
          <span className="mt-1 block text-[17px] font-extrabold">{c.company}</span>
          {c.name && <span className="block">{c.name}</span>}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-2 text-[18px] font-extrabold text-brand-600 underline underline-offset-[3px]">
              <Ico d={ICONS.phone} size={18} />
              {c.phone}
            </a>
          )}
        </Summary>
      )}
      <p className="text-[13.5px] font-medium text-[#6B717A]">Firma a fost anunțată în contul ei. Găsești datele oricând în „Contul meu”.</p>
      <div className="flex justify-end gap-3">
        <Link href="/cont" className={btnCls("md", "light")}>
          <Skew tone="light" />
          Contul meu
        </Link>
        <button type="button" onClick={onClose} className={btnCls("md")}>
          <Skew />
          Gata
        </button>
      </div>
    </div>
  );
}

function NeedAccount({ next, onClose }: { next: string; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4 px-6 pt-2 pb-6">
      <p className="text-[15px] text-[#3A404A]">Ca să accepți ai nevoie de un cont de firmă (cu CUI). Durează un minut, iar numele firmei vine automat de la ANAF.</p>
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className={btnCls("md", "light")}>
          <Skew tone="light" />
          Nu acum
        </button>
        <Link href={`/cont/autentificare?next=${encodeURIComponent(next)}`} className={btnCls("md", "dark")}>
          <Skew tone="dark" />
          Intră în cont
        </Link>
        <Link href={`/cont/inregistrare?next=${encodeURIComponent(next)}`} className={btnCls("md")}>
          <Skew />
          Creează cont
        </Link>
      </div>
    </div>
  );
}

/** „Acceptă cursa” (lista Am camion liber). */
export function AcceptLoad({ id, summary, hasPrice, loggedIn, next }: { id: number; summary: ReactNode; hasPrice: boolean; loggedIn: boolean; next: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(acceptLoad.bind(null, id), {} as AcceptState);
  if (state.ok && !open) return <AcceptedPill />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnCls("sm")}>
        <Skew />
        Acceptă cursa
      </button>
      {open && <Modal open={open} onClose={() => setOpen(false)} title={state.ok ? "Cursa e a ta" : "Accepți această cursă?"}>
        {!loggedIn || state.login ? (
          <NeedAccount next={next} onClose={() => setOpen(false)} />
        ) : state.ok ? (
          <Done state={state} what="cursa" onClose={() => setOpen(false)} />
        ) : (
          <form action={action} className="flex flex-col gap-3.5 px-6 pt-2 pb-6">
            <Summary>{summary}</Summary>
            <Field label="Cu ce camion faci cursa" htmlFor={`cam-${id}`}>
              <div className={inputBox}>
                <input id={`cam-${id}`} name="camion" required placeholder="ex. Prelată 24 t · CJ 12 ABC" className={inputCls} />
              </div>
            </Field>
            {!hasPrice && (
              <Field label="Prețul tău pentru cursă" optional htmlFor={`pr-${id}`}>
                <div className={inputBox}>
                  <input id={`pr-${id}`} name="pret" inputMode="numeric" placeholder="ex. 850" className={inputCls} />
                  <span className="text-sm font-bold text-[#6B717A]">€</span>
                </div>
              </Field>
            )}
            <Check name="disponibil" label="Camionul e disponibil la data încărcării" defaultChecked />
            {hasPrice && <Check name="accept_pret" label="Accept prețul afișat" defaultChecked />}
            <p className="text-[13.5px] leading-[1.45] font-medium text-[#6B717A]">
              Firma care a publicat cererea primește numele firmei tale, telefonul și camionul. Cererea trece în „acceptată” și dispare din listă pentru ceilalți.
            </p>
            <ErrorBox>{state.error}</ErrorBox>
            <div className="flex justify-end gap-3.5 pt-1">
              <button type="button" onClick={() => setOpen(false)} className={btnCls("md", "light")}>
                <Skew tone="light" />
                Renunță
              </button>
              <SubmitButton size="md" full={false}>
                Confirmă acceptarea
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>}
    </>
  );
}

/** „Acceptă camionul” (lista Am marfă de transportat). */
export function AcceptTruck({
  id,
  summary,
  loggedIn,
  next,
  myLoads,
}: {
  id: number;
  summary: ReactNode;
  loggedIn: boolean;
  next: string;
  myLoads: { id: number; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(myLoads[0] ? String(myLoads[0].id) : "nou");
  const [state, action] = useActionState(acceptTruck.bind(null, id), {} as AcceptState);
  if (state.ok && !open) return <AcceptedPill />;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnCls("sm")}>
        <Skew />
        Acceptă camionul
      </button>
      {open && <Modal open={open} onClose={() => setOpen(false)} title={state.ok ? "Camionul e rezervat pentru tine" : "Accepți acest camion?"}>
        {!loggedIn || state.login ? (
          <NeedAccount next={next} onClose={() => setOpen(false)} />
        ) : state.ok ? (
          <Done state={state} what="camionul" onClose={() => setOpen(false)} />
        ) : (
          <form action={action} className="flex flex-col gap-3.5 px-6 pt-2 pb-6">
            <Summary>{summary}</Summary>
            <Field label="Pentru ce marfă" htmlFor={`mf-${id}`}>
              <div className={inputBox}>
                <select id={`mf-${id}`} name="marfa_id" value={choice} onChange={(e) => setChoice(e.target.value)} className={`${inputCls} cursor-pointer`}>
                  {myLoads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} (cererea ta)
                    </option>
                  ))}
                  <option value="nou">+ Descriu o marfă nouă</option>
                </select>
              </div>
            </Field>
            {choice === "nou" && (
              <Field label="Marfa ta" htmlFor={`md-${id}`}>
                <textarea
                  id={`md-${id}`}
                  name="marfa"
                  required
                  rows={3}
                  placeholder="ex. Cluj-Napoca → Stuttgart, 28 nov., 12 t paleți"
                  className="w-full resize-y rounded-[11px] border-[1.5px] border-[#D9D2D0] px-3.5 py-3 text-[15px] outline-none focus:border-graphite"
                />
              </Field>
            )}
            <Field label="Preț propus" optional htmlFor={`pp-${id}`}>
              <div className={inputBox}>
                <input id={`pp-${id}`} name="pret" inputMode="numeric" placeholder="ex. 1.250" className={inputCls} />
                <span className="text-sm font-bold text-[#6B717A]">€</span>
              </div>
            </Field>
            <p className="text-[13.5px] leading-[1.45] font-medium text-[#6B717A]">
              Transportatorul primește numele firmei tale, telefonul și detaliile mărfii. Camionul dispare din listă pentru ceilalți.
            </p>
            <ErrorBox>{state.error}</ErrorBox>
            <div className="flex justify-end gap-3.5 pt-1">
              <button type="button" onClick={() => setOpen(false)} className={btnCls("md", "light")}>
                <Skew tone="light" />
                Renunță
              </button>
              <SubmitButton size="md" full={false}>
                Confirmă acceptarea
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>}
    </>
  );
}

function AcceptedPill() {
  return (
    <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-[#E6F4EA] px-3 text-[13px] font-bold text-[#157F3B]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
      Acceptată de tine
    </span>
  );
}
