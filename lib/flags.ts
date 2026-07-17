// Country flags for match cards, served by flagcdn as sub-kilobyte PNGs.
//
// We resolve by country NAME, not the feed's 3-letter code: TxLINE's codes
// are idiosyncratic (Spain arrives as "SPA" not FIFA "ESP", New Zealand as
// "NEW" not "NZL"), so a code table silently misses teams. Names are
// canonical. A small code table stays as a fallback for anything unnamed.
//
// Emoji flags were the first cut, but Windows ships no flag glyphs in Segoe
// UI Emoji, so images are the only rendering that holds on every machine.

// Country name (lowercased) -> ISO 3166-1 alpha-2 (flagcdn slug). Covers all
// FIFA members plus common name variants and the UK home-nation flags.
const NAME_TO_ISO: Record<string, string> = {
  afghanistan: "af", albania: "al", algeria: "dz", andorra: "ad", angola: "ao",
  "antigua and barbuda": "ag", argentina: "ar", armenia: "am", aruba: "aw",
  australia: "au", austria: "at", azerbaijan: "az", bahamas: "bs", bahrain: "bh",
  bangladesh: "bd", barbados: "bb", belarus: "by", belgium: "be", belize: "bz",
  benin: "bj", bermuda: "bm", bhutan: "bt", bolivia: "bo",
  "bosnia and herzegovina": "ba", bosnia: "ba", botswana: "bw", brazil: "br",
  brunei: "bn", bulgaria: "bg", "burkina faso": "bf", burundi: "bi",
  cambodia: "kh", cameroon: "cm", canada: "ca", "cape verde": "cv",
  "central african republic": "cf", chad: "td", chile: "cl", china: "cn",
  "china pr": "cn", colombia: "co", comoros: "km", congo: "cg",
  "dr congo": "cd", "congo dr": "cd", "costa rica": "cr", croatia: "hr",
  cuba: "cu", curacao: "cw", cyprus: "cy", czechia: "cz", "czech republic": "cz",
  denmark: "dk", djibouti: "dj", dominica: "dm", "dominican republic": "do",
  ecuador: "ec", egypt: "eg", "el salvador": "sv", england: "gb-eng",
  "equatorial guinea": "gq", eritrea: "er", estonia: "ee", eswatini: "sz",
  ethiopia: "et", "faroe islands": "fo", fiji: "fj", finland: "fi", france: "fr",
  gabon: "ga", gambia: "gm", georgia: "ge", germany: "de", ghana: "gh",
  gibraltar: "gi", greece: "gr", grenada: "gd", guatemala: "gt", guinea: "gn",
  "guinea-bissau": "gw", guyana: "gy", haiti: "ht", honduras: "hn",
  "hong kong": "hk", hungary: "hu", iceland: "is", india: "in", indonesia: "id",
  iran: "ir", iraq: "iq", ireland: "ie", "republic of ireland": "ie",
  israel: "il", italy: "it", "ivory coast": "ci", "cote d'ivoire": "ci",
  jamaica: "jm", japan: "jp", jordan: "jo", kazakhstan: "kz", kenya: "ke",
  kosovo: "xk", kuwait: "kw", kyrgyzstan: "kg", laos: "la", latvia: "lv",
  lebanon: "lb", lesotho: "ls", liberia: "lr", libya: "ly", liechtenstein: "li",
  lithuania: "lt", luxembourg: "lu", macau: "mo", madagascar: "mg",
  malawi: "mw", malaysia: "my", maldives: "mv", mali: "ml", malta: "mt",
  mauritania: "mr", mauritius: "mu", mexico: "mx", moldova: "md", monaco: "mc",
  mongolia: "mn", montenegro: "me", morocco: "ma", mozambique: "mz",
  myanmar: "mm", namibia: "na", nepal: "np", netherlands: "nl",
  "new zealand": "nz", nicaragua: "ni", niger: "ne", nigeria: "ng",
  "north korea": "kp", "korea dpr": "kp", "north macedonia": "mk",
  "northern ireland": "gb-nir", norway: "no", oman: "om", pakistan: "pk",
  palestine: "ps", panama: "pa", "papua new guinea": "pg", paraguay: "py",
  peru: "pe", philippines: "ph", poland: "pl", portugal: "pt", "puerto rico": "pr",
  qatar: "qa", romania: "ro", russia: "ru", rwanda: "rw", "saudi arabia": "sa",
  scotland: "gb-sct", senegal: "sn", serbia: "rs", "sierra leone": "sl",
  singapore: "sg", slovakia: "sk", slovenia: "si", somalia: "so",
  "south africa": "za", "south korea": "kr", "korea republic": "kr",
  "south sudan": "ss", spain: "es", "sri lanka": "lk", sudan: "sd",
  suriname: "sr", sweden: "se", switzerland: "ch", syria: "sy", taiwan: "tw",
  tajikistan: "tj", tanzania: "tz", thailand: "th", togo: "tg",
  "trinidad and tobago": "tt", tunisia: "tn", turkey: "tr", turkmenistan: "tm",
  uganda: "ug", ukraine: "ua", "united arab emirates": "ae", uae: "ae",
  "united states": "us", usa: "us", uruguay: "uy", uzbekistan: "uz",
  venezuela: "ve", vietnam: "vn", wales: "gb-wls", yemen: "ye", zambia: "zm",
  zimbabwe: "zw",
};

// Feed 3-letter code -> ISO2, only where the code is non-standard or a useful
// fallback when a name isn't recognised.
const CODE_TO_ISO: Record<string, string> = {
  SPA: "es", NEW: "nz", ENG: "gb-eng", SCO: "gb-sct", WAL: "gb-wls",
  MYA: "mm", GIB: "gi", LIE: "li", IND: "in", VIE: "vn", KSA: "sa",
  RSA: "za", GER: "de", NED: "nl", POR: "pt", CRO: "hr", DEN: "dk",
  SUI: "ch", URU: "uy", PAR: "py", CHI: "cl", POL: "pl", GRE: "gr",
};

function iso(name?: string | null, code?: string | null): string | null {
  if (name) {
    const key = name.trim().toLowerCase();
    if (NAME_TO_ISO[key]) return NAME_TO_ISO[key];
  }
  if (code) {
    const up = code.toUpperCase();
    if (CODE_TO_ISO[up]) return CODE_TO_ISO[up];
    // last resort: a 2-letter code may already be an ISO slug
    if (code.length === 2) return code.toLowerCase();
  }
  return null;
}

// Flag image URL for a team, resolved by name first then code. Returns null
// when we can't identify the country — callers render nothing, never a
// broken image.
export function flagUrl(
  name?: string | null,
  code?: string | null,
  width: 40 | 80 = 80,
): string | null {
  const slug = iso(name, code);
  return slug ? `https://flagcdn.com/w${width}/${slug}.png` : null;
}
