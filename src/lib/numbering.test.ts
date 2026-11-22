import { describe, expect, it } from "vitest";
import type { Settings } from "../types";
import { advanceSequence, formatInvoiceNumber, peekNextNumber, variableSymbolFromNumber } from "./numbering";

function settings(partial: Partial<Settings> = {}): Settings {
  return {
    numberPattern: "{RRRR}{NNN}",
    nextSequence: 1,
    sequenceYear: 2026,
    resetSequenceEachYear: true,
    defaultDueDays: 14,
    defaultPaymentMethod: "prevod",
    defaultVatRate: 21,
    defaultNote: "",
    ...partial,
  };
}

describe("číslování", () => {
  it("složí číslo podle vzoru", () => {
    expect(formatInvoiceNumber("{RRRR}{NNN}", "2026-11-22", 1)).toBe("2026001");
    expect(formatInvoiceNumber("{RRRR}-{NNN}", "2026-11-22", 12)).toBe("2026-012");
    expect(formatInvoiceNumber("FV{RR}{NNNN}", "2026-03-01", 1)).toBe("FV260001");
    expect(formatInvoiceNumber("{RRRR}{MM}{NN}", "2026-11-22", 4)).toBe("20261104");
  });

  it("po změně roku začne řadu znovu", () => {
    const current = settings({ nextSequence: 8, sequenceYear: 2025, resetSequenceEachYear: true });
    expect(peekNextNumber(current, "2026-01-02")).toBe("2026001");
    const next = advanceSequence(current, "2026-01-02", "2026001");
    expect(next.nextSequence).toBe(2);
    expect(next.sequenceYear).toBe(2026);
  });

  it("bez ročního resetu pokračuje v řadě", () => {
    const current = settings({ nextSequence: 8, sequenceYear: 2025, resetSequenceEachYear: false });
    expect(peekNextNumber(current, "2026-01-02")).toBe("2026008");
    expect(advanceSequence(current, "2026-01-02", "vlastni").nextSequence).toBe(8);
  });

  it("z čísla faktury udělá variabilní symbol", () => {
    expect(variableSymbolFromNumber("FV2026-001")).toBe("2026001");
    expect(variableSymbolFromNumber("123456789012345")).toBe("6789012345");
  });
});
