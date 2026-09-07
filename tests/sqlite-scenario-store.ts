import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";

import type { Card } from "@/features/catalog/card/card";
import type { CardSet } from "@/features/catalog/set/card-set";
import type { Deck } from "@/features/deck/deck/deck";
import type { CatalogDataStore } from "@/infrastructure/database/catalog-data-store";
import type { DeckDataStore } from "@/infrastructure/database/deck-data-store";
import { deckCards, decks } from "@/infrastructure/database/deck-schema/decks";
import {
  cardClassifications,
  cardDomains,
  cardMarketplaceReferences,
  cardMedia,
  cardTags,
  catalogCards,
} from "@/infrastructure/database/catalog-schema/cards";
import { cardSets, setMarketplaceReferences } from "@/infrastructure/database/catalog-schema/sets";
import {
  cardSupertypes,
  cardTypes,
  domains,
  rarities,
  tags,
} from "@/infrastructure/database/catalog-schema/taxonomy";
import { SqliteCardRepository } from "@/infrastructure/sqlite/sqlite-card-repository";
import { SqliteDeckRepository } from "@/infrastructure/sqlite/sqlite-deck-repository";
import { SqliteSetRepository } from "@/infrastructure/sqlite/sqlite-set-repository";
import { parseImageUrl } from "@/shared/image-url";

/** The real engine and committed migrations, holding both catalog and deck tables. */
interface SqliteScenarioStore extends CatalogDataStore {
  readonly deckStore: DeckDataStore;
  close(): void;
  seedCard(card: Card): void;
  seedDeck(deck: Deck): void;
  seedSet(cardSet: CardSet): void;
}

function createSqliteScenarioStore(): SqliteScenarioStore {
  const client = new DatabaseSync(":memory:");
  client.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(client);

  const database = drizzle({ client });

  function seedSet(cardSet: CardSet): void {
    database
      .insert(cardSets)
      .values({
        code: cardSet.code,
        sourceId: cardSet.sourceId,
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

  function seedCard(card: Card): void {
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
      database.insert(tags).values({ id: tagId, name: tagId }).onConflictDoNothing().run();
    }

    database
      .insert(catalogCards)
      .values({
        id: card.id,
        riftboundId: card.riftboundId,
        setCode: card.setCode,
        collectorNumber: card.collectorNumber,
        name: card.name,
        cleanName: card.cleanName,
        energy: card.attributes.energy,
        might: card.attributes.might,
        power: card.attributes.power,
        rulesTextRich: card.rulesText.rich,
        rulesTextPlain: card.rulesText.plain,
        flavourText: card.rulesText.flavour,
        orientation: card.orientation,
        isAlternateArt: card.isAlternateArt,
        isOvernumbered: card.isOvernumbered,
        isSignature: card.isSignature,
        sourceUpdatedAt: card.sourceUpdatedAt,
      })
      .run();
    database
      .insert(cardClassifications)
      .values({
        cardId: card.id,
        typeId: card.classification.typeId,
        supertypeId: card.classification.supertypeId,
        rarityId: card.classification.rarityId,
      })
      .run();
    const image = parseImageUrl(card.imageUrl);
    database
      .insert(cardMedia)
      .values({
        cardId: card.id,
        imageAssetId: image.assetId,
        imageWidth: image.dimensions.width,
        imageHeight: image.dimensions.height,
        artist: null,
        accessibilityText: null,
      })
      .run();

    if (card.domainIds.length > 0) {
      database
        .insert(cardDomains)
        .values(card.domainIds.map((domainId) => ({ cardId: card.id, domainId })))
        .run();
    }
    if (card.tagIds.length > 0) {
      database
        .insert(cardTags)
        .values(card.tagIds.map((tagId) => ({ cardId: card.id, tagId })))
        .run();
    }
    if (card.marketplaceReferences.length > 0) {
      database
        .insert(cardMarketplaceReferences)
        .values(
          card.marketplaceReferences.map((reference) => ({
            cardId: card.id,
            marketplace: reference.marketplace,
            externalId: reference.externalId,
          })),
        )
        .run();
    }
  }

  function seedDeck(deck: Deck): void {
    database
      .insert(decks)
      .values({
        id: deck.id,
        name: deck.name,
        notes: deck.notes,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      })
      .run();

    if (deck.entries.length > 0) {
      database
        .insert(deckCards)
        .values(
          deck.entries.map((entry) => ({
            deckId: deck.id,
            section: entry.section,
            cardRiftboundId: entry.cardRiftboundId,
            quantity: entry.quantity,
          })),
        )
        .run();
    }
  }

  return {
    cards: new SqliteCardRepository(database),
    sets: new SqliteSetRepository(database),
    deckStore: { repository: new SqliteDeckRepository(database) },
    seedCard,
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

export { createSqliteScenarioStore };
export type { SqliteScenarioStore };
