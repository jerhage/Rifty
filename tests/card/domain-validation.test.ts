import { parseCard } from "@/features/card/card";
import { parseCardListCriteria } from "@/features/card/card-list-criteria";
import { parseCardSet } from "@/features/set/card-set";

import { card, cardSet } from "./fixtures";

describe("catalog domain validation", () => {
  it("rejects a card without a source identity or image URL", () => {
    expect(() => parseCard({ ...card("vi", "UNL"), id: " " })).toThrow("Too small");
    expect(() =>
      parseCard({
        ...card("vi", "UNL"),
        imageUrl: "",
      }),
    ).toThrow("Invalid URL");
  });

  it("rejects invalid analysis criteria and malformed set metadata", () => {
    expect(() => parseCardListCriteria({ limit: 0 })).toThrow("Too small");
    expect(() => parseCardListCriteria({ sort: { type: "name", direction: "up" } })).toThrow();
    expect(() =>
      parseCardListCriteria({ energy: { type: "between", minimum: 5, maximum: 4 } }),
    ).toThrow("minimum cannot exceed");
    expect(() => parseCardSet({ ...cardSet("UNL", "2026-05-08T00:00:00"), code: " " })).toThrow(
      "Too small",
    );
  });
});
