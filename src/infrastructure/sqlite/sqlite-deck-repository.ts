import { asc, desc, eq, inArray } from "drizzle-orm";

import type { Deck, DeckId } from "@/features/deck/deck/deck";
import type { DeckRepository } from "@/features/deck/deck/deck-repository";
import { deckCards, decks } from "@/infrastructure/database/deck-schema/decks";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";

import { toDomainDeck } from "./deck-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteDeckRepository implements DeckRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(id: DeckId, { signal }: ReadOptions = {}): Promise<Deck | null> {
    throwIfAborted(signal);
    const [row] = await this.db.select().from(decks).where(eq(decks.id, id)).limit(1);
    throwIfAborted(signal);
    if (!row) return null;

    const cardsByDeckId = await this.#cardRowsFor([row.id], signal);

    return toDomainDeck({ deck: row, cards: cardsByDeckId.get(row.id) ?? [] });
  }

  async getAll({ signal }: ReadOptions = {}): Promise<readonly Deck[]> {
    throwIfAborted(signal);
    const rows = await this.db.select().from(decks).orderBy(desc(decks.updatedAt), asc(decks.id));
    throwIfAborted(signal);
    const cardsByDeckId = await this.#cardRowsFor(
      rows.map((row) => row.id),
      signal,
    );

    return rows.map((row) => toDomainDeck({ deck: row, cards: cardsByDeckId.get(row.id) ?? [] }));
  }

  /**
   * Replaces the stored deck wholesale. Entries are deleted and reinserted inside a transaction
   * rather than diffed: a deck is small, and an aggregate written in one step cannot be left
   * holding a card the caller removed.
   */
  async save(deck: Deck): Promise<void> {
    // The driver is synchronous, so the transaction body runs statements with `run()` rather than
    // awaiting them; an async callback here is rejected by the type system for that reason.
    this.db.transaction((tx) => {
      tx.insert(decks)
        .values({
          id: deck.id,
          name: deck.name,
          notes: deck.notes,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        })
        .onConflictDoUpdate({
          target: decks.id,
          set: { name: deck.name, notes: deck.notes, updatedAt: deck.updatedAt },
        })
        .run();
      tx.delete(deckCards).where(eq(deckCards.deckId, deck.id)).run();

      if (deck.entries.length > 0) {
        tx.insert(deckCards)
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
    });
  }

  /** Entries go with the deck through the schema's cascade. */
  async remove(id: DeckId): Promise<void> {
    await this.db.delete(decks).where(eq(decks.id, id));
  }

  /**
   * Entries are batched for the whole page and ordered so a deck maps to the same aggregate every
   * read. Section order is alphabetical rather than play order — presenting them is the UI's call.
   */
  async #cardRowsFor(
    deckIds: readonly DeckId[],
    signal: AbortSignal | undefined,
  ): Promise<Map<string, (typeof deckCards.$inferSelect)[]>> {
    if (deckIds.length === 0) return new Map();

    const rows = await this.db
      .select()
      .from(deckCards)
      .where(inArray(deckCards.deckId, [...deckIds]))
      .orderBy(asc(deckCards.section), asc(deckCards.cardRiftboundId));
    throwIfAborted(signal);

    return rows.reduce((grouped, row) => {
      const group = grouped.get(row.deckId);
      if (group) group.push(row);
      else grouped.set(row.deckId, [row]);
      return grouped;
    }, new Map<string, (typeof deckCards.$inferSelect)[]>());
  }
}

export { SqliteDeckRepository };
