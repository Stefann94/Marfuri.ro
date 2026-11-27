/** Date publice despre o firmă, din serviciul web ANAF (plătitori de TVA, v9). */
export type AnafCompany = {
  cui: string;
  name: string;
  address: string;
  city: string;
  regNumber: string;
  phone: string;
  vatPayer: boolean;
  /** firmă înregistrată și neinactivă */
  active: boolean;
};

/** Păstrează doar cifrele: „RO 123 456 78” → „12345678”. */
export const cleanCui = (v: string) => v.replace(/\D/g, "").slice(0, 10);

/** Cifra de control a CUI-ului (algoritmul oficial), ca să prindem greșelile de tastare înainte de ANAF. */
export function validCui(cui: string) {
  if (!/^\d{2,10}$/.test(cui)) return false;
  const key = "753217532";
  const digits = cui.slice(0, -1).padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * Number(key[i]);
  const check = ((sum * 10) % 11) % 10;
  return check === Number(cui.at(-1));
}

const today = () => new Date().toISOString().slice(0, 10);

/** Caută firma la ANAF. Întoarce null dacă nu există; aruncă eroare dacă serviciul nu răspunde. */
export async function lookupAnaf(cui: string): Promise<AnafCompany | null> {
  const res = await fetch("https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ cui: Number(cui), data: today() }]),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ANAF a răspuns ${res.status}`);
  const json = await res.json();
  const f = json?.found?.[0];
  if (!f) return null;
  const g = f.date_generale ?? {};
  const sed = f.adresa_sediu_social ?? {};
  const inactive = f.stare_inactiv?.statusInactivi === true;
  const registered = typeof g.stare_inregistrare === "string" && g.stare_inregistrare.toUpperCase().startsWith("INREGISTRAT");
  const rawCity = String(sed.sdenumire_Localitate ?? "");
  const city = /bucure/i.test(rawCity) ? "București" : rawCity.replace(/^(Mun\.|Municipiul|Oraș|Oras|Com\.|Sat)\s+/i, "").trim();
  return {
    cui,
    name: String(g.denumire ?? "").trim(),
    address: String(g.adresa ?? "").trim(),
    city: city || "—",
    regNumber: String(g.nrRegCom ?? "").trim(),
    phone: String(g.telefon ?? "").trim(),
    vatPayer: f.inregistrare_scop_Tva?.scpTVA === true,
    active: registered && !inactive,
  };
}
