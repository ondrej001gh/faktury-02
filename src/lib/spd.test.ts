import { describe, expect, it } from "vitest";
import { buildSpd, toSpdText } from "./spd";

describe("QR platba SPD", () => {
  it("složí řetězec pro bankovní aplikaci", () => {
    const spd = buildSpd({
      iban: "CZ65 0800 0000 1920 0014 5399",
      amount: 242,
      dueDate: "2026-12-06",
      message: "Faktura 2026001",
      variableSymbol: "2026001",
      constantSymbol: "0308",
      recipientName: "Truhlářství Novák",
    });
    expect(spd).toBe(
      "SPD*1.0*ACC:CZ6508000000192000145399*AM:242.00*CC:CZK*DT:20261206*MSG:FAKTURA 2026001*X-VS:2026001*X-KS:0308*RN:TRUHLARSTVI NOVAK*",
    );
  });

  it("připojí BIC a zkrátí variabilní symbol na 10 číslic", () => {
    const spd = buildSpd({
      iban: "CZ6508000000192000145399",
      bic: "gibaczpx",
      amount: 10.1,
      variableSymbol: "1234567890123",
      message: "Ahoj",
    });
    expect(spd).toContain("ACC:CZ6508000000192000145399+GIBACZPX*");
    expect(spd).toContain("AM:10.10*");
    expect(spd).toContain("X-VS:4567890123*");
  });

  it("nevrátí kód bez platného IBAN nebo s nulovou částkou", () => {
    expect(buildSpd({ iban: "CZ00", amount: 10 })).toBeNull();
    expect(buildSpd({ iban: "CZ6508000000192000145399", amount: 0 })).toBeNull();
  });

  it("odstraní diakritiku", () => {
    expect(toSpdText("Žluťoučký kůň", 60)).toBe("ZLUTOUCKY KUN");
  });
});
