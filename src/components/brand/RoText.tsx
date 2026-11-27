/**
 * Fontul Russo One nu are literele Ț/ț (browserul le ia dintr-un font subțire, de rezervă).
 * Le compunem din T-ul fontului + virgula fontului, așezată sub literă la fel ca la Ș.
 * Cititoarele de ecran și motoarele de căutare primesc textul real.
 */
export function RoText({ children }: { children: string }) {
  if (!/[țȚ]/.test(children)) return children;
  const parts = children.split(/([țȚ])/);
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden>
        {parts.map((p, i) =>
          i % 2 ? (
            <span key={i} className="ro-virgula">
              {p === "ț" ? "t" : "T"}
            </span>
          ) : (
            p
          ),
        )}
      </span>
    </>
  );
}
