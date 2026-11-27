import type { Metadata } from "next";
import Link from "next/link";

// Temporar: conturile, autentificarea și publicarea vin în pasul următor.
export const metadata: Metadata = { title: "Contul meu", robots: { index: false, follow: false } };

export default function AccountPlaceholder() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">În curând</p>
      <h1 className="mt-2 text-3xl font-bold">Conturile se deschid în curând</h1>
      <p className="mt-3 max-w-md text-slate-600">Lucrăm la înregistrare cu verificare ANAF și la publicarea ofertelor.</p>
      <Link href="/" className="btn btn-primary mt-8">Înapoi la pagina principală</Link>
    </div>
  );
}
