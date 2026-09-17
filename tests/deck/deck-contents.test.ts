import { parseCard } from "@/features/card/card";
import type { ResolvedDeckEntry } from "@/features/deck/deck/resolved-deck";
import { deckGroups } from "@/features/deck/presentation/deck-contents";

import { card, carriedKeyword, taxonomyId } from "../card/fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  speeds: ["reaction"],
  keywords: [carriedKeyword("vision", "Vision")],
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: taxonomyId("rare") },
});
const cheap = card("cheap", "OGN", {
  name: "Cheap Unit",
  keywords: [carriedKeyword("shield", "Shield", 2)],
  attributes: { energy: 1, might: 1, power: 1 },
  tagIds: [taxonomyId("Volibear"), taxonomyId("Freljord")],
});
const mid = card("mid", "OGN", {
  name: "Mid Spell",
  speeds: ["action", "reaction"],
  keywords: [
    carriedKeyword("tank", "Tank"),
    carriedKeyword("reaction", "Reaction"),
    carriedKeyword("equip", "Equip"),
  ],
  attributes: { energy: 3, might: null, power: null },
  classification: { typeId: "Spell", supertypeId: null, rarityId: taxonomyId("common") },
  tagIds: [taxonomyId("Freljord")],
});
const champion = card("champion", "OGN", {
  name: "Volibear - Furious",
  attributes: { energy: 2, might: 4, power: null },
  tagIds: [],
});
const big = card("big", "OGN", {
  name: "Big Unit",
  attributes: { energy: 7, might: 8, power: null },
  tagIds: [],
});

const built: readonly ResolvedDeckEntry[] = [
  { section: "legend", card: legend, quantity: 1 },
  { section: "mainDeck", card: champion, quantity: 1 },
  { section: "mainDeck", card: cheap, quantity: 3 },
  { section: "mainDeck", card: mid, quantity: 2 },
  { section: "sideboard", card: big, quantity: 1 },
];

describe("deck contents", () => {
  it("should split the main deck by card type and keep other sections apart", () => {
    expect(deckGroups(built).map((group) => [group.title, group.count])).toEqual([
      ["Legend", 1],
      ["Units", 4],
      ["Spells & Gear", 2],
      ["Sideboard", 1],
    ]);
  });

  it("should group every entry it is given and name no empty group", () => {
    const units: readonly ResolvedDeckEntry[] = [{ section: "mainDeck", card: cheap, quantity: 3 }];

    expect(deckGroups(units).map((group) => [group.title, group.count])).toEqual([["Units", 3]]);
  });

  it("should keep two printings of the same card as rows of their own", () => {
    const alternate = parseCard({
      ...cheap,
      printingId: "cheap-alt",
      name: "Cheap Unit (Alternate Art)",
    });
    const mixed: readonly ResolvedDeckEntry[] = [
      { section: "mainDeck", card: cheap, quantity: 2 },
      { section: "mainDeck", card: alternate, quantity: 1 },
    ];

    expect(
      deckGroups(mixed).flatMap((group) =>
        group.cards.map((held) => [held.card.printingId, held.quantity]),
      ),
    ).toEqual([
      ["cheap", 2],
      ["cheap-alt", 1],
    ]);
  });
});
