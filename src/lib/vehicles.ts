export type Vehicle = { slug: string; label: string; short: string };

export const VEHICLES: Vehicle[] = [
  { slug: "prelata", label: "Prelată standard (13,6 m)", short: "Prelată" },
  { slug: "mega", label: "Mega trailer (3 m înălțime)", short: "Mega" },
  { slug: "frigorific", label: "Frigorific", short: "Frigorific" },
  { slug: "izoterm", label: "Izoterm", short: "Izoterm" },
  { slug: "box", label: "Box / furgon închis", short: "Box" },
  { slug: "jumbo", label: "Jumbo / tandem", short: "Jumbo" },
  { slug: "platforma", label: "Platformă", short: "Platformă" },
  { slug: "trailer-jos", label: "Trailer jos / agabaritic", short: "Agabaritic" },
  { slug: "basculanta", label: "Basculantă", short: "Basculantă" },
  { slug: "cisterna", label: "Cisternă", short: "Cisternă" },
  { slug: "container", label: "Portcontainer", short: "Container" },
  { slug: "auto-transportor", label: "Transportor auto", short: "Auto-transportor" },
  { slug: "duba", label: "Dubă / sub 3,5 t", short: "Dubă 3,5 t" },
];

const bySlug = new Map(VEHICLES.map((v) => [v.slug, v]));
export const vehicleBySlug = (slug: string | null | undefined) => (slug ? bySlug.get(slug) : undefined);
export const vehicleLabel = (slug: string) => bySlug.get(slug)?.label ?? slug;
export const vehicleShort = (slug: string) => bySlug.get(slug)?.short ?? slug;
