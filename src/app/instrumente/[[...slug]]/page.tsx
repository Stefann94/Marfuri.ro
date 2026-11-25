import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Instrumente pentru transport", robots: { index: false, follow: true } };

export default function ToolsPage() {
  return (
    <ComingSoon
      title="Instrumente gratuite pentru transport"
      text="Construim uneltele care te ajută să calculezi și să negociezi o cursă."
      items={["Calculator de cursă", "Prețuri medii pe rute", "Restricții de circulație", "Motorină și curs BNR", "Formulare", "Calculator LDM și paleți"]}
    />
  );
}
