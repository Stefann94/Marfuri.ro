/*
 * Încarcă (sau actualizează) nomenclatoarele în baza de date, din scripts/data/nomenclatoare.ts.
 * Se poate rula de oricâte ori: țările, tipurile de camion și de firmă se actualizează după cheie,
 * treptele de greutate și întrebările frecvente se rescriu.
 *
 *   npm run db:nomenclatoare                       (baza locală, din .env.local)
 *   node --env-file=.env.supabase scripts/nomenclatoare.ts   (Supabase)
 *
 * Rulează după `db:migrate` și după `import-geonames` (care aduce orașele).
 */
import postgres from "postgres";
import { slugify, normalize } from "../src/lib/text.ts";
import { CITIES_RAW, COMPANY_KINDS, COUNTRIES, EU, FAQS_HOME, POPULAR, VEHICLE_TYPES, WEIGHT_CLASSES } from "./data/nomenclatoare.ts";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

await sql.begin(async (tx) => {
  // țările: ordinea (România, populare, restul), „populară”, „UE”
  const order = ["RO", ...POPULAR];
  for (const [code, name] of COUNTRIES) {
    const row = {
      code,
      name,
      slug: slugify(name),
      sort: order.includes(code) ? order.indexOf(code) : 50,
      popular: POPULAR.includes(code),
      eu: EU.includes(code),
    };
    await tx`insert into countries ${tx(row)} on conflict (code) do update set name = excluded.name, slug = excluded.slug, sort = excluded.sort, popular = excluded.popular, eu = excluded.eu`;
  }

  // orașele cu pagină proprie: le găsim în nomenclatorul GeoNames; dacă lipsesc, le adăugăm
  await tx`update cities set featured = false where featured`;
  let added = 0;
  for (const [i, [country, name, lat, lng]] of CITIES_RAW.entries()) {
    const slug = slugify(name);
    const [hit] = await tx`select id from cities where country = ${country} and slug = ${slug} order by population desc limit 1`;
    if (hit) {
      await tx`update cities set featured = true where id = ${hit.id}`;
    } else {
      added++;
      await tx`insert into cities ${tx({ id: -(i + 1), country, name, slug, region: null, lat, lng, population: 0, search: normalize(name), featured: true })}
        on conflict (id) do update set featured = true`;
    }
  }

  for (const [i, [slug, label, short, title, description, common]] of VEHICLE_TYPES.entries()) {
    await tx`insert into vehicle_types ${tx({ slug, label, short, title, description, common, sort: (i + 1) * 10 })}
      on conflict (slug) do update set label = excluded.label, short = excluded.short, title = excluded.title, description = excluded.description, common = excluded.common, sort = excluded.sort`;
  }

  await tx`delete from weight_classes`;
  for (const [i, [tons, name, sub, fill]] of WEIGHT_CLASSES.entries()) {
    await tx`insert into weight_classes ${tx({ tons, name, sub, fill, sort: (i + 1) * 10 })}`;
  }

  for (const [i, [code, label]] of COMPANY_KINDS.entries()) {
    await tx`insert into company_kinds ${tx({ code, label, sort: (i + 1) * 10 })} on conflict (code) do update set label = excluded.label, sort = excluded.sort`;
  }

  await tx`delete from faqs where page = 'home'`;
  for (const [i, [question, answer]] of FAQS_HOME.entries()) {
    await tx`insert into faqs ${tx({ page: "home", question, answer, sort: (i + 1) * 10 })}`;
  }

  // notificări și mesaje de exemplu pentru contul de test (doar dacă nu are deja)
  const [test] = await tx`select company_id from users where email = 'test@marfuri.ro'`;
  if (test) {
    const [{ n }] = await tx`select count(*)::int as n from notifications where company_id = ${test.company_id}`;
    if (n === 0) {
      const ago = (min: number) => new Date(Date.now() - min * 60_000);
      const rows = [
        { kind: "load", title: "Marfă nouă pe ruta ta", body: "Cluj-Napoca → München · 22 t · prelată", href: "/am-camion-liber", created_at: ago(5), read_at: null },
        { kind: "offer", title: "Cererea ta a fost acceptată", body: "O firmă a acceptat cererea ta. Vezi datele ei în cont.", href: "/cont", created_at: ago(60), read_at: null },
        { kind: "doc", title: "Document care expiră", body: "Licența comunitară expiră în 14 zile", href: "/cont/firma", created_at: ago(60 * 26), read_at: ago(60 * 20) },
        { kind: "rating", title: "Evaluare nouă", body: "Un partener ți-a dat 5 stele", href: "/cont/evaluari", created_at: ago(60 * 50), read_at: ago(60 * 40) },
      ];
      for (const r of rows) await tx`insert into notifications ${tx({ company_id: test.company_id, ...r })}`;
      const [other] = await tx`select id from companies where id <> ${test.company_id} order by verified_at nulls last, id limit 1`;
      if (other) {
        for (const body of ["Bună ziua, mai e valabilă oferta pentru mâine?", "Vă putem trimite camionul la 8:00."]) {
          await tx`insert into messages ${tx({ from_company_id: other.id, to_company_id: test.company_id, body })}`;
        }
      }
    }
  }

  console.log(
    `✓ Nomenclatoare: ${COUNTRIES.length} țări, ${CITIES_RAW.length} orașe cu pagină (${added} adăugate), ${VEHICLE_TYPES.length} tipuri de camion, ` +
      `${WEIGHT_CLASSES.length} trepte de greutate, ${COMPANY_KINDS.length} tipuri de firmă, ${FAQS_HOME.length} întrebări${test ? ", exemple pentru contul de test" : ""}.`,
  );
});
await sql.end();
