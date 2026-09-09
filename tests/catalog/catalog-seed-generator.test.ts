import { assertValid, buildSeed } from "../../scripts/catalog-seed";
import type { NormalizedCard, RawSet } from "../../scripts/catalog-seed";

function set(code: string): RawSet {
  return {
    id: `source-${code}`,
    name: `Set ${code}`,
    set_id: code,
    card_count: 10,
    tcgplayer_id: null,
    cardmarket_id: null,
    published_on: "2025-06-26",
  };
}

function card(id: string, overrides: Partial<NormalizedCard> = {}): NormalizedCard {
  return {
    id,
    riftboundId: `OGN-${id}`,
    setCode: "OGN",
    collectorNumber: 1,
    name: `Card ${id}`,
    cleanName: `Card ${id}`,
    energy: 3,
    might: 2,
    power: null,
    rulesTextRich: "<p>Play effect.</p>",
    rulesTextPlain: "Play effect.",
    flavourText: null,
    orientation: "portrait",
    isAlternateArt: false,
    isOvernumbered: false,
    isSignature: false,
    poolCode: null,
    championName: null,
    identityName: `Card ${id}`,
    sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
    typeId: "Unit",
    supertypeId: null,
    rarityId: "Common",
    domainIds: ["Chaos"],
    tagIds: [],
    regions: [],
    imageSources: [`https://cards.example/${id}.webp`],
    artist: null,
    accessibilityText: null,
    marketplaceReferences: [],
    ...overrides,
  };
}

function imagesFor(cards: readonly NormalizedCard[]): ReadonlyMap<string, string> {
  return new Map(cards.map((entry) => [entry.id, `${entry.id}.webp`]));
}

describe("catalog seed", () => {
  it("keeps every printing and names one of them for each Riftbound ID", () => {
    const cards: readonly NormalizedCard[] = [
      card("a", { riftboundId: "OGN-001" }),
      card("b", { riftboundId: "OGN-001", isAlternateArt: true }),
      card("c", { riftboundId: "OGN-002" }),
    ];

    const { seed } = buildSeed(cards, [set("OGN")], imagesFor(cards));

    expect(seed.catalogCards.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(seed.catalogCards.filter((row) => row.isCanonical).map((row) => row.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("gives every card a media row so none drops out of the catalog", () => {
    const cards: readonly NormalizedCard[] = [card("a"), card("b"), card("c")];

    const { seed } = buildSeed(cards, [set("OGN")], imagesFor(cards));

    expect(seed.cardMedia.map((row) => row.cardId)).toEqual(["a", "b", "c"]);
    expect(() => assertValid(seed)).not.toThrow();
  });

  it("records a keyword at each scope the card prints it at", () => {
    const cards: readonly NormalizedCard[] = [
      card("a", { rulesTextPlain: "[Empowered]\nOther friendly units here have [Empowered]." }),
    ];

    const { seed } = buildSeed(cards, [set("OGN")], imagesFor(cards));

    expect(seed.cardKeywords).toEqual([
      {
        cardId: "a",
        keywordId: "empowered",
        scope: "self",
        value: null,
        cost: null,
        reminder: null,
      },
      {
        cardId: "a",
        keywordId: "empowered",
        scope: "other",
        value: null,
        cost: null,
        reminder: null,
      },
    ]);
  });

  it("skips a card whose set is absent rather than dropping it silently", () => {
    const cards: readonly NormalizedCard[] = [card("a"), card("b", { setCode: "MISSING" })];

    const { seed, skipped } = buildSeed(cards, [set("OGN")], imagesFor(cards));

    expect(skipped.map((row) => row.id)).toEqual(["b"]);
    expect(seed.catalogCards.map((row) => row.id)).toEqual(["a"]);
  });

  it("fails generation when a card has no media row", () => {
    const cards: readonly NormalizedCard[] = [card("a"), card("b")];

    const { seed } = buildSeed(cards, [set("OGN")], imagesFor([card("a")]));

    expect(() => assertValid(seed)).toThrow(/no media row: b/);
  });

  it("fails generation when a Riftbound ID has no canonical printing", () => {
    const cards: readonly NormalizedCard[] = [card("a"), card("b")];

    const { seed } = buildSeed(cards, [set("OGN")], imagesFor(cards));
    for (const row of seed.catalogCards) row.isCanonical = false;

    expect(() => assertValid(seed)).toThrow(/no canonical printing: OGN-a, OGN-b/);
  });
});
