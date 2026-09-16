import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";

import type { Card } from "@/features/card/card";
import type { CardSet } from "@/features/set/card-set";
import type { Deck } from "@/features/deck/deck/deck";
import type { AnnotationDataStore } from "@/infrastructure/database/annotation-data-store";
import type { ReferenceDataStore } from "@/infrastructure/database/reference-data-store";
import type { DeckDataStore } from "@/infrastructure/database/deck-data-store";
import { applyCoreRulesSeed, type CoreRulesSeed } from "@/infrastructure/database/reference-seeder";
import {
  cardKeywordTargets,
  cardKeywords,
  keywords,
} from "@/infrastructure/database/reference-schema/keywords";
import { deckCards, decks } from "@/infrastructure/database/deck-schema/decks";
import {
  cardDomains,
  cardMarketplaceReferences,
  cardImageSources,
  cardMedia,
  cardPrintings,
  cardSpeeds,
  cardTags,
  cards,
} from "@/infrastructure/database/reference-schema/cards";
import {
  cardSets,
  setMarketplaceReferences,
} from "@/infrastructure/database/reference-schema/sets";
import {
  cardSupertypes,
  cardTypes,
  domains,
  rarities,
  tags,
} from "@/infrastructure/database/reference-schema/taxonomy";
import { SqliteBookmarkRepository } from "@/infrastructure/sqlite/sqlite-bookmark-repository";
import { SqliteCardRepository } from "@/infrastructure/sqlite/sqlite-card-repository";
import { SqliteCoreRulesRepository } from "@/infrastructure/sqlite/sqlite-core-rules-repository";
import { SqliteDeckRepository } from "@/infrastructure/sqlite/sqlite-deck-repository";
import { SqliteKeywordRepository } from "@/infrastructure/sqlite/sqlite-keyword-repository";
import { SqliteNoteRepository } from "@/infrastructure/sqlite/sqlite-note-repository";
import { SqliteSetRepository } from "@/infrastructure/sqlite/sqlite-set-repository";

/** The real engine and committed migrations, holding the catalog, deck and annotation tables. */
interface SqliteScenarioStore extends ReferenceDataStore {
  readonly annotationStore: AnnotationDataStore;
  readonly deckStore: DeckDataStore;
  /** Every statement drizzle ran, so a test can prove a filter reached SQL. */
  readonly executedSql: readonly string[];
  close(): void;
  removeCardMedia(printingId: string): void;
  seedCard(card: Card): void;
  seedCoreRules(seed: CoreRulesSeed): Promise<void>;
  seedDeck(deck: Deck): void;
  seedSet(cardSet: CardSet): void;
}

const TEST_IMAGE_BASE_URL = "http://localhost:8787";
const CORE_RULES_TEST_VERSION = "scenario";

function createSqliteScenarioStore(): SqliteScenarioStore {
  const client = new DatabaseSync(":memory:");
  client.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(client);

  const executedSql: string[] = [];
  const database = drizzle({
    client,
    logger: { logQuery: (query: string) => executedSql.push(query) },
  });
  const seededCardIds = new Set<string>();
  const seededPrintingIds = new Set<string>();
  const seededSetCodes = new Set<string>();
  let nextCardKeywordId = 1;

  function seedSet(cardSet: CardSet): void {
    if (seededSetCodes.has(cardSet.code)) return;
    seededSetCodes.add(cardSet.code);
    database
      .insert(cardSets)
      .values({
        code: cardSet.code,
        name: cardSet.name,
        declaredCardCount: cardSet.declaredCardCount,
        publishedOn: cardSet.publishedOn,
      })
      .run();

    if (cardSet.marketplaceReferences.length > 0) {
      database
        .insert(setMarketplaceReferences)
        .values(
          cardSet.marketplaceReferences.map((reference) => ({
            setCode: cardSet.code,
            marketplace: reference.marketplace,
            externalId: reference.externalId,
          })),
        )
        .run();
    }
  }

  async function seedCoreRules(seed: CoreRulesSeed): Promise<void> {
    await applyCoreRulesSeed(database, seed, CORE_RULES_TEST_VERSION);
  }

  function seedCard(card: Card): void {
    if (seededPrintingIds.has(card.printingId)) return;
    seededPrintingIds.add(card.printingId);
    database
      .insert(cardTypes)
      .values({ id: card.classification.typeId, name: card.classification.typeId })
      .onConflictDoNothing()
      .run();
    database
      .insert(rarities)
      .values({
        id: card.classification.rarityId,
        name: card.classification.rarityId,
        sortOrder: 0,
      })
      .onConflictDoNothing()
      .run();
    if (card.classification.supertypeId) {
      database
        .insert(cardSupertypes)
        .values({ id: card.classification.supertypeId, name: card.classification.supertypeId })
        .onConflictDoNothing()
        .run();
    }
    for (const domainId of card.domainIds) {
      database.insert(domains).values({ id: domainId, name: domainId }).onConflictDoNothing().run();
    }
    for (const tagId of card.tagIds) {
      database
        .insert(tags)
        .values({ id: tagId, name: tagId, kind: "trait" })
        .onConflictDoNothing()
        .run();
    }

    if (!seededCardIds.has(card.cardId)) {
      seededCardIds.add(card.cardId);
      seedCardIdentity(card);
    }

    database
      .insert(cardPrintings)
      .values({
        id: card.printingId,
        cardId: card.cardId,
        riftboundId: card.riftboundId,
        setCode: card.setCode,
        collectorNumber: card.collectorNumber,
        poolCode: null,
        rarityId: card.classification.rarityId,
        printedName: card.name,
        finish: card.finish,
        flavourText: card.rulesText.flavour,
        sourceUpdatedAt: card.sourceUpdatedAt,
        isCanonical: true,
      })
      .run();
    database
      .insert(cardMedia)
      .values({
        printingId: card.printingId,
        imageFile: `${card.riftboundId}.webp`,
        artist: null,
        accessibilityText: null,
      })
      .run();
    database
      .insert(cardImageSources)
      .values({ printingId: card.printingId, url: card.imageUrl, priority: 0 })
      .run();
    if (card.marketplaceReferences.length > 0) {
      database
        .insert(cardMarketplaceReferences)
        .values(
          card.marketplaceReferences.map((reference) => ({
            printingId: card.printingId,
            marketplace: reference.marketplace,
            externalId: reference.externalId,
          })),
        )
        .run();
    }
  }

  function seedCardIdentity(card: Card): void {
    database
      .insert(cards)
      .values({
        id: card.cardId,
        cleanName: card.cleanName,
        energy: card.attributes.energy,
        might: card.attributes.might,
        power: card.attributes.power,
        rulesTextRich: card.rulesText.rich,
        rulesTextPlain: card.rulesText.plain,
        orientation: card.orientation,
        typeId: card.classification.typeId,
        supertypeId: card.classification.supertypeId,
        championName: card.championName,
      })
      .run();
    for (const keyword of card.keywords) {
      database
        .insert(keywords)
        .values({ id: keyword.id, name: keyword.name })
        .onConflictDoNothing()
        .run();
      const cardKeywordId = nextCardKeywordId;
      nextCardKeywordId += 1;
      database
        .insert(cardKeywords)
        .values({
          id: cardKeywordId,
          cardId: card.cardId,
          keywordId: keyword.id,
          value: keyword.value,
        })
        .run();
      if (keyword.targets.length > 0) {
        database
          .insert(cardKeywordTargets)
          .values(
            keyword.targets.map((target) => ({
              cardKeywordId,
              targetKind: target.kind,
              targetIsToken: target.isToken,
              allegiance: target.allegiance,
            })),
          )
          .run();
      }
    }
    if (card.speeds.length > 0) {
      database
        .insert(cardSpeeds)
        .values(card.speeds.map((speed) => ({ cardId: card.cardId, speed })))
        .run();
    }

    if (card.domainIds.length > 0) {
      database
        .insert(cardDomains)
        .values(card.domainIds.map((domainId) => ({ cardId: card.cardId, domainId })))
        .run();
    }
    if (card.tagIds.length > 0) {
      database
        .insert(cardTags)
        .values(card.tagIds.map((tagId) => ({ cardId: card.cardId, tagId })))
        .run();
    }
  }

  function seedDeck(deck: Deck): void {
    database
      .insert(decks)
      .values({
        id: deck.id,
        name: deck.name,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        chosenChampionCardId: deck.chosenChampionCardId,
      })
      .run();

    if (deck.entries.length > 0) {
      database
        .insert(deckCards)
        .values(
          deck.entries.map((entry) => ({
            deckId: deck.id,
            section: entry.section,
            cardId: entry.cardId,
            printingId: entry.printingId,
            quantity: entry.quantity,
          })),
        )
        .run();
    }
  }

  function removeCardMedia(printingId: string): void {
    database.delete(cardMedia).where(eq(cardMedia.printingId, printingId)).run();
  }

  return {
    annotationStore: {
      bookmarks: new SqliteBookmarkRepository(database),
      notes: new SqliteNoteRepository(database),
    },
    cards: new SqliteCardRepository(database, TEST_IMAGE_BASE_URL),
    coreRules: new SqliteCoreRulesRepository(database),
    keywords: new SqliteKeywordRepository(database),
    sets: new SqliteSetRepository(database),
    deckStore: { repository: new SqliteDeckRepository(database) },
    executedSql,
    removeCardMedia,
    seedCard,
    seedCoreRules,
    seedDeck,
    seedSet,
    close: () => client.close(),
  };
}

function applyMigrations(client: DatabaseSync): void {
  const migrationsDirectory = join(process.cwd(), "drizzle");
  const migrationDirectories = readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const directory of migrationDirectories) {
    const migrationPath = join(migrationsDirectory, directory, "migration.sql");
    client.exec(readFileSync(migrationPath, "utf8"));
  }
}

export { applyMigrations, createSqliteScenarioStore };
export type { SqliteScenarioStore };
