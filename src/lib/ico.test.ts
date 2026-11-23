import { describe, expect, it } from "vitest";
import { dicLooksCzech, formatZip, isValidIco } from "./ico";

describe("IČO", () => {
  it("uzná platné IČO", () => {
    expect(isValidIco("27082440")).toBe(true);
    expect(isValidIco("270 82440")).toBe(true);
  });

  it("odmítne špatný kontrolní součet", () => {
    expect(isValidIco("27082441")).toBe(false);
    expect(isValidIco("123")).toBe(false);
  });
});

describe("PSČ a DIČ", () => {
  it("formátuje PSČ", () => {
    expect(formatZip("60200")).toBe("602 00");
    expect(formatZip("602 00")).toBe("602 00");
  });

  it("kontroluje tvar českého DIČ", () => {
    expect(dicLooksCzech("CZ27082440")).toBe(true);
    expect(dicLooksCzech("")).toBe(true);
    expect(dicLooksCzech("27082440")).toBe(false);
  });
});
