import { describe, expect, it } from "vitest";
import {
  bankNameFromAccount,
  czechAccountToIban,
  formatCzechAccount,
  formatIban,
  ibanMatchesCzechAccount,
  isValidIban,
} from "./iban";

describe("český IBAN", () => {
  it("spočítá známý účet České spořitelny", () => {
    expect(czechAccountToIban("19-2000145399/0800")).toBe("CZ6508000000192000145399");
    expect(isValidIban("CZ65 0800 0000 1920 0014 5399")).toBe(true);
    expect(isValidIban("CZ6508000000192000145390")).toBe(false);
  });

  it("formátuje číslo účtu a IBAN", () => {
    expect(formatCzechAccount("000019-2000145399/0800")).toBe("19-2000145399/0800");
    expect(formatCzechAccount("123456789/0100")).toBe("123456789/0100");
    expect(formatIban("cz6508000000192000145399")).toBe("CZ65 0800 0000 1920 0014 5399");
  });

  it("porovná účet s IBAN a pozná banku", () => {
    const iban = czechAccountToIban("123456789/2010");
    expect(iban).toBeTruthy();
    expect(isValidIban(iban ?? "")).toBe(true);
    expect(ibanMatchesCzechAccount("123456789/2010", iban ?? "")).toBe(true);
    expect(ibanMatchesCzechAccount("123456789/2010", "CZ6508000000192000145399")).toBe(false);
    expect(bankNameFromAccount("123456789/2010")).toBe("Fio banka");
  });
});
