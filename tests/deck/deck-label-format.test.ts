import { savedDeckLabel } from "@/features/deck/presentation/deck-label-format";

describe("saved deck label", () => {
  it("should invite the first deck when no deck has been saved", () => {
    expect(savedDeckLabel(0)).toBe("No decks yet. Build your first deck.");
  });

  it("should count a single deck in the singular", () => {
    expect(savedDeckLabel(1)).toBe("1 deck");
  });

  it("should count several decks in the plural", () => {
    expect(savedDeckLabel(2)).toBe("2 decks");
    expect(savedDeckLabel(17)).toBe("17 decks");
  });
});
