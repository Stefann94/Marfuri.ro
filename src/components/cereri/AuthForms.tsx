"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/cont/actions";
import { ErrorBox, SubmitButton } from "./client";
import { Field, inputBox, inputCls } from "./ui";

function Inp({ name, label, values, ...rest }: { name: string; label: string; values?: Record<string, string> } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} htmlFor={`a-${name}`}>
      <div className={inputBox}>
        <input id={`a-${name}`} name={name} defaultValue={values?.[name]} className={inputCls} {...rest} />
      </div>
    </Field>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, {} as FormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Inp name="email" label="E-mail" type="email" autoComplete="email" required values={state.values} />
      <Inp name="parola" label="Parola" type="password" autoComplete="current-password" required />
      <ErrorBox>{state.error}</ErrorBox>
      <SubmitButton>Intră în cont</SubmitButton>
      <p className="text-center text-[14.5px] text-[#3A404A]">
        Nu ai cont?{" "}
        <Link href={`/cont/inregistrare?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600 underline underline-offset-[3px]">
          Creează unul în 1 minut
        </Link>
      </p>
    </form>
  );
}

type Anaf = { name: string; city: string; active: boolean };

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(register, {} as FormState);
  const [cui, setCui] = useState(state.values?.cui ?? "");
  const [firma, setFirma] = useState(state.values?.firma ?? "");
  const [anaf, setAnaf] = useState<{ loading?: boolean; ok?: Anaf; msg?: string }>({});

  async function check(v: string) {
    const digits = v.replace(/\D/g, "");
    if (digits.length < 2) return;
    setAnaf({ loading: true });
    try {
      const r = await fetch(`/api/anaf?cui=${digits}`);
      const j = await r.json();
      if (j.ok) {
        setAnaf({ ok: { name: j.firma.name, city: j.firma.city, active: j.firma.active } });
        setFirma(j.firma.name);
      } else setAnaf({ msg: j.motiv });
    } catch {
      setAnaf({ msg: "Nu am putut verifica acum. Poți scrie numele firmei de mână." });
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="CUI-ul firmei" htmlFor="a-cui">
        <div className={inputBox}>
          <span className="text-sm font-extrabold text-[#6B717A]">RO</span>
          <input
            id="a-cui"
            name="cui"
            inputMode="numeric"
            required
            value={cui}
            onChange={(e) => setCui(e.target.value)}
            onBlur={(e) => check(e.target.value)}
            placeholder="ex. 14399840"
            className={inputCls}
          />
          <button type="button" onClick={() => check(cui)} className="cursor-pointer rounded-lg bg-[#EEEAE9] px-3 py-1.5 text-[13px] font-bold text-graphite hover:bg-[#E2DCDA]">
            {anaf.loading ? "Caut…" : "Caută la ANAF"}
          </button>
        </div>
      </Field>
      {anaf.ok && (
        <p className={`rounded-xl px-4 py-3 text-[14.5px] font-semibold ${anaf.ok.active ? "bg-[#E6F4EA] text-[#157F3B]" : "bg-[#FDF2F1] text-[#9F1A12]"}`}>
          {anaf.ok.active ? "✓ Am găsit firma la ANAF: " : "Firma apare la ANAF ca inactivă: "}
          <b>{anaf.ok.name}</b>
          {anaf.ok.city && anaf.ok.city !== "—" ? `, ${anaf.ok.city}` : ""}
        </p>
      )}
      {anaf.msg && <p className="text-[14px] font-semibold text-[#9F1A12]">{anaf.msg}</p>}
      <Field label="Numele firmei" htmlFor="a-firma">
        <div className={inputBox}>
          <input id="a-firma" name="firma" value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="Se completează singur după CUI" className={inputCls} />
        </div>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Inp name="nume" label="Numele tău" autoComplete="name" required values={state.values} />
        <Inp name="telefon" label="Telefon" type="tel" autoComplete="tel" required values={state.values} placeholder="07xx xxx xxx" />
      </div>
      <Inp name="email" label="E-mail" type="email" autoComplete="email" required values={state.values} />
      <Inp name="parola" label="Parolă (cel puțin 8 caractere)" type="password" autoComplete="new-password" minLength={8} required />
      <ErrorBox>{state.error}</ErrorBox>
      <SubmitButton>Creează contul firmei</SubmitButton>
      <p className="text-center text-[14.5px] text-[#3A404A]">
        Ai deja cont?{" "}
        <Link href={`/cont/autentificare?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600 underline underline-offset-[3px]">
          Intră în cont
        </Link>
      </p>
    </form>
  );
}
