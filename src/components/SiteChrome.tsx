import Link from "next/link";
import { SITE } from "@/lib/site";
import { COUNTRIES, POPULAR_DESTINATIONS, countryName, routePath } from "@/lib/geo";
import { TruckLogo } from "@/components/brand/TruckLogo";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label={`${SITE.name}, pagina principală`} className="inline-block">
            <TruckLogo idPrefix="mff" className="h-[52px] w-auto" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {SITE.tagline} pentru România și Europa. Transportatori și expeditori verificați, care se găsesc rapid unii pe alții.
          </p>
        </div>
        <FooterCol title="Platformă">
          <FooterLink href="/marfa">Caută marfă</FooterLink>
          <FooterLink href="/camioane">Caută camion</FooterLink>
          <FooterLink href="/firme">Firme verificate</FooterLink>
          <FooterLink href="/instrumente">Instrumente</FooterLink>
          <FooterLink href="/ghiduri">Ghiduri</FooterLink>
          <FooterLink href="/preturi">Prețuri</FooterLink>
          <FooterLink href="/transport-marfa">Toate rutele</FooterLink>
        </FooterCol>
        <FooterCol title="Din România spre">
          {POPULAR_DESTINATIONS.slice(0, 6).map((c) => (
            <FooterLink key={c} href={routePath("RO", c)}>Transport marfă {countryName(c)}</FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Spre România din">
          {POPULAR_DESTINATIONS.slice(0, 6).map((c) => (
            <FooterLink key={c} href={routePath(c, "RO")}>Transport {countryName(c)} – România</FooterLink>
          ))}
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {year} {SITE.name}. Toate drepturile rezervate.</p>
          <p>Acoperim {COUNTRIES.length} de țări din Europa.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-muted hover:text-brand-700">{children}</Link>
    </li>
  );
}
