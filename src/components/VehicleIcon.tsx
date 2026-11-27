import type { SVGProps } from "react";

/* Iconițe pentru tipurile de camion, văzute din lateral (cabina la dreapta), în stilul liniar al site-ului. */

const CAB = (
  <>
    <path d="M22 7h4.2l3.3 4.3V14.5H22z" />
    <path d="M23.6 8.6h2l1.8 2.4h-3.8z" />
  </>
);
const W = (...xs: number[]) => xs.map((x) => <circle key={x} cx={x} cy={16.4} r={1.7} />);

const SHAPES: Record<string, React.ReactNode> = {
  // prelată: acoperiș de prelată ușor curbat, chingi verticale
  prelata: (
    <>
      <path d="M2 5.6Q11.5 3.4 21 5.6v8.9H2z" />
      <path d="M8.3 4.6v9.9M14.7 4.6v9.9" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // mega: remorcă înaltă, cu săgeata înălțimii
  mega: (
    <>
      <path d="M2 2.5h19v12H2z" />
      <path d="M6 5v7M4.5 6.5 6 5l1.5 1.5M4.5 10.5 6 12l1.5-1.5" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // frigorific: dubă închisă cu fulg de nea și agregatul de răcire în față
  frigorific: (
    <>
      <path d="M2 4.5h18v10H2z" />
      <path d="M20 5.5h1.5v4H20" />
      <path d="M11 6.5v6M8.4 8l5.2 3M8.4 11l5.2-3" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // izoterm: dubă închisă cu termometru
  izoterm: (
    <>
      <path d="M2 4.5h19v10H2z" />
      <path d="M11.5 6.3v3.6" />
      <circle cx="11.5" cy="11.2" r="1.4" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // box: camion rigid cu furgon închis
  box: (
    <>
      <path d="M5 4.5h16v10H5z" />
      <path d="M7.5 7h4" />
      {CAB}
      {W(9, 26)}
    </>
  ),
  // jumbo / tandem: camion cu remorcă
  jumbo: (
    <>
      <path d="M1.5 5h8.5v9.5H1.5zM11.5 5H21v9.5h-9.5zM10 12.5h1.5" />
      {CAB}
      {W(4, 7.5, 16, 26)}
    </>
  ),
  // platformă: punte plată cu marfă legată
  platforma: (
    <>
      <path d="M2 12h20v2.5H2z" />
      <path d="M6 12V8h7v4M3 12V9.5M21 12V9.5" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // agabaritic: trailer jos, în trepte, cu un utilaj mare
  "trailer-jos": (
    <>
      <path d="M2 11.5h3v3h14v-3h3" />
      <path d="M7 14.5V9h4l1.5-3.5H16V14.5" />
      {CAB}
      {W(3.5, 26)}
      <circle cx="20" cy="16.4" r="1.7" />
    </>
  ),
  // basculantă: bena trapezoidală
  basculanta: (
    <>
      <path d="M2.5 5h18l-2 9.5H4z" />
      <path d="M2 14.5h20" />
      {CAB}
      {W(6, 10, 26)}
    </>
  ),
  // cisternă: rezervor rotunjit
  cisterna: (
    <>
      <path d="M6.5 4.5h10a4.5 4.5 0 0 1 0 9h-10a4.5 4.5 0 0 1 0-9z" />
      <path d="M2 14.5h20M10.5 3v1.5M12.5 3v1.5" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // portcontainer: container cu nervuri, pe șasiu
  container: (
    <>
      <path d="M2 4h19v9H2z" />
      <path d="M5.2 4v9M8.4 4v9M11.6 4v9M14.8 4v9M18 4v9M2 14.5h20" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // transportor auto: două punți cu mașini
  "auto-transportor": (
    <>
      <path d="M2 8.5h19.5M2 14.5h20M2 8.5v6M21.5 4v4.5" />
      <path d="M4 8.5V7.3C4 6.4 4.8 5.5 6 5.5h2.6c.9 0 1.5.4 2 1.2l.9 1.8M13 8.5V7.3c0-.9.8-1.8 2-1.8h2.6c.9 0 1.5.4 2 1.2l.9 1.8" />
      <path d="M4 14.5v-1.2c0-.9.8-1.8 2-1.8h2.6c.9 0 1.5.4 2 1.2l.9 1.8M13 14.5v-1.2c0-.9.8-1.8 2-1.8h2.6c.9 0 1.5.4 2 1.2l.9 1.8" />
      {CAB}
      {W(5.5, 9.5, 26)}
    </>
  ),
  // dubă: autoutilitară sub 3,5 t
  duba: (
    <>
      <path d="M6 5h14.5l4.5 4.8v4.7H6z" />
      <path d="M20.5 5v4.8H25M15 5v9.5" />
      {W(10, 21.5)}
    </>
  ),
};

/** Camion generic (pentru „Oricare” sau tipuri necunoscute). */
const GENERIC = (
  <>
    <path d="M2 4.5h19v10H2z" />
    {CAB}
    {W(5.5, 9.5, 26)}
  </>
);

export function VehicleIcon({ slug, width = 32, height = 20, ...p }: { slug: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 20" width={width} height={height} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {SHAPES[slug] ?? GENERIC}
    </svg>
  );
}
