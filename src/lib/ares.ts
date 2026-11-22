import { formatZip } from "./ico";

export interface AresCompany {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  ico: string;
  dic: string;
}

interface AresSidlo {
  nazevUlice?: string;
  nazevCastiObce?: string;
  nazevObce?: string;
  cisloDomovni?: number | string;
  cisloOrientacni?: number | string;
  cisloOrientacniPismeno?: string;
  psc?: number | string;
  nazevStatu?: string;
}

export interface AresSubject {
  ico?: string;
  obchodniJmeno?: string;
  dic?: string;
  sidlo?: AresSidlo;
}

export class AresError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AresError";
  }
}

export function formatStreetFromSidlo(sidlo: AresSidlo | undefined): string {
  if (!sidlo) return "";
  const streetName = sidlo.nazevUlice?.trim() || "";
  const house = sidlo.cisloDomovni != null && String(sidlo.cisloDomovni) !== "" ? String(sidlo.cisloDomovni) : "";
  const orient = sidlo.cisloOrientacni != null && String(sidlo.cisloOrientacni) !== "" ? String(sidlo.cisloOrientacni) : "";
  const letter = sidlo.cisloOrientacniPismeno?.trim() || "";
  let number = "";
  if (house && orient) number = `${house}/${orient}${letter}`;
  else if (house) number = `${house}${letter}`;
  else if (orient) number = `${orient}${letter}`;
  if (streetName) return [streetName, number].filter(Boolean).join(" ");
  const place = sidlo.nazevCastiObce?.trim() || sidlo.nazevObce?.trim() || "";
  return [place, number].filter(Boolean).join(" ");
}

export function mapAresSubject(data: AresSubject, fallbackIco = ""): AresCompany {
  const sidlo = data.sidlo;
  const name = data.obchodniJmeno?.trim() || "";
  if (!name) throw new AresError("ARES nevrátil název subjektu.");
  const zipRaw = sidlo?.psc != null ? String(sidlo.psc) : "";
  return {
    name,
    street: formatStreetFromSidlo(sidlo),
    city: sidlo?.nazevObce?.trim() || "",
    zip: formatZip(zipRaw),
    country: sidlo?.nazevStatu?.trim() || "Česká republika",
    ico: data.ico?.trim() || fallbackIco,
    dic: data.dic?.trim() || "",
  };
}

export async function fetchCompanyByIco(ico: string): Promise<AresCompany> {
  const clean = ico.replace(/\D/g, "");
  if (!/^\d{8}$/.test(clean)) throw new AresError("IČO musí mít 8 číslic.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(
      `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${clean}`,
      { headers: { Accept: "application/json" }, signal: controller.signal },
    );
    if (response.status === 404) throw new AresError("Subjekt s tímto IČO v ARES není.");
    if (!response.ok) throw new AresError("ARES se nepodařilo načíst. Údaje vyplňte ručně.");
    const data = (await response.json()) as AresSubject;
    return mapAresSubject(data, clean);
  } catch (error) {
    if (error instanceof AresError) throw error;
    throw new AresError("ARES se nepodařilo načíst. Údaje vyplňte ručně.");
  } finally {
    clearTimeout(timer);
  }
}
