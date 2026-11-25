import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { listCompanies } from "@/lib/queries";
import { countryName } from "@/lib/geo";
import { Breadcrumbs, VerifiedBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Firme verificate de transport și expediții",
  description: "Catalogul firmelor de transport, expeditorilor și caselor de expediții de pe Mărfuri.ro, cu verificare ANAF.",
  alternates: { canonical: "/firme" },
};

const KIND: Record<string, string> = { carrier: "Transportator", forwarder: "Casă de expediții", shipper: "Expeditor" };

export default async function CompaniesPage() {
  await connection();
  const list = await listCompanies();
  return (
    <div className="container-page pt-8">
      <Breadcrumbs items={[{ name: "Firme verificate", href: "/firme" }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Firme verificate</h1>
      <p className="mt-2 max-w-2xl text-muted">Transportatori, expeditori și case de expediții. Firmele cu insigna „Verificată” au codul fiscal validat la ANAF.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <li key={c.slug}>
            <Link href={`/firme/${c.slug}`} className="card flex h-full flex-col gap-1.5 p-5 transition hover:border-brand-200 hover:shadow-md">
              <span className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">{c.name}</span>
                {c.verified && <VerifiedBadge small />}
              </span>
              <span className="text-sm text-muted">
                {KIND[c.kind] ?? c.kind} · {c.city}, {countryName(c.country)}
                {c.fleetSize ? ` · ${c.fleetSize} vehicule` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
