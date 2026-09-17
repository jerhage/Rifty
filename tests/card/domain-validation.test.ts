import { parseCard } from "@/features/card/card";
import { parseCardListCriteria } from "@/features/card/card-list-criteria";
import { parseCardSet } from "@/features/set/card-set";

import { card, cardSet, taxonomyId } from "./fixtures";

describe("card and set domain validation", () => {
  it("should reject a card with a blank printing id or an unusable image URL", () => {
    expect(() => parseCard({ ...card("vi", "UNL"), printingId: " " })).toThrow("Too small");
    expect(() =>
      parseCard({
        ...card("vi", "UNL"),
        imageUrl: "",
      }),
    ).toThrow("Invalid URL");
  });

  it("should accept the two card types that exist outside a deck", () => {
    const buff = parseCard(
      card("pr-ogn-298-alternate-art", "PR", {
        name: "Buff",
        classification: {
          typeId: "Other",
          supertypeId: taxonomyId("Token"),
          rarityId: taxonomyId("common"),
        },
      }),
    );
    const recruit = parseCard(
      card("ven-T04-nx", "VEN", {
        name: "Recruit",
        classification: { typeId: "Token", supertypeId: null, rarityId: taxonomyId("common") },
      }),
    );

    expect(buff.classification.typeId).toBe("Other");
    expect(recruit.classification.typeId).toBe("Token");
  });

  it("should reject invalid card list criteria and a blank set code", () => {
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
