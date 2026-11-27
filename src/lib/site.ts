export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Mărfuri.ro",
  // Adresa publică: setată explicit, altfel cea de producție de pe Vercel, altfel cea locală.
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
  tagline: "Bursă de transport marfă",
  description:
    "Bursă de transport marfă pentru România și Europa: oferte de marfă și camioane libere de la firme verificate. Publici gratuit, găsești curse rapid.",
};

export const absUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
