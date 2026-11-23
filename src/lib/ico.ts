export function normalizeIco(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Kontrolní součet IČO podle algoritmu používaného v českých rejstřících. */
export function isValidIco(value: string): boolean {
  const ico = normalizeIco(value);
  if (!/^\d{8}$/.test(ico)) return false;
  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let index = 0; index < weights.length; index += 1) {
    sum += Number(ico[index]) * weights[index];
  }
  const mod = sum % 11;
  const check = mod === 0 ? 1 : mod === 1 ? 0 : 11 - mod;
  return check === Number(ico[7]);
}

export function formatZip(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return input.trim();
}

export function normalizeDic(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

export function dicLooksCzech(value: string): boolean {
  const dic = normalizeDic(value);
  if (!dic) return true;
  return /^CZ\d{8,10}$/.test(dic);
}
