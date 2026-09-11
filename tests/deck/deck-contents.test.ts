import { parseCard } from "@/features/card/card";
import { chosenChampionCard, deckGroups } from "@/features/deck/presentation/deck-contents";

import { card, carriedKeyword } from "../card/fixtures";
import { deck } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear - Relentless Storm",
  speeds: ["reaction"],
  keywords: [carriedKeyword("vision", "Vision")],
  attributes: { energy: null, might: null, power: null },
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const cheap = card("cheap", "OGN", {
  name: "Cheap Unit",
  keywords: [carriedKeyword("shield", "Shield", 2)],
  attributes: { energy: 1, might: 1, power: 1 },
  tagIds: ["Volibear", "Freljord"],
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
  classification: { typeId: "Spell", supertypeId: null, rarityId: "common" },
  tagIds: ["Freljord"],
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

const cards = [legend, champion, cheap, mid, big];
const built = deck("d1", {
  chosenChampionCardId: champion.cardId,
  entries: [
    { section: "legend", cardId: legend.cardId, printingId: legend.printingId, quantity: 1 },
    { section: "mainDeck", cardId: champion.cardId, printingId: champion.printingId, quantity: 1 },
    { section: "mainDeck", cardId: cheap.cardId, printingId: cheap.printingId, quantity: 3 },
    { section: "mainDeck", cardId: mid.cardId, printingId: mid.printingId, quantity: 2 },
    { section: "sideboard", cardId: big.cardId, printingId: big.printingId, quantity: 1 },
  ],
});

describe("deck contents", () => {
  it("should split the main deck by card type and keep other zones apart", () => {
    expect(deckGroups(built, cards).map((group) => [group.title, group.count])).toEqual([
      ["Legend", 1],
      ["Units", 4],
      ["Spells & Gear", 2],
      ["Sideboard", 1],
    ]);
  });

  it("should drop entries whose card is missing from the catalog", () => {
    expect(deckGroups(built, [cheap]).map((group) => group.title)).toEqual(["Units"]);
  });

  it("should resolve each entry against its own printing when two printings share a riftbound id", () => {
    const alternate = parseCard({
      ...cheap,
      printingId: "cheap-alt",
      name: "Cheap Unit (Alternate Art)",
    });
    const mixed = deck("d2", {
      entries: [
        { section: "mainDeck", cardId: cheap.cardId, printingId: cheap.printingId, quantity: 2 },
        {
          section: "mainDeck",
          cardId: alternate.cardId,
          printingId: alternate.printingId,
          quantity: 1,
        },
      ],
    });

    expect(
      deckGroups(mixed, [cheap, alternate]).flatMap((group) =>
        group.cards.map((held) => [held.card.printingId, held.quantity]),
      ),
    ).toEqual([
      ["cheap", 2],
      ["cheap-alt", 1],
    ]);
  });

  it("should name the chosen champion's own printing", () => {
    expect(chosenChampionCard(built, cards)?.printingId).toBe(champion.printingId);
  });
});
