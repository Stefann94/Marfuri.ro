/**
 * Logo-ul Mărfuri.ro: TIR-ul roșu cu „MĂRFURI.RO” cromat pe prelată (varianta D, paleta roșu & grafit).
 * SVG pur, fără JavaScript. `idPrefix` trebuie să fie unic pe pagină (gradienții au id-uri).
 */
export function TruckLogo({ idPrefix = "mf", className, title = "Mărfuri.ro" }: { idPrefix?: string; className?: string; title?: string }) {
  const shade = `${idPrefix}-shade`;
  const chrome = `${idPrefix}-chrome`;
  const skid = `${idPrefix}-skid`;
  const logoFont = { fontFamily: "var(--font-russo), 'Russo One', sans-serif" };
  return (
    <svg viewBox="0 6 760 176" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="0.25" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={chrome} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#C9CDD2" />
          <stop offset="0.5" stopColor="#5A6068" />
          <stop offset="0.75" stopColor="#E6E9EC" />
          <stop offset="1" stopColor="#9AA0A8" />
        </linearGradient>
        <linearGradient id={skid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14161A" stopOpacity="0" />
          <stop offset="1" stopColor="#14161A" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* urme de frână */}
      <path d="M0 164h200v6H0zM536 164h175v6H536z" fill={`url(#${skid})`} />
      {/* semiremorca */}
      <rect x="20" y="18" width="548" height="124" rx="6" fill="#C8201A" />
      <rect x="20" y="18" width="548" height="124" rx="6" fill={`url(#${shade})`} />
      <rect x="20" y="18" width="548" height="124" rx="6" fill="none" stroke="#E5605A" strokeWidth="1.5" />
      <rect x="20" y="118" width="548" height="5" fill="#14161A" />
      <rect x="20" y="127" width="548" height="2" fill="#14161A" />
      <text x="104" y="98" style={logoFont} fontSize="66" textLength="330" lengthAdjust="spacingAndGlyphs" fill={`url(#${chrome})`} stroke="#08090B" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round">
        MĂRFURI
      </text>
      <text x="446" y="98" style={logoFont} fontSize="32" textLength="74" lengthAdjust="spacingAndGlyphs" fill="#FFFFFF">
        .RO
      </text>
      <rect x="20" y="142" width="566" height="8" fill="#14161A" />
      <rect x="470" y="150" width="6" height="16" fill="#3A3E45" />
      {/* cap-tractor */}
      <path d="M586 26h20l10-12h54l10 12h6q20 0 24 20l6 58v40H586z" fill="#C8201A" />
      <path d="M586 26h20l10-12h54l10 12h6q20 0 24 20l6 58v40H586z" fill={`url(#${shade})`} stroke="#E5605A" strokeWidth="1.5" />
      <path d="M660 40h30q10 0 13 12l5 26h-48z" fill="#3A4656" />
      {[628, 638, 648, 658, 668].map((cx) => (
        <circle key={cx} cx={cx} cy="19" r="2" fill="#FFB020" />
      ))}
      <rect x="714" y="82" width="10" height="34" rx="2" fill={`url(#${chrome})`} />
      <rect x="586" y="112" width="138" height="3" fill="#14161A" />
      <rect x="712" y="118" width="12" height="8" rx="2" fill="#FFF4E0" />
      <rect x="698" y="132" width="30" height="12" rx="3" fill={`url(#${chrome})`} />
      {/* roți */}
      {[100, 142, 184, 608, 696].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="152" r="18" fill="#14161A" />
          <circle cx={cx} cy="152" r="9" fill={`url(#${chrome})`} />
        </g>
      ))}
    </svg>
  );
}
