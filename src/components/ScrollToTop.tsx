"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * La trecerea pe altă pagină, urcă mereu în capul site-ului (inclusiv banda de sus).
 * Next.js derulează doar până la începutul conținutului paginii, sub antetul lipit, așa că
 * uneori pagina nouă se deschidea puțin mai jos. Excepții: Înapoi / Înainte în browser
 * (acolo browserul revine unde erai) și legăturile spre o secțiune (#ancoră).
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  const back = useRef(false);

  useEffect(() => {
    const onPop = () => {
      back.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (back.current) {
      back.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
