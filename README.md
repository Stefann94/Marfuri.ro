# Bursă de transport marfă

Next.js 16 · React 19 · TypeScript · Tailwind 4 · PostgreSQL (Drizzle ORM)

## Pornire locală

```bash
npm install
npm run db:dev        # terminal 1: PostgreSQL local (PGlite, fără instalare), port 54322
npm run db:migrate    # o dată: creează tabelele
npm run db:seed       # opțional: date demo (șterge datele existente)
npm run dev           # terminal 2: http://localhost:3000
```

Configurare în `.env.local` (vezi `.env.example`).

## Structură

| Cale | Ce face |
|---|---|
| `src/app/page.tsx` | pagina principală |
| `src/app/marfa`, `src/app/camioane` | liste cu filtre + pagini de detaliu |
| `src/app/transport-marfa/[from]/[to]` | pagini SEO pe rute (ex. `/transport-marfa/romania/germania`) |
| `src/app/transport-marfa/[from]` | pagini SEO pe țări |
| `src/app/orase/[city]` | pagini SEO pe orașe |
| `src/app/firme/[slug]` | profiluri de firme |
| `src/app/sitemap.ts`, `robots.ts` | sitemap dinamic și robots.txt |
| `src/db/schema.ts` | schema bazei de date (migrări: `npm run db:generate`) |
| `src/lib/queries.ts` | toate interogările |
| `src/lib/geo.ts` | țări, orașe, coordonate |
| `src/lib/seo-content.ts` | texte generate pentru paginile de rută |

## Performanță și SEO

- Paginile de rută, țară, oraș, firmă și detaliu sunt **ISR**: generate la prima vizită, servite din cache (~5 ms), reîmprospătate la 5–10 minute.
- Build-ul **nu are nevoie de baza de date**: imaginea se construiește oriunde (GitHub Actions) și doar rulează pe server.
- Formularul de căutare funcționează fără JavaScript; listele nu fac prefetch inutil.
- Date structurate: BreadcrumbList, FAQPage, Organization, WebSite.
- Paginile cu filtre arbitrare sunt `noindex, follow`; rutele rare fără oferte sunt `noindex`.

## Producție pe VPS Hostico (vps:go0, 2 GB RAM)

1. Comandă VPS neadministrat cu Ubuntu 24.04; instalează Docker.
2. Construiește imaginile (local sau în CI) și urcă-le într-un registry (ex. GHCR):
   ```bash
   docker build --target runner   --build-arg NEXT_PUBLIC_SITE_URL=https://exemplu.ro -t ghcr.io/OWNER/bursa-app .
   docker build --target migrator -t ghcr.io/OWNER/bursa-migrate .
   ```
3. Pe server, în `/opt/bursa`: copiază `deploy/docker-compose.yml`, `deploy/Caddyfile`, `deploy/backup.sh`, creează `.env` după `deploy/.env.example`, apoi:
   ```bash
   docker compose pull && docker compose up -d
   ```
4. Domeniul în Cloudflare (DNS proxy, SSL „Full (strict)”). Caddy obține automat certificatul HTTPS.
5. Backup zilnic: `crontab -e` → `15 3 * * * /opt/bursa/backup.sh`.

Buget de memorie: PostgreSQL ~700 MB, aplicația ~600 MB, Caddy ~128 MB, restul sistemului. Adaugă 2 GB swap ca siguranță.
