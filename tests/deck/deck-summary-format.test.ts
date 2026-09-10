import { deckListLabel } from "@/features/deck/presentation/deck-summary-format";

describe("deck list label", () => {
  it("should invite the first list when no deck has been saved", () => {
    expect(deckListLabel(0)).toBe("No decks yet. Build your first list.");
  });

  it("should count a single deck in the singular", () => {
    expect(deckListLabel(1)).toBe("1 list");
  });

  it("should count several decks in the plural", () => {
    expect(deckListLabel(2)).toBe("2 lists");
    expect(deckListLabel(17)).toBe("17 lists");
  });
});
