import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PageHead } from "@/components/cereri/ui";
import { CereriShell, NeedAccountCard, formData } from "@/components/cereri/pages";
import { PublishLoadForm } from "@/components/cereri/PublishForms";

export const metadata: Metadata = {
  title: "Caută camion pentru marfa ta",
  description: "Completezi cererea o singură dată, iar transportatorii cu camion liber o văd și o pot accepta. Gratuit, doar firme cu CUI.",
  alternates: { canonical: "/cauta-camion" },
};

export default async function CautaCamionPage() {
  const user = await getCurrentUser();
  return (
    <CereriShell>
      <PageHead
        crumb="Caută camion"
        title="Caută camion pentru marfa ta"
        sub="Completezi cererea o singură dată. Transportatorii o văd la „Am camion liber” și o pot accepta; tu primești datele firmei care a acceptat."
      />
      {user ? (
        <PublishLoadForm who={{ company: user.company.name, verified: user.company.verified, name: user.name, phone: user.phone }} {...(await formData())} />
      ) : (
        <NeedAccountCard next="/cauta-camion" what="publici cererea" />
      )}
    </CereriShell>
  );
}
