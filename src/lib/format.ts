const dShort = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short", timeZone: "UTC" });
const dLong = new Intl.DateTimeFormat("ro-RO", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dMonthYear = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
const num = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });
const int = new Intl.NumberFormat("ro-RO");

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const fmtDate = (iso: string) => dShort.format(asDate(iso));
export const fmtDateLong = (iso: string) => dLong.format(asDate(iso));
export const fmtMonthYear = (d: Date) => dMonthYear.format(d);
export const fmtNum = (n: number) => num.format(n);
export const fmtInt = (n: number) => int.format(n);

export function fmtPrice(price: number | null | undefined, currency = "EUR") {
  if (price == null) return null;
  return `${int.format(price)} ${currency === "EUR" ? "€" : currency}`;
}

/** Data de azi (fus orar România) ca YYYY-MM-DD. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());
}

export function addDaysISO(iso: string, days: number) {
  const d = asDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
