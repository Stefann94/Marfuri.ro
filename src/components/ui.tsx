import Link from "next/link";
import { getRef } from "@/lib/ref";
import { absUrl } from "@/lib/site";
import { Check } from "./icons";

/** Date structurate (schema.org). `<` e escapat ca să nu poată închide tag-ul script. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export async function CountryTag({ code }: { code: string | null }) {
  if (!code) return null;
  const ref = await getRef();
  return (
    <abbr
      title={ref.countryName(code)}
      className="inline-flex h-5 items-center rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold tracking-wide text-slate-600 no-underline ring-1 ring-slate-200 ring-inset"
    >
      {code}
    </abbr>
  );
}

export async function Place({ city, country }: { city: string | null; country: string | null }) {
  if (!city && !country) return <span className="text-slate-500">Orice destinație</span>;
  const ref = await getRef();
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="truncate font-semibold text-slate-900">{city ?? ref.countryName(country)}</span>
      <CountryTag code={country} />
    </span>
  );
}

export function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      title="Firmă verificată (CUI validat la ANAF)"
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}
    >
      <Check width={small ? 11 : 13} height={small ? 11 : 13} strokeWidth={2.6} />
      Verificată
    </span>
  );
}

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Acasă", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Navigare" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-slate-300">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-slate-700">{c.name}</span>
              ) : (
                <Link href={c.href} className="hover:text-brand-700">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absUrl(c.href) })),
        }}
      />
    </>
  );
}

export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = new Set([1, page - 1, page, page + 1, totalPages].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...pages].sort((a, b) => a - b);
  return (
    <nav aria-label="Paginare" className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && <Link className="btn btn-outline px-3" href={href(page - 1)} rel="prev">‹ Înapoi</Link>}
      {sorted.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - sorted[i - 1] > 1 && <span className="px-1 text-slate-400">…</span>}
          {p === page ? (
            <span aria-current="page" className="btn bg-slate-900 px-3.5 text-white">{p}</span>
          ) : (
            <Link className="btn btn-outline px-3.5" href={href(p)}>{p}</Link>
          )}
        </span>
      ))}
      {page < totalPages && <Link className="btn btn-outline px-3" href={href(page + 1)} rel="next">Înainte ›</Link>}
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {children && <div className="mt-2 max-w-md text-sm text-slate-600">{children}</div>}
    </div>
  );
}

export type Faq = { q: string; a: string };

/** Întrebări frecvente: text vizibil (bun pentru SEO) + schema FAQPage. Fără JavaScript. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <>
      <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-4 open:bg-slate-50/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="text-xl leading-none text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
