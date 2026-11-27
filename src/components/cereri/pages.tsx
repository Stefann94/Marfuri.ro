import Link from "next/link";
import type { ReactNode } from "react";
import { COUNTRIES } from "@/lib/geo";
import { VEHICLES } from "@/lib/vehicles";
import { Skew, btnCls } from "./ui";

/** Fundalul și lățimea paginilor de cereri (ca în machete). */
export function CereriShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#F3F1F0]">
      <div className="mx-auto max-w-[1240px] px-3.5 sm:px-6">{children}</div>
    </div>
  );
}

/** Pentru cine nu are cont: ce trebuie să facă înainte să publice. */
export function NeedAccountCard({ next, what }: { next: string; what: string }) {
  return (
    <div className="mx-auto my-8 max-w-[640px] overflow-hidden rounded-2xl border-t-[3px] border-brand-600 bg-white shadow-[0_20px_44px_-28px_rgb(20_22_26/0.5)]">
      <div className="px-6 pt-6 pb-2 sm:px-8">
        <h2 className="font-logo text-[22px] font-normal tracking-normal">Intră în cont ca să {what}</h2>
        <p className="mt-2 text-[15.5px] text-[#3A404A]">
          Publicăm doar cereri ale firmelor cu CUI, ca transportatorii și expeditorii să știe cu cine lucrează. Contul se face într-un minut, iar numele firmei vine automat de la ANAF.
        </p>
      </div>
      <ul className="flex flex-col gap-2 px-6 py-3 text-[14.5px] font-semibold text-[#3A404A] sm:px-8">
        {["Gratuit, fără card", "Firma ta apare cu „Verificată ANAF”", "Vezi în cont cine îți acceptă cererile"].map((t) => (
          <li key={t} className="flex items-center gap-2.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-brand-600 text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            {t}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3.5 border-t border-[#E4E0DE] px-6 py-5 sm:px-8">
        <Link href={`/cont/inregistrare?next=${encodeURIComponent(next)}`} className={btnCls("lg")}>
          <Skew />
          Creează cont de firmă
        </Link>
        <Link href={`/cont/autentificare?next=${encodeURIComponent(next)}`} className={btnCls("lg", "light")}>
          <Skew tone="light" />
          Am deja cont
        </Link>
      </div>
    </div>
  );
}

/** Datele mici trimise formularelor (sugestii de orașe, țări, vehicule). */
export const formData = () => ({
  countries: COUNTRIES.map((c) => ({ code: c.code, name: c.name })),
  vehicles: VEHICLES.map((v) => ({ slug: v.slug, short: v.short })),
  today: new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" }),
});
