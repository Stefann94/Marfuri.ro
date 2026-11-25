import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Publică gratuit", robots: { index: false, follow: false } };

export default function PublishPage() {
  return <ComingSoon title="Publicarea vine în pasul următor" text="Formularul în 3 pași pentru marfă și camioane (și lipirea din WhatsApp) este următorul lucru pe care îl construim." />;
}
