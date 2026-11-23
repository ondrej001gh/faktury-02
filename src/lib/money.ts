export function parseDecimal(input: string): number | null {
  let value = input.trim().replace(/[\s\u00a0]/g, "");
  if (!value) return null;
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");
  if (hasComma && hasDot) {
    if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (hasComma) {
    value = value.replace(",", ".");
  }
  if (!/^-?\d+(\.\d+)?$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatPlain(value: number, fractionDigits = 2): string {
  return value.toFixed(fractionDigits).replace(".", ",");
}

function groupThousands(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatAmount(value: number): string {
  const negative = value < 0;
  const cents = Math.round(Math.abs(value) * 100);
  const whole = groupThousands(String(Math.floor(cents / 100)));
  const frac = String(cents % 100).padStart(2, "0");
  return `${negative ? "−" : ""}${whole},${frac}`;
}

export function formatMoney(value: number): string {
  return `${formatAmount(value)}\u00a0Kč`;
}

export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  const [whole, frac = ""] = rounded.toFixed(3).split(".");
  const trimmed = frac.replace(/0+$/, "");
  const grouped = groupThousands(whole);
  return trimmed ? `${grouped},${trimmed}` : grouped;
}

export function formatPercent(rate: number): string {
  return `${rate}\u00a0%`;
}
