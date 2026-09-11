import { DatabaseSync } from "node:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";

import { deckCards, decks } from "@/infrastructure/database/deck-schema/decks";
import { cardMedia, cardPrintings, cards } from "@/infrastructure/database/reference-schema/cards";
import { cardSets } from "@/infrastructure/database/reference-schema/sets";
import { cardTypes, rarities } from "@/infrastructure/database/reference-schema/taxonomy";

import { applyMigrations } from "../sqlite-scenario-store";

function createDatabase() {
  const client = new DatabaseSync(":memory:");
  client.exec("PRAGMA foreign_keys = ON;");
  applyMigrations(client);

  return { client, db: drizzle({ client }) };
}

function seedCatalog(db: ReturnType<typeof drizzle>): void {
  db.insert(cardTypes).values({ id: "Unit", name: "Unit" }).run();
  db.insert(rarities).values({ id: "Common", name: "Common", sortOrder: 0 }).run();
  db.insert(cardSets)
    .values({
      code: "OGN",
      name: "Origins",
      declaredCardCount: 1,
      publishedOn: "2025-10-31T00:00:00",
    })
    .run();
  db.insert(cards)
    .values({
      id: "Ember Adept",
      cleanName: "Ember Adept",
      energy: 3,
      might: 2,
      power: null,
      rulesTextRich: "<p>Play effect.</p>",
      rulesTextPlain: "Play effect.",
      orientation: "portrait",
      typeId: "Unit",
      supertypeId: null,
      championName: null,
    })
    .run();
  db.insert(cardPrintings)
    .values({
      id: "ogn-014",
      cardId: "Ember Adept",
      riftboundId: "ogn-014-298",
      setCode: "OGN",
      collectorNumber: "014",
      poolCode: null,
      rarityId: "Common",
      printedName: "Ember Adept",
      finish: "standard",
      flavourText: null,
      sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
      isCanonical: true,
    })
    .run();
  db.insert(cardMedia)
    .values({
      printingId: "ogn-014",
      imageFile: "ogn-014.webp",
      artist: null,
      accessibilityText: null,
    })
    .run();
}

function seedDeck(db: ReturnType<typeof drizzle>, chosenChampionCardId: string | null): void {
  db.insert(decks)
    .values({
      id: "ember",
      name: "Ember Tempo",
      notes: "",
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T10:00:00.000Z",
      chosenChampionCardId,
    })
    .run();
  db.insert(deckCards)
    .values({
      deckId: "ember",
      section: "mainDeck",
      cardId: "Ember Adept",
      printingId: "ogn-014",
      quantity: 3,
    })
    .run();
}

describe("deck integrity", () => {
  let client: DatabaseSync;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    ({ client, db } = createDatabase());
    seedCatalog(db);
  });

  afterEach(() => {
    client.close();
  });

  it("should refuse to delete a printing a deck holds", () => {
    seedDeck(db, null);

    expect(() => db.delete(cardPrintings).where(eq(cardPrintings.id, "ogn-014")).run()).toThrow();
    expect(db.select().from(cardPrintings).all()).toHaveLength(1);
  });

  it("should refuse to delete a card a deck holds", () => {
    seedDeck(db, null);

    expect(() => db.delete(cards).where(eq(cards.id, "Ember Adept")).run()).toThrow();
    expect(db.select().from(cards).all()).toHaveLength(1);
  });

  it("should refuse to delete a card a deck has chosen as its champion", () => {
    db.insert(decks)
      .values({
        id: "ember",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
        chosenChampionCardId: "Ember Adept",
      })
      .run();

    expect(() => db.delete(cards).where(eq(cards.id, "Ember Adept")).run()).toThrow();
    expect(db.select().from(cards).all()).toHaveLength(1);
  });

  it("should refuse a deck entry naming a printing the catalog does not hold", () => {
    db.insert(decks)
      .values({
        id: "ember",
        name: "Ember Tempo",
        notes: "",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-01T10:00:00.000Z",
        chosenChampionCardId: null,
      })
      .run();

    expect(() =>
      db
        .insert(deckCards)
        .values({
          deckId: "ember",
          section: "mainDeck",
          cardId: "Ember Adept",
          printingId: "ogn-missing",
          quantity: 1,
        })
        .run(),
    ).toThrow();
  });

  it("should let a deck keep no chosen champion at all", () => {
    seedDeck(db, null);

    expect(db.select().from(decks).all()).toHaveLength(1);
  });

  it("should delete a deck and its entries without touching the catalog", () => {
    seedDeck(db, "Ember Adept");

    db.delete(decks).where(eq(decks.id, "ember")).run();

    expect(db.select().from(deckCards).all()).toHaveLength(0);
    expect(db.select().from(cardPrintings).all()).toHaveLength(1);
  });
});
