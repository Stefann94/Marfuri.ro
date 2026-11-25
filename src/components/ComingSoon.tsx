import Link from "next/link";

/** Pagină temporară pentru secțiunile care se construiesc în pașii următori. */
export function ComingSoon({ title, text, items }: { title: string; text: string; items?: string[] }) {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="eyebrow">În curând</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-lg text-muted">{text}</p>
      {items && (
        <ul className="mt-6 grid max-w-xl gap-2 text-left sm:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">{i}</li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/marfa" className="btn btn-primary">Caută marfă</Link>
        <Link href="/camioane" className="btn btn-outline">Caută camion</Link>
      </div>
    </div>
  );
}
