import { describe, expect, it } from "bun:test";
import { sanitizeString } from "./updateVariablesInSession";

describe("sanitizeString", () => {
  it("should keep JSON-serialized values with escaped backslashes parseable", () => {
    const category = {
      id: 25561,
      name: "Tosa",
      services: [
        { id: 329184, name: "Tosa alta qui\\sex\\sab" },
        { id: 329182, name: "Higiênica Complexa Qu\\Se\\Sa" },
      ],
    };

    const sanitized = sanitizeString(JSON.stringify(category));

    expect(JSON.parse(sanitized)).toEqual(category);
  });

  it("should not change valid escape sequences", () => {
    const value = '{"text":"line\\nbreak \\"quoted\\" back\\\\slash \\u00e9"}';

    expect(sanitizeString(value)).toBe(value);
  });

  it("should escape lone backslashes", () => {
    expect(sanitizeString("qui\\sex")).toBe("qui\\\\sex");
  });

  it("should escape a trailing lone backslash", () => {
    expect(sanitizeString("abc\\")).toBe("abc\\\\");
  });

  it("should only escape the backslash left alone after a pair", () => {
    expect(sanitizeString("a\\\\\\sb")).toBe("a\\\\\\\\sb");
  });

  it("should replace unpaired surrogate halves", () => {
    expect(sanitizeString("a\uD800b")).toBe("a�b");
  });
});
