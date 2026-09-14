import { match } from "ts-pattern";

import type { CardType } from "@/features/card/value-objects/card-type";
import { DECK_SECTIONS, type DeckSection } from "@/features/deck/deck/deck";
import { ZONE_RULES } from "@/features/deck/deck/deck-legality";
import {
  EMPTY_POOL_FILTERS,
  legendCriteria,
  poolCriteria,
  zoneCardTypes,
} from "@/features/deck/presentation/deck-zone-pool";

const NEVER_IN_A_DECK: readonly CardType[] = ["Other", "Token"];

function typesOffered(section: DeckSection): readonly CardType[] {
  return match<DeckSection, readonly CardType[]>(section)
    .with("legend", () => legendCriteria("", []).typeIds ?? [])
    .with(
      "mainDeck",
      "runeDeck",
      "battlefield",
      "sideboard",
      (zone) => poolCriteria(zone, EMPTY_POOL_FILTERS, "", undefined).typeIds ?? [],
    )
    .exhaustive();
}

describe("card types that are never in a deck", () => {
  it("should be offered by no deck section", () => {
    for (const section of DECK_SECTIONS) {
      expect(typesOffered(section).length).toBeGreaterThan(0);

      for (const typeId of NEVER_IN_A_DECK) {
        expect(typesOffered(section)).not.toContain(typeId);
      }
    }
  });

  it("should not reach a zone's query even when they are chosen as filters", () => {
    for (const { section } of ZONE_RULES) {
      const criteria = poolCriteria(
        section,
        { ...EMPTY_POOL_FILTERS, typeIds: NEVER_IN_A_DECK },
        "",
        undefined,
      );

      expect(criteria.typeIds).toEqual(zoneCardTypes(section));
    }
  });
});
