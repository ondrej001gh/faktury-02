import { describe, expect, it } from "vitest";
import { mapAresSubject } from "./ares";

describe("ARES", () => {
  it("složí adresu s orientačním číslem", () => {
    const company = mapAresSubject({
      ico: "27082440",
      obchodniJmeno: "Alza.cz a.s.",
      dic: "CZ27082440",
      sidlo: {
        nazevUlice: "Jankovcova",
        cisloDomovni: 1522,
        cisloOrientacni: 53,
        nazevObce: "Praha",
        psc: 17000,
        nazevStatu: "Česká republika",
      },
    });
    expect(company).toMatchObject({
      name: "Alza.cz a.s.",
      street: "Jankovcova 1522/53",
      city: "Praha",
      zip: "170 00",
      dic: "CZ27082440",
    });
  });

  it("u vesnice použije část obce a číslo popisné", () => {
    const company = mapAresSubject({
      obchodniJmeno: "Jan Novák",
      sidlo: { nazevObce: "Lhota", nazevCastiObce: "Lhota", cisloDomovni: 12, psc: "12345" },
    });
    expect(company.street).toBe("Lhota 12");
    expect(company.city).toBe("Lhota");
    expect(company.zip).toBe("123 45");
  });
});
