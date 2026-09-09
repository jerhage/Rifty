import { match } from "ts-pattern";
import { z } from "zod/v4";
import { cardDomainSchema } from "../src/features/catalog/value-objects/card-domain";
import { cardTypeSchema } from "../src/features/catalog/value-objects/card-type";
import {
  cardSpeeds,
  championName,
  identityName,
  keywordOccurrences,
  keywordsWithMagnitude,
  ownedKeywords,
  printingIdentity,
  withMagnitudeDefaults,
} from "./card-derivation";
import type { KeywordOccurrence, KeywordTarget } from "./card-derivation";
import { imageSourcesOf } from "./card-image-file";
import type { SourcedCard } from "./card-image-file";

import {
  cardClassificationInsertSchema,
  cardDomainInsertSchema,
  cardImageSourceInsertSchema,
  cardMarketplaceReferenceInsertSchema,
  cardMediaInsertSchema,
  cardSpeedInsertSchema,
  cardTagInsertSchema,
  catalogCardInsertSchema,
} from "../src/infrastructure/database/catalog-schema/cards";
import {
  cardKeywordInsertSchema,
  cardKeywordTargetInsertSchema,
  keywordInsertSchema,
} from "../src/infrastructure/database/catalog-schema/keywords";
import {
  cardSetInsertSchema,
  setMarketplaceReferenceInsertSchema,
} from "../src/infrastructure/database/catalog-schema/sets";
import {
  cardSupertypeInsertSchema,
  cardTypeInsertSchema,
  domainInsertSchema,
  rarityInsertSchema,
  tagInsertSchema,
} from "../src/infrastructure/database/catalog-schema/taxonomy";
import type {
  cardClassifications,
  cardDomains,
  cardImageSources,
  cardMarketplaceReferences,
  cardMedia,
  cardSpeeds as cardSpeedTable,
  cardTags,
  catalogCards,
} from "../src/infrastructure/database/catalog-schema/cards";
import type {
  cardKeywordTargets,
  cardKeywords,
  keywords,
} from "../src/infrastructure/database/catalog-schema/keywords";
import type {
  cardSets,
  setMarketplaceReferences,
} from "../src/infrastructure/database/catalog-schema/sets";
import type {
  cardSupertypes,
  cardTypes,
  domains,
  rarities,
  tags,
} from "../src/infrastructure/database/catalog-schema/taxonomy";

const nullableString = z.string().nullish();
const nullableInteger = z.number().int().nullish();
const marketplaceId = z.union([z.string(), z.array(z.string())]).nullish();
const orientationSchema = z.enum(["landscape", "portrait"]);
const rawSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  set_id: z.string(),
  card_count: z.number().int(),
  tcgplayer_id: marketplaceId,
  cardmarket_id: marketplaceId,
  published_on: z.string(),
});
const rawCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  riftbound_id: z.string(),
  collector_number: z.number().int(),
  tcgplayer_id: marketplaceId,
  cardmarket_id: marketplaceId,
  attributes: z.object({
    energy: z.number().int().nullable(),
    might: z.number().int().nullable(),
    power: z.number().int().nullable(),
  }),
  classification: z.object({
    type: cardTypeSchema,
    supertype: nullableString,
    rarity: z.string(),
    domain: z.array(cardDomainSchema),
  }),
  text: z.object({ rich: z.string(), plain: z.string(), flavour: nullableString }),
  set: z.object({ set_id: z.string(), label: z.string() }),
  media: z.object({
    image_url: z.string(),
    artist: nullableString,
    accessibility_text: nullableString,
  }),
  tags: z.array(z.string()),
  orientation: orientationSchema,
  metadata: z.object({
    clean_name: nullableString,
    updated_on: z.string(),
    alternate_art: z.boolean(),
    overnumbered: z.boolean(),
    signature: z.boolean(),
  }),
});
const apiCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  cardType: z.string(),
  supertype: nullableString,
  rarity: z.string(),
  domain: z.array(cardDomainSchema),
  tags: z.array(z.string()),
  regions: z.array(z.string()),
  champion: nullableString,
  setCode: z.string(),
  number: z.string(),
  riftboundId: z.string(),
  artist: nullableString,
  imageUrl: z.string(),
  imageSourceUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  cost: nullableInteger,
  might: nullableInteger,
  power: nullableInteger,
  text: nullableString,
  textRich: nullableString,
  flavor: nullableString,
  orientation: orientationSchema,
  alternateArt: z.boolean(),
  signature: z.boolean(),
  raw: z.unknown().optional(),
});
const rawImageSchema = z.object({ media: z.object({ image_url: nullableString }) });
const RARITY_ORDER = ["Common", "Uncommon", "Rare", "Epic", "Showcase", "Promo"];
const KEYWORD_REMINDER = /\[([^\]]+)\]\s*_?\(([^)]*)\)/g;
const DERIVED_SOURCE = "derived";
const LEADING_DIGITS = /(\d+)/;
const REPORTED_SAMPLE = 5;
type RawCard = z.output<typeof rawCardSchema>;
type RawSet = z.output<typeof rawSetSchema>;
type ApiCard = z.output<typeof apiCardSchema>;
type FetchedCard = { card: ApiCard; fetchedAt: string };
type Taxonomy = typeof cardTypes.$inferInsert;
type Marketplace = "cardmarket" | "tcgplayer";
type MarketplaceReference = { marketplace: Marketplace; externalId: string };
type NormalizedCard = {
  id: string;
  riftboundId: string;
  setCode: string;
  collectorNumber: number;
  name: string;
  cleanName: string;
  energy: number | null;
  might: number | null;
  power: number | null;
  rulesTextRich: string;
  rulesTextPlain: string;
  flavourText: string | null;
  orientation: z.output<typeof orientationSchema>;
  isAlternateArt: boolean;
  isOvernumbered: boolean;
  isSignature: boolean;
  poolCode: string | null;
  championName: string | null;
  identityName: string;
  sourceUpdatedAt: string;
  typeId: string;
  supertypeId: string | null;
  rarityId: string;
  domainIds: readonly string[];
  tagIds: readonly string[];
  regions: readonly string[];
  imageSources: readonly string[];
  artist: string | null;
  accessibilityText: string | null;
  marketplaceReferences: readonly MarketplaceReference[];
};
type CardCore = Omit<
  NormalizedCard,
  | "championName"
  | "collectorNumber"
  | "id"
  | "identityName"
  | "imageSources"
  | "isOvernumbered"
  | "isSignature"
  | "poolCode"
  | "regions"
  | "riftboundId"
>;
type Seed = {
  cardSets: (typeof cardSets.$inferInsert)[];
  setMarketplaceReferences: (typeof setMarketplaceReferences.$inferInsert)[];
  cardTypes: (typeof cardTypes.$inferInsert)[];
  cardSupertypes: (typeof cardSupertypes.$inferInsert)[];
  rarities: (typeof rarities.$inferInsert)[];
  domains: (typeof domains.$inferInsert)[];
  tags: (typeof tags.$inferInsert)[];
  keywords: (typeof keywords.$inferInsert)[];
  catalogCards: (typeof catalogCards.$inferInsert)[];
  cardMarketplaceReferences: (typeof cardMarketplaceReferences.$inferInsert)[];
  cardMedia: (typeof cardMedia.$inferInsert)[];
  cardImageSources: (typeof cardImageSources.$inferInsert)[];
  cardClassifications: (typeof cardClassifications.$inferInsert)[];
  cardDomains: (typeof cardDomains.$inferInsert)[];
  cardTags: (typeof cardTags.$inferInsert)[];
  cardKeywords: (typeof cardKeywords.$inferInsert)[];
  cardKeywordTargets: (typeof cardKeywordTargets.$inferInsert)[];
  cardSpeeds: (typeof cardSpeedTable.$inferInsert)[];
};
type BuiltSeed = {
  readonly seed: Seed;
  readonly skipped: readonly NormalizedCard[];
};

function assertUnique<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string,
  label: string,
): void {
  const seen = new Set<string>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key || seen.has(key))
      throw new Error(`Duplicate or missing ${label}: ${key || "<missing>"}.`);
    seen.add(key);
  }
}

function dedupeById(fetched: readonly FetchedCard[]): FetchedCard[] {
  const byId = new Map<string, FetchedCard>();

  for (const entry of fetched) if (!byId.has(entry.card.id)) byId.set(entry.card.id, entry);

  return [...byId.values()];
}

function imageCardOf(card: ApiCard): SourcedCard {
  const raw = rawImageSchema.safeParse(card.raw);

  return {
    id: card.id,
    riftboundId: card.riftboundId,
    imageUrl: card.imageUrl,
    imageSourceUrl: card.imageSourceUrl,
    thumbnailUrl: card.thumbnailUrl,
    raw: { media: { image_url: raw.success ? (raw.data.media.image_url ?? null) : null } },
  };
}

function normalize({ card, fetchedAt }: FetchedCard): NormalizedCard {
  const raw = rawCardSchema.safeParse(card.raw);
  const identity = printingIdentity(card.riftboundId);
  const core = raw.success ? fromRaw(raw.data) : fromFlat(card, fetchedAt);

  return {
    ...core,
    id: card.id,
    riftboundId: card.riftboundId,
    isOvernumbered: identity.isOvernumbered,
    isSignature: identity.isSignature,
    poolCode: identity.poolCode,
    championName: championName({
      name: card.name,
      champion: card.champion ?? null,
      supertypeId: card.supertype ?? null,
      typeId: card.cardType,
    }),
    identityName: identityName(core.name),
    regions: card.regions,
    imageSources: imageSourcesOf(imageCardOf(card)),
    collectorNumber: raw.success
      ? raw.data.collector_number
      : (collectorNumber(card.number) ?? identity.collectorNumber ?? 0),
  };
}

function fromRaw(card: RawCard): CardCore {
  return {
    setCode: card.set.set_id,
    name: card.name,
    cleanName: card.metadata.clean_name ?? normalizedName(card.name),
    energy: card.attributes.energy,
    might: card.attributes.might,
    power: card.attributes.power,
    rulesTextRich: card.text.rich,
    rulesTextPlain: card.text.plain,
    flavourText: card.text.flavour ?? null,
    orientation: card.orientation,
    isAlternateArt: card.metadata.alternate_art,
    sourceUpdatedAt: card.metadata.updated_on,
    typeId: card.classification.type,
    supertypeId: card.classification.supertype ?? null,
    rarityId: card.classification.rarity,
    domainIds: card.classification.domain,
    tagIds: card.tags,
    artist: card.media.artist ?? null,
    accessibilityText: card.media.accessibility_text ?? null,
    marketplaceReferences: marketplaces<MarketplaceReference>(card, (marketplace, externalId) => ({
      marketplace,
      externalId,
    })),
  };
}

function fromFlat(card: ApiCard, fetchedAt: string): CardCore {
  return {
    setCode: card.setCode,
    name: card.name,
    cleanName: normalizedName(card.name),
    energy: card.cost ?? null,
    might: card.might ?? null,
    power: card.power ?? null,
    rulesTextRich: card.textRich ?? card.text ?? "",
    rulesTextPlain: card.text ?? "",
    flavourText: card.flavor ?? null,
    orientation: card.orientation,
    isAlternateArt: card.alternateArt,
    sourceUpdatedAt: fetchedAt,
    typeId: card.cardType,
    supertypeId: card.supertype ?? null,
    rarityId: card.rarity,
    domainIds: card.domain,
    tagIds: card.tags,
    artist: card.artist ?? null,
    accessibilityText: null,
    marketplaceReferences: [],
  };
}

function collectorNumber(printed: string): number | null {
  const digits = LEADING_DIGITS.exec(printed);

  return digits ? Number(digits[1]) : null;
}

function buildSeed(
  everyCard: readonly NormalizedCard[],
  sets: readonly RawSet[],
  imageFiles: ReadonlyMap<string, string>,
): BuiltSeed {
  const setCodes = new Set(sets.map((value) => value.set_id));
  const regionNames = new Set(everyCard.flatMap((card) => card.regions));
  const cards = everyCard.filter((card) => setCodes.has(card.setCode));
  const skipped = everyCard.filter((card) => !setCodes.has(card.setCode));
  const cardSets = sets
    .map((value) => ({
      code: value.set_id,
      sourceId: value.id,
      name: value.name,
      declaredCardCount: value.card_count,
      publishedOn: value.published_on,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
  const ordered = [...cards].sort((left, right) => left.id.localeCompare(right.id));
  const magnitudeIds = keywordsWithMagnitude(ordered.map((card) => card.rulesTextPlain));
  const remindersByCard = new Map(
    ordered.map((card) => [card.id, remindersIn(card.rulesTextPlain)] as const),
  );
  const keywordNames = new Map<string, string>();
  const canonicalIds = canonicalCardIds(ordered);
  const championNames = new Set(
    ordered.map((card) => card.championName).filter((name) => name !== null),
  );
  const types = new Map<string, Taxonomy>();
  const supertypes = new Map<string, Taxonomy>();
  const rarities = new Map<string, Taxonomy>();
  const domains = new Map<string, Taxonomy>();
  const tags = new Map<string, Taxonomy>();
  const catalogCards: Seed["catalogCards"] = [];
  const cardMarketplaceReferences: Seed["cardMarketplaceReferences"] = [];
  const cardMedia: Seed["cardMedia"] = [];
  const cardImageSources: Seed["cardImageSources"] = [];
  const cardClassifications: Seed["cardClassifications"] = [];
  const cardDomains: Seed["cardDomains"] = [];
  const cardTags: Seed["cardTags"] = [];
  const cardKeywords: Seed["cardKeywords"] = [];
  const cardKeywordTargets: Seed["cardKeywordTargets"] = [];
  const cardSpeedRows: Seed["cardSpeeds"] = [];
  for (const card of ordered) {
    for (const keyword of keywordOccurrences(card.rulesTextPlain))
      keywordNames.set(keyword.id, keyword.name);
  }
  const reminderTexts = chosenReminders(keywordNames, remindersByCard);
  for (const card of ordered) {
    add(types, card.typeId);
    add(rarities, card.rarityId);
    if (card.supertypeId) add(supertypes, card.supertypeId);
    catalogCards.push({
      id: card.id,
      riftboundId: card.riftboundId,
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      name: card.name,
      cleanName: card.cleanName,
      energy: card.energy,
      might: card.might,
      power: card.power,
      rulesTextRich: card.rulesTextRich,
      rulesTextPlain: card.rulesTextPlain,
      flavourText: card.flavourText,
      orientation: card.orientation,
      isAlternateArt: card.isAlternateArt,
      isOvernumbered: card.isOvernumbered,
      isSignature: card.isSignature,
      poolCode: card.poolCode,
      championName: card.championName,
      identityName: card.identityName,
      isCanonical: canonicalIds.has(card.id),
      sourceUpdatedAt: card.sourceUpdatedAt,
    });
    cardClassifications.push({
      cardId: card.id,
      typeId: card.typeId,
      supertypeId: card.supertypeId,
      rarityId: card.rarityId,
    });
    const imageFile = imageFiles.get(card.id);
    if (imageFile !== undefined) {
      cardMedia.push({
        cardId: card.id,
        imageFile,
        artist: card.artist,
        accessibilityText: card.accessibilityText,
      });
    }
    for (const [priority, url] of card.imageSources.entries())
      cardImageSources.push({ cardId: card.id, url, priority });
    cardMarketplaceReferences.push(
      ...card.marketplaceReferences.map((reference) => ({ cardId: card.id, ...reference })),
    );
    for (const domainId of card.domainIds) {
      add(domains, domainId);
      cardDomains.push({ cardId: card.id, domainId });
    }
    for (const tagId of card.tagIds) {
      add(tags, tagId);
      cardTags.push({ cardId: card.id, tagId });
    }
    const reminders = remindersByCard.get(card.id) ?? new Map<string, string>();
    for (const keyword of withMagnitudeDefaults(
      keywordOccurrences(card.rulesTextPlain),
      magnitudeIds,
    )) {
      const reminder = reminders.get(keyword.id) ?? null;
      const id = cardKeywords.length + 1;
      cardKeywords.push({
        id,
        cardId: card.id,
        keywordId: keyword.id,
        value: keyword.value,
        cost: keyword.cost,
        reminder: reminder === reminderTexts.get(keyword.id) ? null : reminder,
        source: DERIVED_SOURCE,
      });
      for (const target of keywordTargets(card.id, keyword)) {
        cardKeywordTargets.push({
          cardKeywordId: id,
          targetKind: target.kind,
          targetIsToken: target.isToken,
          allegiance: target.allegiance,
        });
      }
    }
    for (const speed of cardSpeeds(card.rulesTextPlain))
      cardSpeedRows.push({ cardId: card.id, speed });
  }
  return {
    seed: {
      cardSets,
      setMarketplaceReferences: uniqueBy(
        sets.flatMap((value) =>
          marketplaces<Seed["setMarketplaceReferences"][number]>(
            value,
            (marketplace, externalId) => ({ setCode: value.set_id, marketplace, externalId }),
          ),
        ),
        (row) => [row.setCode, row.marketplace, row.externalId],
      ),
      cardTypes: taxonomyRows(types),
      cardSupertypes: taxonomyRows(supertypes),
      rarities: taxonomyRows(rarities)
        .sort((left, right) => rarityRank(left.id) - rarityRank(right.id))
        .map((rarity, sortOrder) => ({ ...rarity, sortOrder })),
      domains: taxonomyRows(domains),
      tags: taxonomyRows(tags).map((tag) => ({
        ...tag,
        kind: tagKind(tag.id, regionNames, championNames),
      })),
      keywords: [...keywordNames]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([id, name]) => ({ id, name, reminderText: reminderTexts.get(id) ?? null })),
      catalogCards,
      cardMarketplaceReferences: uniqueBy(cardMarketplaceReferences, (row) => [
        row.cardId,
        row.marketplace,
        row.externalId,
      ]),
      cardMedia,
      cardImageSources: uniqueBy(cardImageSources, (row) => [row.cardId, row.url]),
      cardClassifications,
      cardDomains: uniqueBy(cardDomains, (row) => [row.cardId, row.domainId]),
      cardTags: uniqueBy(cardTags, (row) => [row.cardId, row.tagId]),
      cardKeywords,
      cardKeywordTargets,
      cardSpeeds: cardSpeedRows,
    },
    skipped,
  };
}

function keywordTargets(cardId: string, occurrence: KeywordOccurrence): readonly KeywordTarget[] {
  return match(occurrence.targeting)
    .with({ type: "targeted" }, ({ targets }) => targets)
    .with({ type: "unclassified" }, ({ leadIn, trailing }): readonly KeywordTarget[] => {
      throw new Error(
        `Unclassified keyword [${occurrence.name}] on ${cardId}: lead-in ${JSON.stringify(
          leadIn,
        )}, trailing ${JSON.stringify(trailing)}.`,
      );
    })
    .exhaustive();
}

function remindersIn(text: string): Map<string, string> {
  const reminders = new Map<string, string>();

  for (const match of text.matchAll(KEYWORD_REMINDER)) {
    const [keyword] = ownedKeywords(`[${match[1] ?? ""}]`);
    const reminder = (match[2] ?? "").trim();
    if (keyword === undefined || reminder.length === 0 || reminders.has(keyword.id)) continue;
    reminders.set(keyword.id, reminder);
  }

  return reminders;
}

function chosenReminders(
  keywordNames: ReadonlyMap<string, string>,
  remindersByCard: ReadonlyMap<string, ReadonlyMap<string, string>>,
): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const reminders of remindersByCard.values()) {
    for (const [keywordId, reminder] of reminders) {
      if (!keywordNames.has(keywordId)) continue;
      const variants = counts.get(keywordId) ?? new Map<string, number>();
      variants.set(reminder, (variants.get(reminder) ?? 0) + 1);
      counts.set(keywordId, variants);
    }
  }

  const chosen = new Map<string, string>();
  for (const [keywordId, variants] of counts) {
    const [best] = [...variants].sort(
      ([leftReminder, leftCount], [rightReminder, rightCount]) =>
        rightCount - leftCount || leftReminder.localeCompare(rightReminder),
    );
    if (best) chosen.set(keywordId, best[0]);
  }

  return chosen;
}

function canonicalCardIds(cards: readonly NormalizedCard[]): ReadonlySet<string> {
  const chosen = new Map<string, NormalizedCard>();

  for (const card of cards) {
    const held = chosen.get(card.riftboundId);
    if (held === undefined || outranks(card, held)) chosen.set(card.riftboundId, card);
  }

  return new Set([...chosen.values()].map((card) => card.id));
}

function outranks(card: NormalizedCard, held: NormalizedCard): boolean {
  if (card.isAlternateArt !== held.isAlternateArt) return !card.isAlternateArt;
  if (card.isSignature !== held.isSignature) return !card.isSignature;

  return card.id < held.id;
}

function tagKind(
  tagId: string,
  regionNames: ReadonlySet<string>,
  championNames: ReadonlySet<string>,
): "character" | "region" | "trait" {
  if (regionNames.has(tagId)) return "region";
  if (championNames.has(tagId)) return "character";

  return "trait";
}

function rarityRank(id: string): number {
  const index = RARITY_ORDER.indexOf(id);

  return index === -1 ? RARITY_ORDER.length : index;
}

function marketplaces<Row>(
  value: {
    cardmarket_id?: string | string[] | null | undefined;
    tcgplayer_id?: string | string[] | null | undefined;
  },
  row: (marketplace: Marketplace, externalId: string) => Row,
): Row[] {
  return (["cardmarket", "tcgplayer"] as const).flatMap((marketplace) => {
    const externalIds = value[`${marketplace}_id`];
    return (Array.isArray(externalIds) ? externalIds : externalIds ? [externalIds] : []).map(
      (externalId) => row(marketplace, externalId),
    );
  });
}
function add(values: Map<string, Taxonomy>, id: string): void {
  values.set(id, { id, name: id });
}
function taxonomyRows(values: Map<string, Taxonomy>): Taxonomy[] {
  return [...values.values()].sort((left, right) => left.id.localeCompare(right.id));
}
function uniqueBy<Row>(rows: readonly Row[], keyOf: (row: Row) => readonly string[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = keyOf(row).join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function normalizedName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function assertValid(seed: Seed): void {
  seed.cardSets.forEach((row) => cardSetInsertSchema.parse(row));
  seed.setMarketplaceReferences.forEach((row) => setMarketplaceReferenceInsertSchema.parse(row));
  seed.cardTypes.forEach((row) => cardTypeInsertSchema.parse(row));
  seed.cardSupertypes.forEach((row) => cardSupertypeInsertSchema.parse(row));
  seed.rarities.forEach((row) => rarityInsertSchema.parse(row));
  seed.domains.forEach((row) => domainInsertSchema.parse(row));
  seed.tags.forEach((row) => tagInsertSchema.parse(row));
  seed.keywords.forEach((row) => keywordInsertSchema.parse(row));
  seed.catalogCards.forEach((row) => catalogCardInsertSchema.parse(row));
  seed.cardMarketplaceReferences.forEach((row) => cardMarketplaceReferenceInsertSchema.parse(row));
  seed.cardMedia.forEach((row) => cardMediaInsertSchema.parse(row));
  seed.cardImageSources.forEach((row) => cardImageSourceInsertSchema.parse(row));
  seed.cardClassifications.forEach((row) => cardClassificationInsertSchema.parse(row));
  seed.cardDomains.forEach((row) => cardDomainInsertSchema.parse(row));
  seed.cardTags.forEach((row) => cardTagInsertSchema.parse(row));
  seed.cardKeywords.forEach((row) => cardKeywordInsertSchema.parse(row));
  seed.cardKeywordTargets.forEach((row) => cardKeywordTargetInsertSchema.parse(row));
  seed.cardSpeeds.forEach((row) => cardSpeedInsertSchema.parse(row));
  assertEveryCardHasMedia(seed);
  assertOneCanonicalPrintingPerCard(seed);
}

function assertEveryCardHasMedia(seed: Seed): void {
  const withMedia = new Set(seed.cardMedia.map((row) => row.cardId));
  const missing = seed.catalogCards.filter((row) => !withMedia.has(row.id));

  if (missing.length > 0)
    throw new Error(
      `${missing.length} cards carry no image source and have no media row: ${sample(
        missing.map((row) => row.id),
      )}.`,
    );
}

function assertOneCanonicalPrintingPerCard(seed: Seed): void {
  const canonical = seed.catalogCards.filter((row) => row.isCanonical === true);
  assertUnique(canonical, (row) => row.riftboundId, "canonical Riftbound ID");
  const named = new Set(canonical.map((row) => row.riftboundId));
  const unnamed = [
    ...new Set(seed.catalogCards.map((row) => row.riftboundId).filter((id) => !named.has(id))),
  ];

  if (unnamed.length > 0)
    throw new Error(
      `${unnamed.length} Riftbound IDs have no canonical printing: ${sample(unnamed)}.`,
    );
}

function sample(ids: readonly string[]): string {
  const shown = ids.slice(0, REPORTED_SAMPLE).join(", ");

  return ids.length > REPORTED_SAMPLE ? `${shown}, ...` : shown;
}

export {
  apiCardSchema,
  assertUnique,
  assertValid,
  buildSeed,
  dedupeById,
  imageCardOf,
  normalize,
  rawSetSchema,
};
export type { ApiCard, BuiltSeed, FetchedCard, NormalizedCard, RawSet, Seed };
