import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { match } from "ts-pattern";

import type { Card, CardId } from "@/features/catalog/card/card";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import type {
  CardListCriteria,
  CardNumericFilter,
  CardSearch,
  CardSort,
} from "@/features/catalog/card/card-list-criteria";
import { Page } from "@/shared/page";
import { throwIfAborted, type ReadOptions } from "@/shared/read-options";
import type { CardRepository } from "@/features/catalog/card/card-repository";
import {
  cardClassifications,
  cardDomains,
  cardMarketplaceReferences,
  cardMedia,
  cardTags,
  catalogCards,
} from "@/infrastructure/database/catalog-schema/cards";

import { toDomainCard, toDomainCardSummary } from "./card-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteCardRepository implements CardRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(id: CardId, { signal }: ReadOptions = {}): Promise<Card | null> {
    throwIfAborted(signal);
    const [row] = await this.db.select().from(catalogCards).where(eq(catalogCards.id, id)).limit(1);
    throwIfAborted(signal);
    if (!row) return null;

    return (await this.#toDomainCards([row], signal)).at(0) ?? null;
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
      .select()
      .from(catalogCards)
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
      .select({
        card: {
          id: catalogCards.id,
          name: catalogCards.name,
          orientation: catalogCards.orientation,
        },
        media: {
          imageAssetId: cardMedia.imageAssetId,
          imageHeight: cardMedia.imageHeight,
          imageWidth: cardMedia.imageWidth,
        },
      })
      .from(catalogCards)
      .innerJoin(cardMedia, eq(cardMedia.cardId, catalogCards.id))
      .where(and(...this.#conditionsFor(criteria)))
      .orderBy(...this.#orderBy(criteria))
      // Fetch one sentinel row beyond the page so its presence determines hasMore.
      .limit(limit + 1)
      .offset(offset);
    throwIfAborted(signal);
    const pageRows = rows.slice(0, limit);
    const domainsByCardId = await this.#domainRowsFor(
      pageRows.map((row) => row.card.id),
      signal,
    );

    return Page.create(
      pageRows.map((row) =>
        toDomainCardSummary({ ...row, domains: domainsByCardId.get(row.card.id) ?? [] }),
      ),
      rows.length > limit,
    );
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
      .where(inArray(cardDomains.cardId, [...cardIds]))
      .orderBy(asc(cardDomains.domainId));
    throwIfAborted(signal);

    return groupByCardId(rows);
  }

  #conditionsFor(criteria: CardListCriteria | undefined): SQL[] {
    if (!criteria) return [];

    const conditions: SQL[] = [];
    if (criteria.setCodes?.length) {
      conditions.push(inArray(catalogCards.setCode, criteria.setCodes));
    }
    if (criteria.typeIds?.length) {
      conditions.push(
        inArray(
          catalogCards.id,
          this.db
            .select({ cardId: cardClassifications.cardId })
            .from(cardClassifications)
            .where(inArray(cardClassifications.typeId, criteria.typeIds)),
        ),
      );
    }
    if (criteria.supertypeIds?.length) {
      conditions.push(
        inArray(
          catalogCards.id,
          this.db
            .select({ cardId: cardClassifications.cardId })
            .from(cardClassifications)
            .where(inArray(cardClassifications.supertypeId, criteria.supertypeIds)),
        ),
      );
    }
    if (criteria.rarityIds?.length) {
      conditions.push(
        inArray(
          catalogCards.id,
          this.db
            .select({ cardId: cardClassifications.cardId })
            .from(cardClassifications)
            .where(inArray(cardClassifications.rarityId, criteria.rarityIds)),
        ),
      );
    }
    if (criteria.domainIds?.length) {
      const domainIds = [...new Set(criteria.domainIds)];
      conditions.push(
        inArray(
          catalogCards.id,
          this.db
            .select({ cardId: cardDomains.cardId })
            .from(cardDomains)
            .where(inArray(cardDomains.domainId, domainIds))
            .groupBy(cardDomains.cardId)
            .having(sql`count(*) = ${domainIds.length}`),
        ),
      );
    }
    if (criteria.tagIds?.length) {
      const tagIds = [...new Set(criteria.tagIds)];
      conditions.push(
        inArray(
          catalogCards.id,
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
      conditions.push(this.#numericFilterCondition(catalogCards.energy, criteria.energy));
    if (criteria.might)
      conditions.push(this.#numericFilterCondition(catalogCards.might, criteria.might));
    if (criteria.power)
      conditions.push(this.#numericFilterCondition(catalogCards.power, criteria.power));
    if (criteria.search) {
      conditions.push(this.#searchCondition(criteria.search));
    }

    return conditions;
  }

  #searchCondition(search: CardSearch): SQL {
    const text = search.text.trim();
    if (!text) return sql`0 = 1`;

    const nameCondition = () =>
      or(
        sql`instr(lower(${catalogCards.name}), lower(${text})) > 0`,
        sql`instr(lower(${catalogCards.cleanName}), lower(${text})) > 0`,
      )!;
    const rulesTextCondition = () =>
      sql`instr(lower(${catalogCards.rulesTextPlain}), lower(${text})) > 0`;

    return match(search)
      .with({ type: "name" }, nameCondition)
      .with({ type: "rulesText" }, rulesTextCondition)
      .with({ type: "nameOrRulesText" }, () => or(nameCondition(), rulesTextCondition())!)
      .exhaustive();
  }

  #numericFilterCondition(
    column: typeof catalogCards.energy | typeof catalogCards.might | typeof catalogCards.power,
    filter: CardNumericFilter,
  ): SQL {
    return match(filter)
      .with({ type: "exact" }, ({ value }) => eq(column, value))
      .with({ type: "atLeast" }, ({ value }) => gte(column, value))
      .with({ type: "atMost" }, ({ value }) => lte(column, value))
      .with({ type: "between" }, ({ minimum, maximum }) =>
        // Drizzle permits an empty and(), but a between filter always supplies both bounds.
        and(gte(column, minimum), lte(column, maximum))!,
      )
      .exhaustive();
  }

  #orderBy(criteria: CardListCriteria | undefined): SQL[] {
    const catalogOrder = () => [
      asc(catalogCards.setCode),
      asc(catalogCards.collectorNumber),
      asc(catalogCards.id),
    ];
    const directionFor = (direction: "ascending" | "descending") =>
      direction === "ascending" ? asc : desc;
    const nullableOrder = (
      column: typeof catalogCards.energy | typeof catalogCards.might | typeof catalogCards.power,
      direction: "ascending" | "descending",
    ) => [asc(sql`case when ${column} is null then 1 else 0 end`), directionFor(direction)(column)];

    if (!criteria?.sort) return catalogOrder();

    return match<CardSort, SQL[]>(criteria.sort)
      .with({ type: "catalogOrder" }, catalogOrder)
      .with({ type: "name" }, ({ direction }) => [
        directionFor(direction)(sql`lower(${catalogCards.name})`),
      ])
      .with({ type: "energy" }, ({ direction }) => nullableOrder(catalogCards.energy, direction))
      .with({ type: "might" }, ({ direction }) => nullableOrder(catalogCards.might, direction))
      .with({ type: "power" }, ({ direction }) => nullableOrder(catalogCards.power, direction))
      .exhaustive()
      .concat(catalogOrder());
  }

  /**
   * Loads card aggregates and maps to domain cards. Need to think of a better name
   * */
  async #toDomainCards(
    rows: readonly (typeof catalogCards.$inferSelect)[],
    signal: AbortSignal | undefined,
  ): Promise<Card[]> {
    if (rows.length === 0) return [];

    const cardIds = rows.map((row) => row.id);
    // Batch each relation for this page. Otherwise 2 domains * 3 tags * 2 references would produce 12 rows per card in one join
    // and require additional processing for deduping. This is fine for now since we arent' performance limited.
    const [classifications, media, domainsByCardId, tags, marketplaceReferences] =
      await Promise.all([
        this.db
          .select()
          .from(cardClassifications)
          .where(inArray(cardClassifications.cardId, cardIds)),
        this.db.select().from(cardMedia).where(inArray(cardMedia.cardId, cardIds)),
        this.#domainRowsFor(cardIds, signal),
        this.db
          .select()
          .from(cardTags)
          .where(inArray(cardTags.cardId, cardIds))
          .orderBy(asc(cardTags.tagId)),
        this.db
          .select()
          .from(cardMarketplaceReferences)
          .where(inArray(cardMarketplaceReferences.cardId, cardIds))
          .orderBy(
            asc(cardMarketplaceReferences.marketplace),
            asc(cardMarketplaceReferences.externalId),
          ),
      ]);
    throwIfAborted(signal);
    const classificationsByCardId = new Map(classifications.map((row) => [row.cardId, row]));
    const mediaByCardId = new Map(media.map((row) => [row.cardId, row]));
    const tagsByCardId = groupByCardId(tags);
    const marketplaceReferencesByCardId = groupByCardId(marketplaceReferences);

    return rows.map((card) => {
      const classification = classificationsByCardId.get(card.id);
      const mediaRow = mediaByCardId.get(card.id);
      if (!classification || !mediaRow) {
        throw new Error(`Catalog card ${card.id} is missing required related data.`);
      }

      return toDomainCard({
        card,
        classification,
        media: mediaRow,
        domains: domainsByCardId.get(card.id) ?? [],
        tags: tagsByCardId.get(card.id) ?? [],
        marketplaceReferences: marketplaceReferencesByCardId.get(card.id) ?? [],
      });
    });
  }
}

function groupByCardId<Row extends { cardId: string }>(rows: readonly Row[]): Map<string, Row[]> {
  return rows.reduce((grouped, row) => {
    const group = grouped.get(row.cardId);
    if (group) group.push(row);
    else grouped.set(row.cardId, [row]);
    return grouped;
  }, new Map<string, Row[]>());
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
