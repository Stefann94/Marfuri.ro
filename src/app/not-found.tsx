import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Eroare 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Pagina nu există sau oferta a fost ștearsă</h1>
      <p className="mt-3 max-w-md text-slate-600">Ofertele de transport expiră repede. Caută printre cele active acum.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/marfa" className="btn btn-primary">Marfă disponibilă</Link>
        <Link href="/camioane" className="btn btn-outline">Camioane libere</Link>
      </div>
    </div>
  );
}
