import type { Faq } from "@/components/ui";
import type { Ref } from "./ref";
import { fmtInt } from "./format";


type RouteStats = {
  loads: number;
  trucks: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  priceSamples: number;
  vehicles: { vehicle: string; n: number }[];
};

export function routeIntro(ref: Ref, from: string, to: string, s: RouteStats) {
  const A = ref.countryName(from);
  const B = ref.countryName(to);
  if (from === to) {
    return `Oferte actuale de transport marfă intern în ${A}: încărcături de la expeditori și camioane libere de la transportatori verificați. Acum sunt ${fmtInt(s.loads)} oferte de marfă active și ${fmtInt(s.trucks)} camioane disponibile.`;
  }
  return `Găsește marfă de transportat din ${A} în ${B} sau un camion liber pentru marfa ta. Acum sunt ${fmtInt(s.loads)} oferte de marfă active pe această rută și ${fmtInt(s.trucks)} camioane disponibile, publicate de firme verificate.`;
}

export function routeArticle(ref: Ref, from: string, to: string, s: RouteStats): { h: string; p: string[] }[] {
  const A = ref.countryName(from);
  const B = ref.countryName(to);
  const sections: { h: string; p: string[] }[] = [];
  const domestic = from === to;
  const customs = !domestic && (!ref.isEU(from) || !ref.isEU(to));

  sections.push({
    h: domestic ? `Transport marfă intern în ${A}` : `Despre transportul de marfă ${A} – ${B}`,
    p: [
      domestic
        ? `Transportul intern acoperă livrările între orașele din ${A}: distribuție către retaileri, materiale de construcții, produse agricole sau marfă de import adusă din porturi și hub-uri logistice. Ofertele se schimbă de mai multe ori pe zi, așa că merită verificate dimineața devreme și după-amiaza.`
        : `Ruta ${A} – ${B} este folosită atât pentru transporturi complete (FTL, camion de 13,6 m), cât și pentru grupaje (LTL), unde mai mulți expeditori împart același camion. ${customs ? "Pentru că una dintre țări nu face parte din Uniunea Europeană, transportul presupune formalități vamale la frontieră." : "Fiind un transport în interiorul Uniunii Europene, marfa circulă fără formalități vamale, pe baza scrisorii de trăsură CMR."}`,
      s.vehicles.length
        ? `Cele mai cerute tipuri de vehicule pe această rută, după ofertele active: ${s.vehicles.map((v) => ref.vehicleShort(v.vehicle).toLowerCase()).join(", ")}.`
        : `Pe această rută se folosesc în principal camioane cu prelată, frigorifice pentru marfă perisabilă și dube de 3,5 t pentru volume mici.`,
    ],
  });

  if (s.median != null && s.priceSamples >= 5) {
    sections.push({
      h: `Cât costă transportul ${domestic ? `intern în ${A}` : `din ${A} în ${B}`}?`,
      p: [
        `Prețul median al ofertelor de transport publicate pe această rută în ultimele 90 de zile este de aproximativ ${fmtInt(s.median)} €${s.p25 != null && s.p75 != null ? `, iar jumătate dintre oferte se încadrează între ${fmtInt(s.p25)} € și ${fmtInt(s.p75)} €` : ""} (calculat din ${fmtInt(s.priceSamples)} oferte, fără dube de 3,5 t).`,
        "Prețul final depinde de orașele exacte de încărcare și descărcare, greutate și metri liniari, tipul vehiculului, termenul de livrare și sezon. Folosește aceste valori ca reper la negociere, nu ca tarif fix.",
      ],
    });
  }

  sections.push({
    h: "Documente necesare",
    p: [
      domestic
        ? "Pentru transportul intern ai nevoie de aviz de însoțire sau factură, documentele vehiculului și, pentru transportul în cont propriu sau contra cost, de licența de transport și copia conformă emise de ARR."
        : `Pentru transportul internațional ${A} – ${B} sunt necesare scrisoarea de trăsură CMR, factura comercială, licența comunitară (copie conformă la bordul vehiculului) și asigurarea CMR a transportatorului.${customs ? " În plus, sunt necesare declarația vamală de export/import și, după caz, documentul de tranzit (T1) sau carnet TIR." : ""}`,
    ],
  });
  return sections;
}

export function routeFaq(ref: Ref, from: string, to: string, s: RouteStats): Faq[] {
  const A = ref.countryName(from);
  const B = ref.countryName(to);
  const domestic = from === to;
  const customs = !domestic && (!ref.isEU(from) || !ref.isEU(to));
  const label = domestic ? `intern în ${A}` : `din ${A} în ${B}`;
  const faq: Faq[] = [
    {
      q: `Cum găsesc transport de marfă ${label}?`,
      a: `Publică gratuit oferta de marfă cu ruta, data, greutatea și tipul de vehicul, iar transportatorii interesați te contactează. Poți căuta și direct printre camioanele libere care merg ${domestic ? `în ${A}` : `spre ${B}`}.`,
    },
    {
      q: `Cum găsesc marfă pentru camionul meu ${label}?`,
      a: `Filtrează ofertele de marfă după țara și orașul de încărcare și după data la care camionul e liber. Acum sunt ${fmtInt(s.loads)} oferte active pe această rută.`,
    },
  ];
  if (s.median != null && s.priceSamples >= 5) {
    faq.push({
      q: `Cât costă un transport de marfă ${label}?`,
      a: `Conform ofertelor publicate în ultimele 90 de zile, prețul median este de aproximativ ${fmtInt(s.median)} € pentru un transport, în funcție de greutate, vehicul și orașele exacte.`,
    });
  }
  if (!domestic) {
    faq.push({
      q: `Este nevoie de vamă pentru transportul ${A} – ${B}?`,
      a: customs
        ? `Da. ${!ref.isEU(from) ? A : B} nu face parte din Uniunea Europeană, așa că marfa trebuie declarată vamal la export și import.`
        : `Nu. Ambele țări fac parte din Uniunea Europeană, iar marfa circulă liber, însoțită de scrisoarea de trăsură CMR.`,
    });
  }
  return faq;
}
