import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Ghiduri pentru transportatori și expeditori", robots: { index: false, follow: true } };

export default function GuidesPage() {
  return (
    <ComingSoon
      title="Ghiduri practice"
      text="Răspunsuri clare la întrebările din transport."
      items={["Licența de transport ARR", "Scrisoarea de trăsură CMR", "Tahograful", "Transport ADR", "Taxe de drum pe țări", "Cum eviți fraudele"]}
    />
  );
}
