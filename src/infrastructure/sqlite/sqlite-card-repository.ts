import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  inArray,
  lte,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardId } from "@/features/card/value-objects/card-id";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CardSummary } from "@/features/card/card-summary";
import type {
  CardListCriteria,
  CardNumericFilter,
  CardSearch,
  CardSort,
} from "@/features/card/card-list-criteria";
import { chunked } from "@/shared/chunked";
import { Page } from "@/shared/page";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";
import type { CardRepository } from "@/features/card/card-repository";
import type { AnnotationSubjectKind } from "@/features/annotation/value-objects/annotation-subject";
import { bookmarks } from "@/infrastructure/database/annotation-schema/annotations";
import {
  cardDomains,
  cardMarketplaceReferences,
  cardMedia,
  cardPrintings,
  cardSpeeds,
  cardTags,
  cards,
} from "@/infrastructure/database/reference-schema/cards";
import { rarities, tags } from "@/infrastructure/database/reference-schema/taxonomy";
import {
  cardKeywordTargets,
  cardKeywords,
  keywords,
} from "@/infrastructure/database/reference-schema/keywords";

import { toDomainCard, toDomainCardSummary } from "./card-mapper";
import type { SqliteDatabase } from "./sqlite-database";

const PRINTING_ID_CHUNK_SIZE = 200;

const CARD_SUBJECT_KIND: AnnotationSubjectKind = "card";

const PRINTED_CARD_COLUMNS = {
  card: getTableColumns(cards),
  printing: getTableColumns(cardPrintings),
  rarity: { id: rarities.id, name: rarities.name },
};

const CARD_SUMMARY_COLUMNS = {
  card: { id: cards.id, orientation: cards.orientation },
  printing: {
    id: cardPrintings.id,
    riftboundId: cardPrintings.riftboundId,
    printedName: cardPrintings.printedName,
  },
  media: { imageFile: cardMedia.imageFile },
};

interface PrintedCardRow {
  readonly card: typeof cards.$inferSelect;
  readonly printing: typeof cardPrintings.$inferSelect;
  readonly rarity: { readonly id: string; readonly name: string };
}

interface CardSummaryRow {
  readonly card: { readonly id: string; readonly orientation: string };
  readonly media: { readonly imageFile: string } | null;
  readonly printing: {
    readonly id: string;
    readonly riftboundId: string;
    readonly printedName: string;
  };
}

class SqliteCardRepository implements CardRepository {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly imageBaseUrl: string,
  ) {}

  async get(printingId: PrintingId, { signal }: ReadOptions = {}): Promise<Card | null> {
    throwIfAborted(signal);
    const [row] = await this.db
      .select(PRINTED_CARD_COLUMNS)
      .from(cardPrintings)
      .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
      .innerJoin(rarities, eq(rarities.id, cardPrintings.rarityId))
      .where(eq(cardPrintings.id, printingId))
      .limit(1);
    throwIfAborted(signal);
    if (!row) return null;

    return (await this.#toDomainCards([row], signal)).at(0) ?? null;
  }

  async getByCardId(cardId: CardId, { signal }: ReadOptions = {}): Promise<Card | null> {
    throwIfAborted(signal);
    const [row] = await this.db
      .select(PRINTED_CARD_COLUMNS)
      .from(cardPrintings)
      .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
      .innerJoin(rarities, eq(rarities.id, cardPrintings.rarityId))
      .where(eq(cardPrintings.cardId, cardId))
      .orderBy(desc(cardPrintings.isCanonical), asc(cardPrintings.id))
      .limit(1);
    throwIfAborted(signal);
    if (!row) return null;

    return (await this.#toDomainCards([row], signal)).at(0) ?? null;
  }

  async getAllByPrintingIds(
    printingIds: readonly PrintingId[],
    { signal }: ReadOptions = {},
  ): Promise<readonly Card[]> {
    throwIfAborted(signal);
    const uniqueIds = [...new Set(printingIds)];
    const found: Card[] = [];

    for (const chunk of chunked(uniqueIds, PRINTING_ID_CHUNK_SIZE)) {
      const rows = await this.db
        .select(PRINTED_CARD_COLUMNS)
        .from(cardPrintings)
        .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
        .innerJoin(rarities, eq(rarities.id, cardPrintings.rarityId))
        .where(inArray(cardPrintings.id, chunk))
        .orderBy(...this.#orderBy(undefined));
      throwIfAborted(signal);
      found.push(...(await this.#toDomainCards(rows, signal)));
    }

    return found;
  }

  async getSummariesByPrintingIds(
    printingIds: readonly PrintingId[],
    { signal }: ReadOptions = {},
  ): Promise<readonly CardSummary[]> {
    throwIfAborted(signal);
    const found: CardSummary[] = [];

    for (const chunk of chunked([...new Set(printingIds)], PRINTING_ID_CHUNK_SIZE)) {
      const rows = await this.db
        .select(CARD_SUMMARY_COLUMNS)
        .from(cardPrintings)
        .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
        .leftJoin(cardMedia, eq(cardMedia.printingId, cardPrintings.id))
        .where(inArray(cardPrintings.id, chunk))
        .orderBy(...this.#orderBy(undefined));
      throwIfAborted(signal);
      found.push(...(await this.#toDomainCardSummaries(rows, signal)));
    }

    return found;
  }

  async count(criteria?: CardListCriteria, { signal }: ReadOptions = {}): Promise<number> {
    throwIfAborted(signal);
    const [row] = await this.db
      .select({ total: count() })
      .from(cardPrintings)
      .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
      .where(and(...this.#conditionsFor(criteria)));

    return row?.total ?? 0;
  }

  async getSummaryPage(
    criteria?: CardListCriteria,
    { signal }: ReadOptions = {},
  ): Promise<Page<CardSummary>> {
    return this.#getSummaryPageMatching(criteria, signal);
  }

  async getPage(criteria?: CardListCriteria, { signal }: ReadOptions = {}): Promise<Page<Card>> {
    throwIfAborted(signal);
    const { limit, offset } = pagination(criteria);
    const rows = await this.db
      .select(PRINTED_CARD_COLUMNS)
      .from(cardPrintings)
      .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
      .innerJoin(rarities, eq(rarities.id, cardPrintings.rarityId))
      .where(and(...this.#conditionsFor(criteria)))
      .orderBy(...this.#orderBy(criteria))
      // Fetch one sentinel row beyond the page so its presence determines hasMore.
      .limit(limit + 1)
      .offset(offset);
    throwIfAborted(signal);
    const pageCards = await this.#toDomainCards(rows.slice(0, limit), signal);

    return Page.create(pageCards, rows.length > limit);
  }

  async #getSummaryPageMatching(
    criteria: CardListCriteria | undefined,
    signal: AbortSignal | undefined,
  ): Promise<Page<CardSummary>> {
    throwIfAborted(signal);
    const { limit, offset } = pagination(criteria);

    const rows = await this.db
      .select(CARD_SUMMARY_COLUMNS)
      .from(cardPrintings)
      .innerJoin(cards, eq(cards.id, cardPrintings.cardId))
      .leftJoin(cardMedia, eq(cardMedia.printingId, cardPrintings.id))
      .where(and(...this.#conditionsFor(criteria)))
      .orderBy(...this.#orderBy(criteria))
      // Fetch one sentinel row beyond the page so its presence determines hasMore.
      .limit(limit + 1)
      .offset(offset);
    throwIfAborted(signal);

    return Page.create(
      await this.#toDomainCardSummaries(rows.slice(0, limit), signal),
      rows.length > limit,
    );
  }

  async #toDomainCardSummaries(
    rows: readonly CardSummaryRow[],
    signal: AbortSignal | undefined,
  ): Promise<CardSummary[]> {
    const domainsByCardId = await this.#domainRowsFor(
      rows.map((row) => row.card.id),
      signal,
    );

    return rows.map(({ card, media, printing }) => {
      if (!media) {
        throw new Error(`Catalog card ${printing.id} is missing required related data.`);
      }

      return toDomainCardSummary({
        card,
        printing,
        media,
        domains: domainsByCardId.get(card.id) ?? [],
        imageBaseUrl: this.imageBaseUrl,
      });
    });
  }

  /**
   * Domains are fetched as their own batch rather than joined onto the summary query: a card with
   * several domains would otherwise multiply its media row and need deduping back out again.
   */
  async #domainRowsFor(
    cardIds: readonly string[],
    signal: AbortSignal | undefined,
  ): Promise<Map<string, (typeof cardDomains.$inferSelect)[]>> {
    if (cardIds.length === 0) return new Map();

    const rows = await this.db
      .select()
      .from(cardDomains)
      .where(inArray(cardDomains.cardId, [...new Set(cardIds)]))
      .orderBy(asc(cardDomains.domainId));
    throwIfAborted(signal);

    return groupBy(rows, (row) => row.cardId);
  }

  async #targetRowsFor(
    keywordRows: readonly { readonly cardKeywordId: number }[],
    signal: AbortSignal | undefined,
  ): Promise<Map<number, (typeof cardKeywordTargets.$inferSelect)[]>> {
    if (keywordRows.length === 0) return new Map();

    const rows = await this.db
      .select()
      .from(cardKeywordTargets)
      .where(
        inArray(
          cardKeywordTargets.cardKeywordId,
          keywordRows.map((row) => row.cardKeywordId),
        ),
      )
      .orderBy(asc(cardKeywordTargets.targetKind), asc(cardKeywordTargets.allegiance));
    throwIfAborted(signal);

    return groupBy(rows, (row) => row.cardKeywordId);
  }

  #conditionsFor(criteria: CardListCriteria | undefined): SQL[] {
    if (!criteria) return [];

    const conditions: SQL[] = [];
    if (criteria.setCodes?.length) {
      conditions.push(inArray(cardPrintings.setCode, criteria.setCodes));
    }
    if (criteria.riftboundIds?.length) {
      conditions.push(inArray(cardPrintings.riftboundId, [...new Set(criteria.riftboundIds)]));
    }
    if (criteria.typeIds?.length) {
      conditions.push(inArray(cards.typeId, criteria.typeIds));
    }
    if (criteria.supertypeIds?.length) {
      conditions.push(inArray(cards.supertypeId, criteria.supertypeIds));
    }
    if (criteria.rarityIds?.length) {
      conditions.push(inArray(cardPrintings.rarityId, criteria.rarityIds));
    }
    if (criteria.domainIds?.length) {
      const domainIds = [...new Set(criteria.domainIds)];
      conditions.push(
        inArray(
          cards.id,
          this.db
            .select({ cardId: cardDomains.cardId })
            .from(cardDomains)
            .where(inArray(cardDomains.domainId, domainIds))
            .groupBy(cardDomains.cardId)
            .having(sql`count(*) = ${domainIds.length}`),
        ),
      );
    }
    if (criteria.anyDomainIds?.length) {
      conditions.push(
        inArray(
          cards.id,
          this.db
            .select({ cardId: cardDomains.cardId })
            .from(cardDomains)
            .where(inArray(cardDomains.domainId, [...new Set(criteria.anyDomainIds)])),
        ),
      );
    }
    if (criteria.withinDomainIds?.length) {
      conditions.push(
        notInArray(
          cards.id,
          this.db
            .select({ cardId: cardDomains.cardId })
            .from(cardDomains)
            .where(notInArray(cardDomains.domainId, [...new Set(criteria.withinDomainIds)])),
        ),
      );
    }
    if (criteria.keywordIds?.length) {
      conditions.push(
        exists(
          this.db
            .select({ matched: sql`1` })
            .from(cardKeywords)
            .where(
              and(
                eq(cardKeywords.cardId, cards.id),
                inArray(cardKeywords.keywordId, [...new Set(criteria.keywordIds)]),
              ),
            ),
        ),
      );
    }
    if (criteria.onlyBookmarked) {
      conditions.push(
        exists(
          this.db
            .select({ matched: sql`1` })
            .from(bookmarks)
            .where(
              and(
                eq(bookmarks.subjectKind, CARD_SUBJECT_KIND),
                eq(bookmarks.subjectId, cardPrintings.id),
              ),
            ),
        ),
      );
    }
    if (criteria.championNames?.length) {
      conditions.push(inArray(cards.championName, [...new Set(criteria.championNames)]));
    }
    if (criteria.tagIds?.length) {
      const tagIds = [...new Set(criteria.tagIds)];
      conditions.push(
        inArray(
          cards.id,
          this.db
            .select({ cardId: cardTags.cardId })
            .from(cardTags)
            .where(inArray(cardTags.tagId, tagIds))
            .groupBy(cardTags.cardId)
            .having(sql`count(*) = ${tagIds.length}`),
        ),
      );
    }
    if (criteria.energy)
      conditions.push(...this.#numericFilterConditions(cards.energy, criteria.energy));
    if (criteria.might)
      conditions.push(...this.#numericFilterConditions(cards.might, criteria.might));
    if (criteria.power)
      conditions.push(...this.#numericFilterConditions(cards.power, criteria.power));
    if (criteria.search) {
      conditions.push(this.#searchCondition(criteria.search));
    }

    return conditions;
  }

  #searchCondition(search: CardSearch): SQL {
    const text = search.text.trim();
    if (!text) return sql`0 = 1`;

    const contains = (column: SQLiteColumn) => sql`instr(lower(${column}), lower(${text})) > 0`;
    const nameCondition = sql`(${contains(cards.id)} or ${contains(cards.cleanName)} or ${contains(
      cardPrintings.printedName,
    )})`;
    const rulesTextCondition = contains(cards.rulesTextPlain);

    return match<CardSearch, SQL>(search)
      .with({ type: "name" }, () => nameCondition)
      .with({ type: "rulesText" }, () => rulesTextCondition)
      .with({ type: "nameOrRulesText" }, () => sql`(${nameCondition} or ${rulesTextCondition})`)
      .exhaustive();
  }

  #numericFilterConditions(
    column: typeof cards.energy | typeof cards.might | typeof cards.power,
    filter: CardNumericFilter,
  ): readonly SQL[] {
    return match<CardNumericFilter, readonly SQL[]>(filter)
      .with({ type: "exact" }, ({ value }) => [eq(column, value)])
      .with({ type: "atLeast" }, ({ value }) => [gte(column, value)])
      .with({ type: "atMost" }, ({ value }) => [lte(column, value)])
      .with({ type: "between" }, ({ minimum, maximum }) => [
        gte(column, minimum),
        lte(column, maximum),
      ])
      .exhaustive();
  }

  #orderBy(criteria: CardListCriteria | undefined): SQL[] {
    const catalogOrder = () => [
      asc(cardPrintings.setCode),
      asc(sql`cast(${cardPrintings.collectorNumber} as integer)`),
      asc(cardPrintings.collectorNumber),
      asc(cardPrintings.id),
    ];
    const directionFor = (direction: "ascending" | "descending") =>
      direction === "ascending" ? asc : desc;
    const nullableOrder = (
      column: typeof cards.energy | typeof cards.might | typeof cards.power,
      direction: "ascending" | "descending",
    ) => [asc(sql`case when ${column} is null then 1 else 0 end`), directionFor(direction)(column)];

    if (!criteria?.sort) return catalogOrder();

    const distinguishingTerms = match<CardSort, SQL[]>(criteria.sort)
      .with({ type: "catalogOrder" }, () => [])
      .with({ type: "name" }, ({ direction }) => [directionFor(direction)(sql`lower(${cards.id})`)])
      .with({ type: "energy" }, ({ direction }) => nullableOrder(cards.energy, direction))
      .with({ type: "might" }, ({ direction }) => nullableOrder(cards.might, direction))
      .with({ type: "power" }, ({ direction }) => nullableOrder(cards.power, direction))
      .exhaustive();

    return distinguishingTerms.concat(catalogOrder());
  }

  /**
   * Loads card aggregates and maps to domain cards. Need to think of a better name
   * */
  async #toDomainCards(
    rows: readonly PrintedCardRow[],
    signal: AbortSignal | undefined,
  ): Promise<Card[]> {
    if (rows.length === 0) return [];

    const printingIds = rows.map((row) => row.printing.id);
    const cardIds = [...new Set(rows.map((row) => row.card.id))];
    // Batch each relation for this page. Otherwise 2 domains * 3 tags * 2 references would produce 12 rows per card in one join
    // and require additional processing for deduping. This is fine for now since we arent' performance limited.
    const [media, speeds, cardKeywordRows, domainsByCardId, tagRows, marketplaceReferences] =
      await Promise.all([
        this.db.select().from(cardMedia).where(inArray(cardMedia.printingId, printingIds)),
        this.db
          .select()
          .from(cardSpeeds)
          .where(inArray(cardSpeeds.cardId, cardIds))
          .orderBy(asc(cardSpeeds.speed)),
        this.db
          .select({
            cardKeywordId: cardKeywords.id,
            cardId: cardKeywords.cardId,
            id: cardKeywords.keywordId,
            name: keywords.name,
            value: cardKeywords.value,
          })
          .from(cardKeywords)
          .innerJoin(keywords, eq(keywords.id, cardKeywords.keywordId))
          .where(inArray(cardKeywords.cardId, cardIds))
          .orderBy(asc(keywords.name), asc(cardKeywords.id)),
        this.#domainRowsFor(cardIds, signal),
        this.db
          .select({ cardId: cardTags.cardId, id: tags.id, name: tags.name })
          .from(cardTags)
          .innerJoin(tags, eq(tags.id, cardTags.tagId))
          .where(inArray(cardTags.cardId, cardIds))
          .orderBy(asc(tags.name)),
        this.db
          .select()
          .from(cardMarketplaceReferences)
          .where(inArray(cardMarketplaceReferences.printingId, printingIds))
          .orderBy(
            asc(cardMarketplaceReferences.marketplace),
            asc(cardMarketplaceReferences.externalId),
          ),
      ]);
    throwIfAborted(signal);
    const targetsByCardKeywordId = await this.#targetRowsFor(cardKeywordRows, signal);
    const mediaByPrintingId = new Map(media.map((row) => [row.printingId, row]));
    const speedsByCardId = groupBy(speeds, (row) => row.cardId);
    const keywordsByCardId = groupBy(
      cardKeywordRows.map((row) => ({
        ...row,
        targets: targetsByCardKeywordId.get(row.cardKeywordId) ?? [],
      })),
      (row) => row.cardId,
    );
    const tagsByCardId = groupBy(tagRows, (row) => row.cardId);
    const marketplaceReferencesByPrintingId = groupBy(
      marketplaceReferences,
      (row) => row.printingId,
    );

    return rows.map(({ card, printing, rarity }) => {
      const mediaRow = mediaByPrintingId.get(printing.id);
      if (!mediaRow) {
        throw new Error(`Catalog card ${printing.id} is missing required related data.`);
      }

      return toDomainCard({
        card,
        printing,
        rarity,
        media: mediaRow,
        imageBaseUrl: this.imageBaseUrl,
        speeds: speedsByCardId.get(card.id) ?? [],
        keywords: keywordsByCardId.get(card.id) ?? [],
        domains: domainsByCardId.get(card.id) ?? [],
        tags: tagsByCardId.get(card.id) ?? [],
        marketplaceReferences: marketplaceReferencesByPrintingId.get(printing.id) ?? [],
      });
    });
  }
}

function groupBy<Row, Key>(rows: readonly Row[], keyOf: (row: Row) => Key): Map<Key, Row[]> {
  return rows.reduce((grouped, row) => {
    const key = keyOf(row);
    const group = grouped.get(key);
    if (group) group.push(row);
    else grouped.set(key, [row]);
    return grouped;
  }, new Map<Key, Row[]>());
}

function pagination(criteria: Pick<CardListCriteria, "limit" | "offset"> | undefined): {
  readonly limit: number;
  readonly offset: number;
} {
  return {
    limit: criteria?.limit ?? 10,
    offset: criteria?.offset ?? 0,
  };
}

export { SqliteCardRepository };
