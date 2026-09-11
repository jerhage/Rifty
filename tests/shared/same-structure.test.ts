import { sameStructure } from "@/shared/same-structure";

describe("sameStructure", () => {
  it("should match records holding the same values in a different key order", () => {
    expect(
      sameStructure(
        { search: { type: "nameOrRulesText", text: "lux" }, typeIds: ["Unit"] },
        { typeIds: ["Unit"], search: { text: "lux", type: "nameOrRulesText" } },
      ),
    ).toBe(true);
  });

  it("should match an absent key against an explicitly undefined one", () => {
    expect(sameStructure({ typeIds: ["Unit"] }, { typeIds: ["Unit"], keywordIds: undefined })).toBe(
      true,
    );
  });

  it("should separate records differing in a nested value", () => {
    expect(
      sameStructure(
        { energy: { type: "atLeast", value: 2 } },
        { energy: { type: "atLeast", value: 3 } },
      ),
    ).toBe(false);
  });

  it("should separate arrays differing in order or length", () => {
    expect(sameStructure(["Calm", "Mind"], ["Mind", "Calm"])).toBe(false);
    expect(sameStructure(["Calm"], ["Calm", "Mind"])).toBe(false);
  });

  it("should separate an array from a record and null from a record", () => {
    expect(sameStructure([], {})).toBe(false);
    expect(sameStructure(null, {})).toBe(false);
  });

  it("should match equal scalars and separate unequal ones", () => {
    expect(sameStructure("Unit", "Unit")).toBe(true);
    expect(sameStructure(1, "1")).toBe(false);
  });
});
