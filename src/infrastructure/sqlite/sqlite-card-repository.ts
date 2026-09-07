import { and, asc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import type { Card, CardId } from "@/features/catalog/card/card";
import {
  normalizeCardDomainSelection,
  type CardDomainSelection,
} from "@/features/catalog/card/card-domain-selection";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
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
    criteria?: Pick<CardListCriteria, "limit" | "offset">,
    { signal }: ReadOptions = {},
  ): Promise<Page<CardSummary>> {
    return this.#getSummaryPageMatching(criteria, signal);
  }

  async getSummaryPageForDomains(
    domains: CardDomainSelection,
    criteria?: Pick<CardListCriteria, "limit" | "offset">,
    { signal }: ReadOptions = {},
  ): Promise<Page<CardSummary>> {
    return this.#getSummaryPageMatching(
      { ...criteria, domainIds: [...normalizeCardDomainSelection(domains)] },
      signal,
    );
  }

  async getSummaryPageByName(
    name: string,
    criteria?: Pick<CardListCriteria, "limit" | "offset">,
    { signal }: ReadOptions = {},
  ): Promise<Page<CardSummary>> {
    const search = name.trim();
    if (!search) return Page.empty();

    return this.#getSummaryPageMatching({ ...criteria, search }, signal, "name");
  }

  async getPage(criteria?: CardListCriteria, { signal }: ReadOptions = {}): Promise<Page<Card>> {
    throwIfAborted(signal);
    const { limit, offset } = pagination(criteria);
    const rows = await this.db
      .select()
      .from(catalogCards)
      .where(and(...this.#conditionsFor(criteria)))
      .orderBy(asc(catalogCards.setCode), asc(catalogCards.collectorNumber), asc(catalogCards.id))
      // Fetch one sentinel row beyond the page so its presence determines hasMore.
      .limit(limit + 1)
      .offset(offset);
    throwIfAborted(signal);
    const pageCards = await this.#toDomainCards(rows.slice(0, limit), signal);

    return Page.create(pageCards, rows.length > limit);
  }

  async getPageForDomains(
    domains: CardDomainSelection,
    criteria?: Pick<CardListCriteria, "limit" | "offset">,
    options: ReadOptions = {},
  ): Promise<Page<Card>> {
    return this.getPage(
      { ...criteria, domainIds: [...normalizeCardDomainSelection(domains)] },
      options,
    );
  }

  async #getSummaryPageMatching(
    criteria: CardListCriteria | Pick<CardListCriteria, "limit" | "offset"> | undefined,
    signal: AbortSignal | undefined,
    searchScope: "anyText" | "name" = "anyText",
  ): Promise<Page<CardSummary>> {
    throwIfAborted(signal);
    const { limit, offset } = pagination(criteria);

    const rows = await this.db
      .select({
        card: { id: catalogCards.id, name: catalogCards.name },
        media: {
          imageAssetId: cardMedia.imageAssetId,
          imageHeight: cardMedia.imageHeight,
          imageWidth: cardMedia.imageWidth,
        },
      })
      .from(catalogCards)
      .innerJoin(cardMedia, eq(cardMedia.cardId, catalogCards.id))
      .where(and(...this.#conditionsFor(criteria, searchScope)))
      .orderBy(asc(catalogCards.setCode), asc(catalogCards.collectorNumber), asc(catalogCards.id))
      // Fetch one sentinel row beyond the page so its presence determines hasMore.
      .limit(limit + 1)
      .offset(offset);
    throwIfAborted(signal);

    return Page.create(rows.slice(0, limit).map(toDomainCardSummary), rows.length > limit);
  }

  #conditionsFor(
    criteria: CardListCriteria | Pick<CardListCriteria, "limit" | "offset"> | undefined,
    searchScope: "anyText" | "name" = "anyText",
  ): SQL[] {
    if (!criteria) return [];

    const conditions: SQL[] = [];
    if ("setCodes" in criteria && criteria.setCodes?.length) {
      conditions.push(inArray(catalogCards.setCode, criteria.setCodes));
    }
    if ("typeIds" in criteria && criteria.typeIds?.length) {
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
    if ("supertypeIds" in criteria && criteria.supertypeIds?.length) {
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
    if ("rarityIds" in criteria && criteria.rarityIds?.length) {
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
    if ("domainIds" in criteria && criteria.domainIds?.length) {
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
    if ("tagIds" in criteria && criteria.tagIds?.length) {
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
    if ("search" in criteria && criteria.search) {
      conditions.push(
        or(
          sql`instr(lower(${catalogCards.name}), lower(${criteria.search})) > 0`,
          sql`instr(lower(${catalogCards.cleanName}), lower(${criteria.search})) > 0`,
          searchScope === "name"
            ? undefined
            : sql`instr(lower(${catalogCards.rulesTextPlain}), lower(${criteria.search})) > 0`,
        )!,
      );
    }

    return conditions;
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
    const [classifications, media, domains, tags, marketplaceReferences] = await Promise.all([
      this.db
        .select()
        .from(cardClassifications)
        .where(inArray(cardClassifications.cardId, cardIds)),
      this.db.select().from(cardMedia).where(inArray(cardMedia.cardId, cardIds)),
      this.db
        .select()
        .from(cardDomains)
        .where(inArray(cardDomains.cardId, cardIds))
        .orderBy(asc(cardDomains.domainId)),
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
    const domainsByCardId = groupByCardId(domains);
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
