import { DatabaseSync } from "node:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";

import {
  CORE_RULES_SEED_VERSION,
  coreRulesSeed,
} from "@/infrastructure/database/generated/core-rules-seed";
import {
  applyCatalogSeed,
  applyCoreRulesSeed,
  type CatalogSeed,
  type CoreRulesSeed,
} from "@/infrastructure/database/reference-seeder";
import {
  coreRuleDetails,
  coreRules,
  coreRulesEditions,
} from "@/infrastructure/database/reference-schema/core-rules";
import {
  catalogSeedStates,
  coreRulesSeedStates,
} from "@/infrastructure/database/reference-schema/seed-state";
import { applyMigrations } from "../sqlite-scenario-store";

const EMPTY_CATALOG_SEED: CatalogSeed = {
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

const REPLACEMENT_SEED: CoreRulesSeed = {
  coreRulesEditions: [
    { id: "2026-01-01", title: "Riftbound Core Rules", publishedOn: "2026-01-01" },
  ],
  coreRules: [
    { number: "100", parentNumber: null, position: 0, kind: "heading", body: "Game Concepts" },
    { number: "100.1", parentNumber: "100", position: 1, kind: "rule", body: "A later rule." },
  ],
  coreRuleDetails: [{ ruleNumber: "100.1", position: 0, kind: "bullet", body: "A bullet." }],
};

function createSeedTarget() {
  const client = new DatabaseSync(":memory:");
  client.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(client);
  return { client, db: drizzle({ client }) };
}

describe("core rules seeder", () => {
  let client: DatabaseSync;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    ({ client, db } = createSeedTarget());
  });

  afterEach(() => {
    client.close();
  });

  it("should fill an empty database from the bundled core rules", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, CORE_RULES_SEED_VERSION);

    expect(await db.select().from(coreRules)).toHaveLength(1364);
    expect(await db.select().from(coreRuleDetails)).toHaveLength(249);
    expect(await db.select().from(coreRulesEditions)).toHaveLength(1);
    expect(await db.select().from(coreRulesSeedStates)).toEqual([
      { id: "core-rules", version: CORE_RULES_SEED_VERSION },
    ]);
  });

  it("should do nothing on a second run at the same version", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, CORE_RULES_SEED_VERSION);
    await applyCoreRulesSeed(db, REPLACEMENT_SEED, CORE_RULES_SEED_VERSION);

    expect(await db.select().from(coreRules)).toHaveLength(1364);
    expect(await db.select().from(coreRuleDetails)).toHaveLength(249);
    expect(await db.select().from(coreRulesEditions)).toHaveLength(1);
  });

  it("should replace rather than duplicate when the version changes", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, "version-one");
    await applyCoreRulesSeed(db, coreRulesSeed, "version-two");

    expect(await db.select().from(coreRules)).toHaveLength(1364);
    expect(await db.select().from(coreRuleDetails)).toHaveLength(249);
    expect(await db.select().from(coreRulesEditions)).toHaveLength(1);
  });

  it("should leave nothing of the previous document behind", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, "version-one");
    await applyCoreRulesSeed(db, REPLACEMENT_SEED, "version-two");

    expect((await db.select().from(coreRules)).map((row) => row.number)).toEqual(["100", "100.1"]);
    expect(await db.select().from(coreRuleDetails)).toHaveLength(1);
    expect((await db.select().from(coreRulesEditions)).map((row) => row.id)).toEqual([
      "2026-01-01",
    ]);
    expect(await db.select().from(coreRulesSeedStates)).toEqual([
      { id: "core-rules", version: "version-two" },
    ]);
  });

  it("should leave every foreign key resolvable", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, CORE_RULES_SEED_VERSION);

    expect(client.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(
      client
        .prepare(
          "SELECT count(*) AS count FROM core_rule_detail d LEFT JOIN core_rule r ON r.number = d.rule_number WHERE r.number IS NULL",
        )
        .get(),
    ).toEqual({ count: 0 });
    expect(
      client
        .prepare(
          "SELECT count(*) AS count FROM core_rule c LEFT JOIN core_rule p ON p.number = c.parent_number WHERE c.parent_number IS NOT NULL AND p.number IS NULL",
        )
        .get(),
    ).toEqual({ count: 0 });
  });

  it("should leave the catalog's seed state alone when the core rules are reseeded", async () => {
    await applyCatalogSeed(db, EMPTY_CATALOG_SEED, "catalog-version-one");
    await applyCoreRulesSeed(db, coreRulesSeed, "version-one");
    await applyCoreRulesSeed(db, REPLACEMENT_SEED, "version-two");

    expect(
      await db.select().from(catalogSeedStates).where(eq(catalogSeedStates.id, "catalog")),
    ).toEqual([{ id: "catalog", version: "catalog-version-one" }]);
  });

  it("should leave the core rules' seed state and rows alone when the catalog is reseeded", async () => {
    await applyCoreRulesSeed(db, coreRulesSeed, CORE_RULES_SEED_VERSION);
    await applyCatalogSeed(db, EMPTY_CATALOG_SEED, "catalog-version-one");
    await applyCatalogSeed(db, EMPTY_CATALOG_SEED, "catalog-version-two");

    expect(await db.select().from(coreRulesSeedStates)).toEqual([
      { id: "core-rules", version: CORE_RULES_SEED_VERSION },
    ]);
    expect(await db.select().from(coreRules)).toHaveLength(1364);
    expect(await db.select().from(coreRuleDetails)).toHaveLength(249);
  });
});
