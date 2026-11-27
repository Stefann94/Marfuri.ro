import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PageHead } from "@/components/cereri/ui";
import { CereriShell, formData } from "@/components/cereri/pages";
import { PublishTruckForm } from "@/components/cereri/PublishForms";

export const metadata: Metadata = {
  title: "Caută marfă pentru camionul tău",
  description: "Anunți camionul liber o singură dată, iar firmele cu marfă te văd și te pot accepta. Gratuit, doar firme cu CUI.",
  alternates: { canonical: "/cauta-marfa" },
};

export default async function CautaMarfaPage() {
  const user = await getCurrentUser();
  return (
    <CereriShell>
      <PageHead
        crumb="Caută marfă"
        title="Caută marfă pentru camionul tău"
        sub="Spui unde e camionul și când e liber. Firmele cu marfă te văd la „Am marfă de transportat” și te pot accepta; tu primești datele lor și detaliile mărfii."
      />
      <PublishTruckForm
        who={user ? { company: user.company.name, verified: user.company.verified, name: user.name, phone: user.phone } : { company: "Vizitator (fără cont)", verified: false, name: "", phone: "" }}
        {...(await formData())}
      />
    </CereriShell>
  );
}
