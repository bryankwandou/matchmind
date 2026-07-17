// Country flag URLs from FIFA-style 3-letter codes, served by flagcdn as
// tiny PNGs. Emoji flags were the first cut, but Windows renders them as
// bare letter pairs (Segoe UI Emoji ships no flag glyphs), so images are
// the only rendering that looks right on every judge's machine.

const FIFA_TO_ISO: Record<string, string> = {
  ARG: "ar", AUS: "au", AUT: "at", BEL: "be", BRA: "br", CAN: "ca",
  CHI: "cl", CMR: "cm", COL: "co", CRC: "cr", CRO: "hr", DEN: "dk",
  ECU: "ec", EGY: "eg", ESP: "es", FRA: "fr", GER: "de", GHA: "gh",
  GRE: "gr", HON: "hn", IRN: "ir", ITA: "it", JAM: "jm", JPN: "jp",
  KOR: "kr", KSA: "sa", MAR: "ma", MEX: "mx", MYA: "mm", NED: "nl",
  NGA: "ng", NOR: "no", NZL: "nz", PAN: "pa", PAR: "py", PER: "pe",
  POL: "pl", POR: "pt", QAT: "qa", RSA: "za", SEN: "sn", SRB: "rs",
  SUI: "ch", SWE: "se", TUN: "tn", TUR: "tr", UKR: "ua", URU: "uy",
  USA: "us", VIE: "vn", ALG: "dz", CIV: "ci", DZA: "dz", IDN: "id",
  // UK home nations have their own ISO 3166-2 flags on flagcdn
  ENG: "gb-eng", SCO: "gb-sct", WAL: "gb-wls",
};

// Returns a flag image URL for the given FIFA code, or null when we have no
// mapping — callers should render nothing in that case, never a broken img.
export function flagUrl(code3: string | undefined | null, width: 40 | 80 = 40): string | null {
  if (!code3) return null;
  const iso = FIFA_TO_ISO[code3.toUpperCase()]
    ?? (code3.length === 2 ? code3.toLowerCase() : null);
  return iso ? `https://flagcdn.com/w${width}/${iso}.png` : null;
}
