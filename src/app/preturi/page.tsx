import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Prețuri", robots: { index: false, follow: true } };

export default function PricingPage() {
  return <ComingSoon title="Prețuri clare, în lei" text="Publicarea e gratuită. Abonamentele, cu utilizatori nelimitați pe firmă, apar aici în curând." />;
}
