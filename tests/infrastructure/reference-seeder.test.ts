import { DatabaseSync } from "node:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";

import { applyReferenceSeed, type CatalogSeed } from "@/infrastructure/database/reference-seeder";
import {
  cardDomains,
  cardImageSources,
  cardMarketplaceReferences,
  cardMedia,
  cardPrintings,
  cardSpeeds,
  cardTags,
  cards,
} from "@/infrastructure/database/reference-schema/cards";
import {
  cardKeywordTargets,
  cardKeywords,
  keywords,
} from "@/infrastructure/database/reference-schema/keywords";
import {
  cardSets,
  setMarketplaceReferences,
} from "@/infrastructure/database/reference-schema/sets";
import {
  cardSupertypes,
  domains,
  rarities,
  tags,
} from "@/infrastructure/database/reference-schema/taxonomy";
import { applyMigrations } from "../sqlite-scenario-store";

const EMPTY_SEED: CatalogSeed = {
  cardTypes: [],
  cardSupertypes: [],
  rarities: [],
  cardSets: [],
  cards: [],
  cardPrintings: [],
  domains: [],
  tags: [],
  keywords: [],
  setMarketplaceReferences: [],
  cardMedia: [],
  cardImageSources: [],
  cardDomains: [],
  cardTags: [],
  cardMarketplaceReferences: [],
  cardKeywords: [],
  cardKeywordTargets: [],
  cardSpeeds: [],
};

function card(id: string, rulesTextPlain: string): typeof cards.$inferInsert {
  return {
    id,
    cleanName: id,
    energy: 3,
    might: 2,
    power: null,
    rulesTextRich: `<p>${rulesTextPlain}</p>`,
    rulesTextPlain,
    orientation: "portrait",
    typeId: "Unit",
    supertypeId: null,
    championName: null,
  };
}

function printing(id: string, cardId: string): typeof cardPrintings.$inferInsert {
  return {
    id,
    cardId,
    riftboundId: id.toUpperCase(),
    setCode: "OGN",
    collectorNumber: id,
    poolCode: null,
    rarityId: "Common",
    printedName: cardId,
    finish: "standard",
    flavourText: null,
    sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
    isCanonical: true,
  };
}

const TAXONOMY = {
  cardTypes: [{ id: "Unit", name: "Unit" }],
  cardSupertypes: [{ id: "Champion", name: "Champion" }],
  rarities: [{ id: "Common", name: "Common", sortOrder: 0 }],
  cardSets: [
    {
      code: "OGN",
      sourceId: "source-ogn",
      name: "Origins",
      declaredCardCount: 2,
      publishedOn: "2025-10-31T00:00:00",
    },
  ],
  domains: [{ id: "Chaos", name: "Chaos" }],
  tags: [{ id: "Noxus", name: "Noxus", kind: "region" as const }],
  keywords: [{ id: "tank", name: "Tank", reminderText: null }],
  setMarketplaceReferences: [
    { setCode: "OGN", marketplace: "tcgplayer" as const, externalId: "24344" },
  ],
};

const FIRST_SEED: CatalogSeed = {
  ...EMPTY_SEED,
  ...TAXONOMY,
  cards: [card("Retired Card", "Retires later."), card("Kept Card", "Stays.")],
  cardPrintings: [printing("ogn-001", "Retired Card"), printing("ogn-002", "Kept Card")],
  cardMedia: [
    { printingId: "ogn-001", imageFile: "ogn-001.webp", artist: null, accessibilityText: null },
    { printingId: "ogn-002", imageFile: "ogn-002.webp", artist: null, accessibilityText: null },
  ],
  cardImageSources: [
    { printingId: "ogn-001", url: "https://cards.example/ogn-001.webp", priority: 0 },
    { printingId: "ogn-002", url: "https://cards.example/ogn-002.webp", priority: 0 },
  ],
  cardDomains: [
    { cardId: "Retired Card", domainId: "Chaos" },
    { cardId: "Kept Card", domainId: "Chaos" },
  ],
  cardTags: [
    { cardId: "Retired Card", tagId: "Noxus" },
    { cardId: "Kept Card", tagId: "Noxus" },
  ],
  cardMarketplaceReferences: [
    { printingId: "ogn-001", marketplace: "tcgplayer", externalId: "1" },
    { printingId: "ogn-002", marketplace: "tcgplayer", externalId: "2" },
  ],
  cardKeywords: [
    { id: 1, cardId: "Retired Card", keywordId: "tank", value: null, cost: null, reminder: null },
    { id: 2, cardId: "Kept Card", keywordId: "tank", value: null, cost: null, reminder: null },
  ],
  cardKeywordTargets: [
    { cardKeywordId: 1, targetKind: "self", targetIsToken: false, allegiance: "unspecified" },
    { cardKeywordId: 2, targetKind: "self", targetIsToken: false, allegiance: "unspecified" },
  ],
  cardSpeeds: [
    { cardId: "Retired Card", speed: "normal" },
    { cardId: "Kept Card", speed: "normal" },
  ],
};

const SECOND_SEED: CatalogSeed = {
  ...EMPTY_SEED,
  ...TAXONOMY,
  cards: [card("Kept Card", "Stays, with new rules text.")],
  cardPrintings: [printing("ogn-002", "Kept Card")],
  cardMedia: [
    { printingId: "ogn-002", imageFile: "ogn-002.webp", artist: null, accessibilityText: null },
  ],
  cardImageSources: [
    { printingId: "ogn-002", url: "https://cards.example/ogn-002.webp", priority: 0 },
  ],
  cardDomains: [{ cardId: "Kept Card", domainId: "Chaos" }],
  cardTags: [{ cardId: "Kept Card", tagId: "Noxus" }],
  cardMarketplaceReferences: [{ printingId: "ogn-002", marketplace: "tcgplayer", externalId: "2" }],
  cardKeywords: [
    { id: 1, cardId: "Kept Card", keywordId: "tank", value: null, cost: null, reminder: null },
  ],
  cardKeywordTargets: [
    { cardKeywordId: 1, targetKind: "self", targetIsToken: false, allegiance: "unspecified" },
  ],
  cardSpeeds: [{ cardId: "Kept Card", speed: "normal" }],
};

function createSeedTarget() {
  const client = new DatabaseSync(":memory:");
  client.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(client);
  return { client, db: drizzle({ client }) };
}

describe("reference seeder", () => {
  let client: DatabaseSync;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    ({ client, db } = createSeedTarget());
  });

  afterEach(() => {
    client.close();
  });

  it("should fill an empty database from the bundled catalog", async () => {
    await applyReferenceSeed(db, FIRST_SEED, "version-one");

    expect(await db.select().from(cards)).toHaveLength(2);
    expect(await db.select().from(cardPrintings)).toHaveLength(2);
    expect(await db.select().from(cardMedia)).toHaveLength(2);
    expect(await db.select().from(cardKeywordTargets)).toHaveLength(2);
    expect(await db.select().from(cardSupertypes)).toHaveLength(1);
    expect(await db.select().from(setMarketplaceReferences)).toHaveLength(1);
  });

  it("should do nothing on a second run at the same version", async () => {
    await applyReferenceSeed(db, FIRST_SEED, "version-one");
    await applyReferenceSeed(db, EMPTY_SEED, "version-one");

    expect(await db.select().from(cards)).toHaveLength(2);
    expect(await db.select().from(cardPrintings)).toHaveLength(2);
    expect(await db.select().from(cardDomains)).toHaveLength(2);
  });

  it("should keep a printing the next catalog drops and replace its associations", async () => {
    await applyReferenceSeed(db, FIRST_SEED, "version-one");
    await applyReferenceSeed(db, SECOND_SEED, "version-two");

    const printingIds = (await db.select().from(cardPrintings)).map((row) => row.id);
    expect(printingIds).toEqual(expect.arrayContaining(["ogn-001", "ogn-002"]));

    const cardIds = (await db.select().from(cards)).map((row) => row.id);
    expect(cardIds).toEqual(expect.arrayContaining(["Retired Card", "Kept Card"]));

    expect(
      await db.select().from(cardDomains).where(eq(cardDomains.cardId, "Retired Card")),
    ).toHaveLength(0);
    expect(
      await db.select().from(cardTags).where(eq(cardTags.cardId, "Retired Card")),
    ).toHaveLength(0);
    expect(
      await db.select().from(cardSpeeds).where(eq(cardSpeeds.cardId, "Retired Card")),
    ).toHaveLength(0);
    expect(
      await db.select().from(cardMedia).where(eq(cardMedia.printingId, "ogn-001")),
    ).toHaveLength(0);
    expect(
      await db.select().from(cardImageSources).where(eq(cardImageSources.printingId, "ogn-001")),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(cardMarketplaceReferences)
        .where(eq(cardMarketplaceReferences.printingId, "ogn-001")),
    ).toHaveLength(0);
    expect(await db.select().from(cardKeywords)).toHaveLength(1);
  });

  it("should overwrite every column of a row the next catalog changes", async () => {
    await applyReferenceSeed(db, FIRST_SEED, "version-one");
    await applyReferenceSeed(
      db,
      {
        ...SECOND_SEED,
        cardSets: [
          {
            code: "OGN",
            sourceId: "source-ogn-renamed",
            name: "Origins, revised",
            declaredCardCount: 9,
            publishedOn: "2025-11-01T00:00:00",
          },
        ],
        rarities: [{ id: "Common", name: "Common, revised", sortOrder: 7 }],
        cardPrintings: [{ ...printing("ogn-002", "Kept Card"), printedName: "Kept Card, revised" }],
      },
      "version-two",
    );

    const [keptCard] = await db.select().from(cards).where(eq(cards.id, "Kept Card"));
    expect(keptCard?.rulesTextPlain).toBe("Stays, with new rules text.");

    const [set] = await db.select().from(cardSets).where(eq(cardSets.code, "OGN"));
    expect(set).toMatchObject({
      sourceId: "source-ogn-renamed",
      name: "Origins, revised",
      declaredCardCount: 9,
      publishedOn: "2025-11-01T00:00:00",
    });

    const [rarity] = await db.select().from(rarities).where(eq(rarities.id, "Common"));
    expect(rarity).toMatchObject({ name: "Common, revised", sortOrder: 7 });

    const [kept] = await db.select().from(cardPrintings).where(eq(cardPrintings.id, "ogn-002"));
    expect(kept?.printedName).toBe("Kept Card, revised");
  });

  it("should leave a dropped domain, tag and keyword behind", async () => {
    await applyReferenceSeed(db, FIRST_SEED, "version-one");
    await applyReferenceSeed(
      db,
      { ...SECOND_SEED, keywords: [], cardKeywords: [], cardKeywordTargets: [] },
      "version-two",
    );

    expect(await db.select().from(keywords)).toHaveLength(0);
    expect(await db.select().from(domains)).toHaveLength(1);
    expect(await db.select().from(tags)).toHaveLength(1);
  });
});
