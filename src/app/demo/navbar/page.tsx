import type { Metadata } from "next";
import { SiteHeader, type NavUser } from "@/components/nav/SiteHeader";

// Pagină de previzualizare (doar pentru noi): arată meniul în starea „cu cont”, până avem conturi reale.
export const metadata: Metadata = { title: "Previzualizare meniu", robots: { index: false, follow: false } };

const demoUser: NavUser = {
  company: "Firma mea SRL",
  initials: "FM",
  verified: true,
  unreadMessages: 3,
  notifications: [
    { id: "1", kind: "load", title: "Marfă nouă pe ruta ta", text: "Cluj-Napoca → München · mâine · prelată", when: "acum 2 min", unread: true },
    { id: "2", kind: "offer", title: "Ai primit o ofertă", text: "La cursa Arad → Stuttgart", when: "acum 15 min", unread: true },
    { id: "3", kind: "doc", title: "Asigurarea CMR expiră în 14 zile", text: "Încarcă polița nouă ca să rămâi verificat", when: "azi", unread: false },
    { id: "4", kind: "rating", title: "Ai primit o evaluare nouă", text: "Pentru cursa Timișoara → Köln", when: "ieri", unread: false },
  ],
};

export default function NavbarDemoPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold">Previzualizare: meniul cu cont</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Sus, pe tot site-ul, e meniul fără cont. Mai jos e același meniu pentru o firmă logată: apasă pe „Publică”, pe clopoțel și pe cercul cu inițiale.
      </p>
      <div className="mt-6 overflow-visible rounded-2xl border border-line bg-soft pb-[420px] shadow-sm">
        <SiteHeader user={demoUser} sticky={false} />
      </div>
    </div>
  );
}
