/**
 * Country → region mapping used to route a freshly-signed-up user
 * into the right jurisdiction bucket. Server-side only as a hint;
 * the source of truth is the `jurisdictions` table.
 */

export const COUNTRY_TO_REGION: Record<string, string> = {
  // North America
  US: "north_america",
  CA: "north_america",
  // UK
  GB: "uk",
  // Oceania
  AU: "oceania",
  NZ: "oceania",
  // Western Europe
  DE: "western_europe",
  FR: "western_europe",
  IE: "western_europe",
  NL: "western_europe",
  BE: "western_europe",
  ES: "western_europe",
  IT: "western_europe",
  PT: "western_europe",
  AT: "western_europe",
  CH: "western_europe",
  // Nordics
  SE: "nordics",
  NO: "nordics",
  DK: "nordics",
  FI: "nordics",
  IS: "nordics",
  // Eastern Europe
  PL: "eastern_europe",
  CZ: "eastern_europe",
  RO: "eastern_europe",
  HU: "eastern_europe",
  // East Asia
  JP: "east_asia",
  KR: "east_asia",
  // SEA
  SG: "sea",
  PH: "sea",
  MY: "sea",
  ID: "sea",
  TH: "sea",
  VN: "sea",
  // South Asia
  IN: "south_asia",
  // LATAM
  BR: "latam",
  MX: "latam",
  AR: "latam",
  CL: "latam",
  CO: "latam",
  PE: "latam",
  // MENA
  AE: "mena",
  SA: "mena",
  KW: "mena",
  IR: "mena",
  QA: "mena",
  BH: "mena",
  EG: "mena",
};

export function regionForCountry(countryCode: string): string {
  return COUNTRY_TO_REGION[countryCode.toUpperCase()] ?? "unknown";
}

export const SUPPORTED_COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IE", name: "Ireland" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "PH", name: "Philippines" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "KW", name: "Kuwait" },
  { code: "IR", name: "Iran" },
];
