import { isDeckNameTaken } from "@/features/deck/deck/deck-naming";

import { deck } from "./fixtures";

const existing = [
  deck("deck-1", { name: "Ember Aggro" }),
  deck("deck-2", { name: "Rune Control" }),
];

describe("deck naming", () => {
  it("should report a free name as free", () => {
    expect(isDeckNameTaken("Freljord Ramp", existing, null)).toBe(false);
  });

  it("should report an exact match as taken", () => {
    expect(isDeckNameTaken("Ember Aggro", existing, null)).toBe(true);
  });

  it("should ignore capitalization", () => {
    expect(isDeckNameTaken("ember aggro", existing, null)).toBe(true);
    expect(isDeckNameTaken("EMBER AGGRO", existing, null)).toBe(true);
  });

  it("should ignore surrounding space on the wanted name", () => {
    expect(isDeckNameTaken("  Ember Aggro  ", existing, null)).toBe(true);
  });

  it("should ignore surrounding space on a stored name", () => {
    const spaced = [{ ...deck("deck-3"), name: "  Ember Aggro " }];

    expect(isDeckNameTaken("Ember Aggro", spaced, null)).toBe(true);
  });

  it("should not treat inner space as removable", () => {
    expect(isDeckNameTaken("EmberAggro", existing, null)).toBe(false);
  });

  it("should not count the excluded deck as a clash with itself", () => {
    expect(isDeckNameTaken("EMBER AGGRO", existing, "deck-1")).toBe(false);
  });

  it("should still catch another deck's name when one deck is excluded", () => {
    expect(isDeckNameTaken("rune control", existing, "deck-1")).toBe(true);
  });

  it("should report an empty list as free", () => {
    expect(isDeckNameTaken("Ember Aggro", [], null)).toBe(false);
  });
});
