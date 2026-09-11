import { assertValid, buildSeed } from "../../scripts/catalog-seed";
import type { NormalizedCard, RawSet } from "../../scripts/catalog-seed";

const ORIGINS = "2025-10-31T00:00:00";
const SPIRITFORGED = "2026-02-13T00:00:00";

function set(code: string, publishedOn: string = ORIGINS): RawSet {
  return {
    name: `Set ${code}`,
    set_id: code,
    card_count: 10,
    tcgplayer_id: null,
    cardmarket_id: null,
    published_on: publishedOn,
  };
}

function printing(sourceId: string, overrides: Partial<NormalizedCard> = {}): NormalizedCard {
  return {
    sourceId,
    isPrimaryFeed: true,
    riftboundId: `OGN-${sourceId}`,
    setCode: "OGN",
    collectorNumber: sourceId,
    name: `Card ${sourceId}`,
    cleanName: `Card ${sourceId}`,
    energy: 3,
    might: 2,
    power: null,
    rulesTextRich: "<p>Play effect.</p>",
    rulesTextPlain: "Play effect.",
    flavourText: null,
    orientation: "portrait",
    finish: "standard",
    poolCode: null,
    championName: null,
    identityName: `Card ${sourceId}`,
    sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
    typeId: "Unit",
    supertypeId: null,
    rarityId: "Common",
    domainIds: ["Chaos"],
    tagIds: [],
    regions: [],
    imageSources: [`https://cards.example/${sourceId}.webp`],
    artist: null,
    accessibilityText: null,
    marketplaceReferences: [],
    ...overrides,
  };
}

function imagesFor(printings: readonly NormalizedCard[]): ReadonlyMap<string, string> {
  return new Map(printings.map((entry) => [entry.sourceId, `${entry.sourceId}.webp`]));
}

describe("catalog seed", () => {
  it("should gather the printings that share an identity under one card", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { identityName: "Sett, Brawler" }),
      printing("b", { identityName: "Sett, Brawler", riftboundId: "SFD-232" }),
      printing("c"),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards.map((row) => row.id)).toEqual(["Card c", "Sett, Brawler"]);
    expect(seed.cardPrintings.map((row) => [row.id, row.cardId])).toEqual([
      ["ogn-c", "Card c"],
      ["ogn-a", "Sett, Brawler"],
      ["ogn-b", "Sett, Brawler"],
    ]);
    expect(seed.cards.map((row) => row.cleanName)).toEqual(["Card c", "Sett Brawler"]);
    expect(() => assertValid(seed)).not.toThrow();
  });

  it("should keep every printing and name one of them for each Riftbound ID", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { riftboundId: "OGN-001" }),
      printing("b", { riftboundId: "OGN-001", finish: "alternateArt" }),
      printing("c", { riftboundId: "OGN-002" }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardPrintings.map((row) => row.id)).toEqual([
      "ogn-a",
      "ogn-b-alternate-art",
      "ogn-c",
    ]);
    expect(seed.cardPrintings.filter((row) => row.isCanonical).map((row) => row.id)).toEqual([
      "ogn-a",
      "ogn-c",
    ]);
  });

  it("should drop a printing whose pool the feed left out when a pooled printing prints it", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Vilemaw",
        riftboundId: "OGN-055-166",
        collectorNumber: "055",
        poolCode: "166",
      }),
      printing("b", { identityName: "Vilemaw", riftboundId: "OGN-055", collectorNumber: "055" }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-055-166"]);
    expect(() => assertValid(seed)).not.toThrow();
  });

  it("should keep a printing the feed gives no pool when nothing else prints it", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Vilemaw",
        riftboundId: "OGN-055-166",
        collectorNumber: "055",
        poolCode: "166",
      }),
      printing("b", { identityName: "Vilemaw", riftboundId: "OGN-056", collectorNumber: "056" }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-055-166", "ogn-056"]);
  });

  it("should keep the newest row when the feed reissues a printing under a second key", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Vilemaw",
        riftboundId: "OGN-055-166",
        collectorNumber: "055",
        poolCode: "166",
        flavourText: null,
        sourceUpdatedAt: "2026-07-10T22:45:22.382210+00:00",
      }),
      printing("b", {
        identityName: "Vilemaw",
        riftboundId: "OGN-055-166",
        collectorNumber: "055",
        poolCode: "166",
        flavourText: "It waits.",
        sourceUpdatedAt: "2026-09-08T21:33:43.253Z",
      }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardPrintings).toHaveLength(1);
    expect(seed.cardPrintings[0]).toMatchObject({
      id: "ogn-055-166",
      flavourText: "It waits.",
      isCanonical: true,
    });
    expect(seed.cardMedia.map((row) => row.imageFile)).toEqual(["b.webp"]);
  });

  it("should keep two finishes the feed prints under one Riftbound ID", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { identityName: "Vilemaw", riftboundId: "OGN-055", collectorNumber: "055" }),
      printing("b", {
        identityName: "Vilemaw",
        riftboundId: "OGN-055",
        collectorNumber: "055",
        finish: "metal",
      }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-055", "ogn-055-metal"]);
  });

  it("should give every printing a media row so none drops out of the catalog", () => {
    const printings: readonly NormalizedCard[] = [printing("a"), printing("b"), printing("c")];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardMedia.map((row) => row.printingId)).toEqual(["ogn-a", "ogn-b", "ogn-c"]);
    expect(() => assertValid(seed)).not.toThrow();
  });

  it("should take each single value from the newest printing", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Teemo, Strategist",
        rulesTextRich: "<p>When I defend, deal 1.</p>",
        rulesTextPlain: "When I defend, deal 1.",
        supertypeId: null,
      }),
      printing("b", {
        identityName: "Teemo, Strategist",
        setCode: "SFD",
        rulesTextRich: "<p>When I defend or I'm played, deal 1.</p>",
        rulesTextPlain: "When I defend or I'm played, deal 1.",
        supertypeId: "Champion",
      }),
    ];

    const { seed } = buildSeed(
      printings,
      [set("OGN"), set("SFD", SPIRITFORGED)],
      imagesFor(printings),
    );

    expect(seed.cards).toHaveLength(1);
    expect(seed.cards[0]).toMatchObject({
      rulesTextPlain: "When I defend or I'm played, deal 1.",
      rulesTextRich: "<p>When I defend or I'm played, deal 1.</p>",
      supertypeId: "Champion",
    });
  });

  it("should prefer the canonical base printing when printings tie at the newest date", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Master Yi, Tempered",
        finish: "alternateArt",
        rulesTextPlain: "[Hunt 2]",
        rulesTextRich: "<p>[Hunt 2]</p>",
      }),
      printing("b", {
        identityName: "Master Yi, Tempered",
        rulesTextPlain: "[Hunt 2] (When I conquer or hold, gain 2 XP.)",
        rulesTextRich: "<p>[Hunt 2] (When I conquer or hold, gain 2 XP.)</p>",
      }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards[0]?.rulesTextPlain).toBe("[Hunt 2] (When I conquer or hold, gain 2 XP.)");
    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-b", "ogn-a-alternate-art"]);
  });

  it("should take the union of the lists its printings carry", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Sett, Brawler",
        domainIds: ["Body"],
        tagIds: ["Sett", "Ionia"],
        rulesTextPlain: "[Action] Deal 1.",
      }),
      printing("b", {
        identityName: "Sett, Brawler",
        setCode: "SFD",
        domainIds: ["Body", "Fury"],
        tagIds: ["Sett"],
        rulesTextPlain: "[Reaction] Deal 1.",
      }),
    ];

    const { seed } = buildSeed(
      printings,
      [set("OGN"), set("SFD", SPIRITFORGED)],
      imagesFor(printings),
    );

    expect(seed.cardDomains.map((row) => row.domainId)).toEqual(["Body", "Fury"]);
    expect(seed.cardTags.map((row) => row.tagId)).toEqual(["Sett", "Ionia"]);
    expect(seed.cardSpeeds.map((row) => row.speed)).toEqual(["reaction", "action"]);
  });

  it("should never let a blank printing beat a printing that has the field", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Bandle Tree",
        championName: "Lux",
        rulesTextRich: "<p>You may hide an additional card here.</p>",
        rulesTextPlain: "You may hide an additional card here.",
      }),
      printing("b", {
        identityName: "Bandle Tree",
        setCode: "SFD",
        championName: null,
        rulesTextRich: "",
        rulesTextPlain: "",
      }),
      printing("c", {
        identityName: "Bandle Tree",
        setCode: "SFD",
        championName: null,
        rulesTextRich: "<p>[NO TEXT]</p>",
        rulesTextPlain: "[NO TEXT]",
      }),
    ];

    const { seed } = buildSeed(
      printings,
      [set("OGN"), set("SFD", SPIRITFORGED)],
      imagesFor(printings),
    );

    expect(seed.cards[0]).toMatchObject({
      rulesTextPlain: "You may hide an additional card here.",
      rulesTextRich: "<p>You may hide an additional card here.</p>",
      championName: "Lux",
    });
  });

  it("should leave a card blank when no printing prints the field, and still give it the normal speed", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { identityName: "Mind Rune", rulesTextRich: "", rulesTextPlain: "" }),
      printing("b", {
        identityName: "Mind Rune",
        rulesTextRich: "<p>[NO TEXT]</p>",
        rulesTextPlain: "[NO TEXT]",
      }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards[0]).toMatchObject({ rulesTextPlain: "", rulesTextRich: "" });
    expect(seed.cardSpeeds.map((row) => row.speed)).toEqual(["normal"]);
  });

  it("should keep a secondary feed from resolving a card the primary feed also prints", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        identityName: "Master Yi, Wuju Bladesman",
        typeId: "Legend",
        energy: null,
        might: null,
        power: null,
        supertypeId: "Champion",
        domainIds: ["Calm", "Body"],
        tagIds: ["Master Yi"],
        rulesTextRich: "<p>While a friendly unit defends alone, it gets +2 :rb_might:.</p>",
        rulesTextPlain: "While a friendly unit defends alone, it gets +2 :rb_might:.",
      }),
      printing("b", {
        identityName: "Master Yi, Wuju Bladesman",
        isPrimaryFeed: false,
        setCode: "SFD",
        typeId: "Legend",
        energy: null,
        might: null,
        power: null,
        supertypeId: null,
        domainIds: ["Calm", "Fury"],
        tagIds: ["Master Yi", "Starter"],
        rulesTextRich: "",
        rulesTextPlain: "While a friendly unit defends alone, it gets +2 [shield].",
      }),
    ];

    const { seed } = buildSeed(
      printings,
      [set("OGN"), set("SFD", SPIRITFORGED)],
      imagesFor(printings),
    );

    expect(seed.cards[0]).toMatchObject({
      supertypeId: "Champion",
      rulesTextPlain: "While a friendly unit defends alone, it gets +2 :rb_might:.",
    });
    expect(seed.cardDomains.map((row) => row.domainId)).toEqual(["Calm", "Body"]);
    expect(seed.cardTags.map((row) => row.tagId)).toEqual(["Master Yi"]);
    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-a", "sfd-b"]);
  });

  it("should record a keyword once per target it is printed at", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { rulesTextPlain: "[Empowered]\nOther friendly units here have [Empowered]." }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardKeywords).toEqual([
      {
        id: 1,
        cardId: "Card a",
        keywordId: "empowered",
        value: null,
        cost: null,
        reminder: null,
        source: "derived",
      },
      {
        id: 2,
        cardId: "Card a",
        keywordId: "empowered",
        value: null,
        cost: null,
        reminder: null,
        source: "derived",
      },
    ]);
    expect(seed.cardKeywordTargets).toEqual([
      { cardKeywordId: 1, targetKind: "self", targetIsToken: false, allegiance: "own" },
      { cardKeywordId: 2, targetKind: "unit", targetIsToken: false, allegiance: "friendly" },
    ]);
  });

  it("should record a keyword its printings share only once", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { identityName: "Vilemaw", rulesTextPlain: "[Ambush] Deal 1." }),
      printing("b", { identityName: "Vilemaw", rulesTextPlain: "[Ambush] Deal 1." }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardKeywords).toHaveLength(1);
    expect(seed.cardKeywords[0]).toMatchObject({ cardId: "Vilemaw", keywordId: "ambush" });
  });

  it("should give one occurrence a row for each target it names", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        rulesTextPlain: "When combat starts here, the attacker and defender each [Add] [1].",
      }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cardKeywords).toHaveLength(1);
    expect(seed.cardKeywordTargets).toEqual([
      { cardKeywordId: 1, targetKind: "player", targetIsToken: false, allegiance: "own" },
      { cardKeywordId: 1, targetKind: "player", targetIsToken: false, allegiance: "enemy" },
    ]);
  });

  it("should refuse to guess a target it has no phrase for", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { rulesTextPlain: "When you hold here, [Vision] twice." }),
    ];

    expect(() => buildSeed(printings, [set("OGN")], imagesFor(printings))).toThrow(
      /Unclassified keyword/,
    );
  });

  it("should skip a card whose set is absent rather than dropping it silently", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a"),
      printing("b", { setCode: "MISSING" }),
    ];

    const { seed, skipped } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(skipped.map((row) => row.sourceId)).toEqual(["b"]);
    expect(seed.cardPrintings.map((row) => row.id)).toEqual(["ogn-a"]);
  });

  it("should reunite a promo that dropped its champion prefix with the card it reprints", () => {
    const legend = { typeId: "Legend", energy: null, might: null, power: null } as const;
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        ...legend,
        name: "Kai'Sa - Daughter of the Void",
        identityName: "Kai'Sa, Daughter of the Void",
        championName: "Kai'Sa",
      }),
      printing("b", {
        ...legend,
        name: "Daughter of the Void",
        identityName: "Daughter of the Void",
        championName: "Kai'Sa",
      }),
    ];

    const { seed, identityConflicts } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards.map((row) => row.id)).toEqual(["Kai'Sa, Daughter of the Void"]);
    expect(seed.cards.map((row) => row.cleanName)).toEqual(["KaiSa Daughter of the Void"]);
    expect(seed.cardPrintings.map((row) => row.cardId)).toEqual([
      "Kai'Sa, Daughter of the Void",
      "Kai'Sa, Daughter of the Void",
    ]);
    expect(identityConflicts).toEqual([]);
  });

  it("should leave a card that merely shares a suffix with another under its own identity", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        name: "Sett - The Boss",
        identityName: "Sett, The Boss",
        championName: "Sett",
      }),
      printing("b", { name: "The Boss", identityName: "The Boss" }),
    ];

    const { seed, identityConflicts } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards.map((row) => row.id)).toEqual(["Sett, The Boss", "The Boss"]);
    expect(identityConflicts).toEqual([]);
  });

  it("should report rather than merge a truncated identity whose gameplay attributes disagree", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", {
        name: "Jinx - Loose Cannon",
        identityName: "Jinx, Loose Cannon",
        championName: "Jinx",
        might: 4,
      }),
      printing("b", { name: "Loose Cannon", identityName: "Loose Cannon", championName: "Jinx" }),
    ];

    const { seed, identityConflicts } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(seed.cards.map((row) => row.id)).toEqual(["Jinx, Loose Cannon", "Loose Cannon"]);
    expect(identityConflicts).toEqual([
      {
        identityName: "Loose Cannon",
        hosts: ["Jinx, Loose Cannon"],
        reason: "type, energy, might or power disagree: Unit/3/2/null and Unit/3/4/null",
      },
    ]);
  });

  it("should fail generation when a printing has no media row", () => {
    const printings: readonly NormalizedCard[] = [printing("a"), printing("b")];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor([printing("a")]));

    expect(() => assertValid(seed)).toThrow(/no media row: ogn-b/);
  });

  it("should fail generation when two printings share a set, collector number, pool and finish", () => {
    const printings: readonly NormalizedCard[] = [
      printing("a", { riftboundId: "OGN-001", collectorNumber: "055" }),
      printing("b", { riftboundId: "OGN-002", collectorNumber: "055" }),
    ];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));

    expect(() => assertValid(seed)).toThrow(
      /printing set code, collector number, pool code and finish: OGN 055 no pool standard/,
    );
  });

  it("should fail generation when a Riftbound ID has no canonical printing", () => {
    const printings: readonly NormalizedCard[] = [printing("a"), printing("b")];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));
    for (const row of seed.cardPrintings) row.isCanonical = false;

    expect(() => assertValid(seed)).toThrow(/no canonical printing: OGN-a, OGN-b/);
  });

  it("should fail generation when a printing names a card the seed has no row for", () => {
    const printings: readonly NormalizedCard[] = [printing("a")];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));
    seed.cards.length = 0;

    expect(() => assertValid(seed)).toThrow(/card_printing rows name an owner/);
  });

  it("should fail generation when a satellite outlives the card it belongs to", () => {
    const printings: readonly NormalizedCard[] = [printing("a")];

    const { seed } = buildSeed(printings, [set("OGN")], imagesFor(printings));
    seed.cardDomains.push({ cardId: "Card b", domainId: "Chaos" });

    expect(() => assertValid(seed)).toThrow(/card_domain rows name an owner/);
  });
});
