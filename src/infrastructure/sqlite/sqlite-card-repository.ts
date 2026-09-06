import { asc, eq, inArray } from "drizzle-orm";

import type { Card, CardId } from "@/features/catalog/card/card";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import { Page } from "@/shared/page";
import type { CardRepository } from "@/features/catalog/card/card-repository";
import {
  cardClassifications,
  cardDomains,
  cardMarketplaceReferences,
  cardMedia,
  cardTags,
  catalogCards,
} from "@/infrastructure/database/schema";

import { toDomainCard } from "./card-mapper";
import type { SqliteDatabase } from "./sqlite-database";

class SqliteCardRepository implements CardRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async get(id: CardId): Promise<Card | null> {
    const [row] = await this.db.select().from(catalogCards).where(eq(catalogCards.id, id)).limit(1);
    if (!row) return null;

    return (await this.toDomainCards([row]))[0] ?? null;
  }

  async getPage(criteria?: CardListCriteria): Promise<Page<Card>> {
    const rows = await this.db
      .select()
      .from(catalogCards)
      .orderBy(asc(catalogCards.setCode), asc(catalogCards.collectorNumber), asc(catalogCards.id));
    const hydratedCards = await this.toDomainCards(rows);
    const matchingCards = criteria
      ? hydratedCards.filter((card) => matchesCriteria(card, criteria))
      : hydratedCards;

    const offset = criteria?.offset ?? 0;
    const limit = criteria?.limit ?? 10;
    const pageCards = matchingCards.slice(offset, offset + limit);

    return Page.create(pageCards, offset + pageCards.length < matchingCards.length);
  }

  private async toDomainCards(
    rows: readonly (typeof catalogCards.$inferSelect)[],
  ): Promise<Card[]> {
    if (rows.length === 0) return [];

    const cardIds = rows.map((row) => row.id);
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

function matchesCriteria(card: Card, criteria: CardListCriteria): boolean {
  if (criteria.setCodes && !criteria.setCodes.includes(card.setCode)) return false;
  if (criteria.typeIds && !criteria.typeIds.includes(card.classification.typeId)) return false;
  if (
    criteria.supertypeIds &&
    (!card.classification.supertypeId ||
      !criteria.supertypeIds.includes(card.classification.supertypeId))
  ) {
    return false;
  }
  if (criteria.rarityIds && !criteria.rarityIds.includes(card.classification.rarityId))
    return false;
  if (criteria.domainIds && !criteria.domainIds.every((id) => card.domainIds.includes(id)))
    return false;
  if (criteria.tagIds && !criteria.tagIds.every((id) => card.tagIds.includes(id))) return false;

  if (criteria.search) {
    const search = criteria.search.toLocaleLowerCase();
    const searchable = `${card.name} ${card.cleanName} ${card.rulesText.plain}`.toLocaleLowerCase();
    if (!searchable.includes(search)) return false;
  }

  return true;
}

export { SqliteCardRepository };
