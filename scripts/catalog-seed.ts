import { match } from "ts-pattern";
import { z } from "zod/v4";
import { cardDomainSchema } from "../src/features/card/value-objects/card-domain";
import { cardTypeSchema } from "../src/features/card/value-objects/card-type";
import {
  CANONICAL_SEPARATOR,
  cardSpeeds,
  championName,
  cleanName,
  identityName,
  keywordOccurrences,
  keywordsWithMagnitude,
  normalizedPunctuation,
  ownedKeywords,
  printingFinish,
  printingId,
  printingIdentity,
  withMagnitudeDefaults,
} from "./card-derivation";
import type { CardSpeed, KeywordOccurrence, KeywordTarget } from "./card-derivation";
import type { PrintingFinish } from "../src/features/card/value-objects/printing-finish";
import { imageSourcesOf } from "./card-image-file";
import type { SourcedCard } from "./card-image-file";

import {
  cardDomainInsertSchema,
  cardImageSourceInsertSchema,
  cardInsertSchema,
  cardMarketplaceReferenceInsertSchema,
  cardMediaInsertSchema,
  cardPrintingInsertSchema,
  cardSpeedInsertSchema,
  cardTagInsertSchema,
} from "../src/infrastructure/database/reference-schema/cards";
import {
  cardKeywordInsertSchema,
  cardKeywordTargetInsertSchema,
  keywordInsertSchema,
} from "../src/infrastructure/database/reference-schema/keywords";
import {
  cardSetInsertSchema,
  setMarketplaceReferenceInsertSchema,
} from "../src/infrastructure/database/reference-schema/sets";
import {
  cardSupertypeInsertSchema,
  cardTypeInsertSchema,
  domainInsertSchema,
  rarityInsertSchema,
  tagInsertSchema,
} from "../src/infrastructure/database/reference-schema/taxonomy";
import type {
  cardDomains,
  cardImageSources,
  cardMarketplaceReferences,
  cardMedia,
  cardPrintings,
  cardSpeeds as cardSpeedTable,
  cardTags,
  cards as cardTable,
} from "../src/infrastructure/database/reference-schema/cards";
import type {
  cardKeywordTargets,
  cardKeywords,
  keywords,
} from "../src/infrastructure/database/reference-schema/keywords";
import type {
  cardSets,
  setMarketplaceReferences,
} from "../src/infrastructure/database/reference-schema/sets";
import type {
  cardSupertypes,
  cardTypes,
  domains,
  rarities,
  tags,
} from "../src/infrastructure/database/reference-schema/taxonomy";

const nullableString = z.string().nullish();
const nullableInteger = z.number().int().nullish();
const marketplaceId = z.union([z.string(), z.array(z.string())]).nullish();
const orientationSchema = z.enum(["landscape", "portrait"]);
const rawSetSchema = z.object({
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
const LEADING_DIGITS = /^\d+/;
const MARKUP = /<[^>]*>/g;
const PLACEHOLDER_TEXT = /^\[\s*no\s+text\s*\]$/i;
const REPORTED_SAMPLE = 5;
type RawCard = z.output<typeof rawCardSchema>;
type RawSet = z.output<typeof rawSetSchema>;
type ApiCard = z.output<typeof apiCardSchema>;
type FetchedCard = { card: ApiCard; fetchedAt: string };
type Taxonomy = typeof cardTypes.$inferInsert;
type Marketplace = "cardmarket" | "tcgplayer";
type MarketplaceReference = { marketplace: Marketplace; externalId: string };
type NormalizedPrinting = {
  sourceId: string;
  isPrimaryFeed: boolean;
  riftboundId: string;
  setCode: string;
  collectorNumber: string;
  name: string;
  cleanName: string;
  energy: number | null;
  might: number | null;
  power: number | null;
  rulesTextRich: string;
  rulesTextPlain: string;
  flavourText: string | null;
  orientation: z.output<typeof orientationSchema>;
  finish: PrintingFinish;
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
  NormalizedPrinting,
  | "championName"
  | "cleanName"
  | "collectorNumber"
  | "identityName"
  | "imageSources"
  | "isPrimaryFeed"
  | "poolCode"
  | "regions"
  | "riftboundId"
  | "sourceId"
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
  cards: (typeof cardTable.$inferInsert)[];
  cardPrintings: (typeof cardPrintings.$inferInsert)[];
  cardMarketplaceReferences: (typeof cardMarketplaceReferences.$inferInsert)[];
  cardMedia: (typeof cardMedia.$inferInsert)[];
  cardImageSources: (typeof cardImageSources.$inferInsert)[];
  cardDomains: (typeof cardDomains.$inferInsert)[];
  cardTags: (typeof cardTags.$inferInsert)[];
  cardKeywords: (typeof cardKeywords.$inferInsert)[];
  cardKeywordTargets: (typeof cardKeywordTargets.$inferInsert)[];
  cardSpeeds: (typeof cardSpeedTable.$inferInsert)[];
};
type CardGroup = {
  readonly id: string;
  readonly printings: readonly NormalizedPrinting[];
  readonly trusted: readonly NormalizedPrinting[];
};
type GroupKeyword = {
  readonly id: string;
  readonly value: number | null;
  readonly cost: string | null;
  readonly reminder: string | null;
  readonly targets: readonly KeywordTarget[];
};
type IdentityConflict = {
  readonly identityName: string;
  readonly hosts: readonly string[];
  readonly reason: string;
};
type ReconciledIdentities = {
  readonly repaired: ReadonlyMap<string, string>;
  readonly conflicts: readonly IdentityConflict[];
};
type BuiltSeed = {
  readonly seed: Seed;
  readonly skipped: readonly NormalizedPrinting[];
  readonly identityConflicts: readonly IdentityConflict[];
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

function normalize({ card, fetchedAt }: FetchedCard): NormalizedPrinting {
  const raw = rawCardSchema.safeParse(card.raw);
  const identity = printingIdentity(card.riftboundId);
  const core = raw.success ? fromRaw(raw.data) : fromFlat(card, fetchedAt);

  return {
    ...core,
    sourceId: card.id,
    isPrimaryFeed: raw.success,
    riftboundId: card.riftboundId,
    poolCode: identity.poolCode,
    championName: championName({
      name: card.name,
      champion: card.champion ?? null,
      supertypeId: card.supertype ?? null,
      typeId: card.cardType,
    }),
    cleanName: cleanName(core.name),
    identityName: identityName(core.name),
    regions: card.regions,
    imageSources: imageSourcesOf(imageCardOf(card)),
    collectorNumber: identity.collectorNumber ?? card.number,
  };
}

function fromRaw(card: RawCard): CardCore {
  const name = normalizedPunctuation(card.name);

  return {
    setCode: card.set.set_id,
    name,
    energy: card.attributes.energy,
    might: card.attributes.might,
    power: card.attributes.power,
    rulesTextRich: card.text.rich,
    rulesTextPlain: card.text.plain,
    flavourText: card.text.flavour ?? null,
    orientation: card.orientation,
    finish: printingFinish(name, {
      alternateArt: card.metadata.alternate_art,
      overnumbered: card.metadata.overnumbered,
      signature: card.metadata.signature,
    }),
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
  const name = normalizedPunctuation(card.name);

  return {
    setCode: card.setCode,
    name,
    energy: card.cost ?? null,
    might: card.might ?? null,
    power: card.power ?? null,
    rulesTextRich: card.textRich ?? card.text ?? "",
    rulesTextPlain: card.text ?? "",
    flavourText: card.flavor ?? null,
    orientation: card.orientation,
    finish: printingFinish(name, {
      alternateArt: card.alternateArt,
      overnumbered: false,
      signature: card.signature,
    }),
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

function buildSeed(
  everyCard: readonly NormalizedPrinting[],
  sets: readonly RawSet[],
  imageFiles: ReadonlyMap<string, string>,
): BuiltSeed {
  const setCodes = new Set(sets.map((value) => value.set_id));
  const regionNames = new Set(everyCard.flatMap((card) => card.regions).map(normalizedPunctuation));
  const kept = everyCard.filter((card) => setCodes.has(card.setCode));
  const skipped = everyCard.filter((card) => !setCodes.has(card.setCode));
  const cardSets = sets
    .map((value) => ({
      code: value.set_id,
      name: value.name,
      declaredCardCount: value.card_count,
      publishedOn: value.published_on,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
  const publishedOn = new Map(sets.map((value) => [value.set_id, value.published_on] as const));
  const ordered = [...kept].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const identities = reconciledIdentities(ordered);
  const current = currentPrintings(ordered, identities.repaired);
  const canonicalIds = canonicalCardIds(current);
  const groups = cardGroups(current, identities.repaired, publishedOn, canonicalIds);
  const derived = groups.flatMap((group) => printedPrintings(group.trusted));
  const magnitudeIds = keywordsWithMagnitude(derived.map((printing) => printing.rulesTextPlain));
  const remindersByPrinting = new Map(
    derived.map((printing) => [printing.sourceId, remindersIn(printing.rulesTextPlain)] as const),
  );
  const keywordNames = new Map<string, string>();
  const championNames = new Set(
    ordered.map((card) => card.championName).filter((name) => name !== null),
  );
  const types = new Map<string, Taxonomy>();
  const supertypes = new Map<string, Taxonomy>();
  const rarities = new Map<string, Taxonomy>();
  const domains = new Map<string, Taxonomy>();
  const tags = new Map<string, Taxonomy>();
  const cardRows: Seed["cards"] = [];
  const cardPrintingRows: Seed["cardPrintings"] = [];
  const cardMarketplaceReferences: Seed["cardMarketplaceReferences"] = [];
  const cardMedia: Seed["cardMedia"] = [];
  const cardImageSources: Seed["cardImageSources"] = [];
  const cardDomains: Seed["cardDomains"] = [];
  const cardTags: Seed["cardTags"] = [];
  const cardKeywords: Seed["cardKeywords"] = [];
  const cardKeywordTargets: Seed["cardKeywordTargets"] = [];
  const cardSpeedRows: Seed["cardSpeeds"] = [];
  for (const printing of derived) {
    for (const keyword of keywordOccurrences(printing.rulesTextPlain))
      keywordNames.set(keyword.id, keyword.name);
  }
  const reminderTexts = chosenReminders(keywordNames, remindersByPrinting);
  for (const group of groups) {
    const card = resolvedCard(group);
    /** A Riftbound card's name is its identity, so every printing of it is printed with that name. */
    const cardName = group.id;
    add(types, card.typeId);
    if (card.supertypeId) add(supertypes, card.supertypeId);
    cardRows.push(card);
    for (const printing of group.printings) {
      const release = {
        setCode: printing.setCode,
        collectorNumber: printing.collectorNumber,
        poolCode: printing.poolCode,
        finish: printing.finish,
      };
      const id = printingId(release);
      add(rarities, printing.rarityId);
      cardPrintingRows.push({
        id,
        cardId: cardName,
        riftboundId: printing.riftboundId,
        ...release,
        rarityId: printing.rarityId,
        printedName: cardName,
        flavourText: printing.flavourText,
        sourceUpdatedAt: printing.sourceUpdatedAt,
        isCanonical: canonicalIds.has(printing.sourceId),
      });
      const imageFile = imageFiles.get(printing.sourceId);
      if (imageFile !== undefined) {
        cardMedia.push({
          printingId: id,
          imageFile,
          artist: printing.artist,
          accessibilityText: printing.accessibilityText,
        });
      }
      for (const [priority, url] of printing.imageSources.entries())
        cardImageSources.push({ printingId: id, url, priority });
      cardMarketplaceReferences.push(
        ...printing.marketplaceReferences.map((reference) => ({
          printingId: id,
          ...reference,
        })),
      );
    }
    for (const printing of group.trusted) {
      for (const domainId of printing.domainIds) {
        add(domains, domainId);
        cardDomains.push({ cardId: group.id, domainId });
      }
      for (const tagId of printing.tagIds) {
        add(tags, tagId);
        cardTags.push({ cardId: group.id, tagId });
      }
    }
    for (const keyword of groupKeywords(group, magnitudeIds, remindersByPrinting, reminderTexts)) {
      const id = cardKeywords.length + 1;
      cardKeywords.push({
        id,
        cardId: group.id,
        keywordId: keyword.id,
        value: keyword.value,
        cost: keyword.cost,
        reminder: keyword.reminder,
        source: DERIVED_SOURCE,
      });
      for (const target of keyword.targets) {
        cardKeywordTargets.push({
          cardKeywordId: id,
          targetKind: target.kind,
          targetIsToken: target.isToken,
          allegiance: target.allegiance,
        });
      }
    }
    for (const speed of groupSpeeds(group)) cardSpeedRows.push({ cardId: group.id, speed });
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
      cards: cardRows,
      cardPrintings: cardPrintingRows,
      cardMarketplaceReferences: uniqueBy(cardMarketplaceReferences, (row) => [
        row.printingId,
        row.marketplace,
        row.externalId,
      ]),
      cardMedia,
      cardImageSources: uniqueBy(cardImageSources, (row) => [row.printingId, row.url]),
      cardDomains: uniqueBy(cardDomains, (row) => [row.cardId, row.domainId]),
      cardTags: uniqueBy(cardTags, (row) => [row.cardId, row.tagId]),
      cardKeywords,
      cardKeywordTargets,
      cardSpeeds: cardSpeedRows,
    },
    skipped,
    identityConflicts: identities.conflicts,
  };
}

function currentPrintings(
  printings: readonly NormalizedPrinting[],
  repaired: ReadonlyMap<string, string>,
): readonly NormalizedPrinting[] {
  return newestOfReissued(withoutPoollessDuplicates(printings, repaired));
}

function withoutPoollessDuplicates(
  printings: readonly NormalizedPrinting[],
  repaired: ReadonlyMap<string, string>,
): readonly NormalizedPrinting[] {
  const pooled = new Set(
    printings
      .filter((printing) => printing.poolCode !== null)
      .map((printing) => releaseKey(printing, repaired)),
  );

  return printings.filter(
    (printing) => printing.poolCode !== null || !pooled.has(releaseKey(printing, repaired)),
  );
}

function newestOfReissued(printings: readonly NormalizedPrinting[]): readonly NormalizedPrinting[] {
  const newest = new Map<string, NormalizedPrinting>();

  for (const printing of printings) {
    const key = feedKey(printing);
    const held = newest.get(key);
    if (held === undefined || reissueOrder(printing, held) < 0) newest.set(key, printing);
  }

  const current = new Set([...newest.values()].map((printing) => printing.sourceId));

  return printings.filter((printing) => current.has(printing.sourceId));
}

function reissueOrder(left: NormalizedPrinting, right: NormalizedPrinting): number {
  return (
    Date.parse(right.sourceUpdatedAt) - Date.parse(left.sourceUpdatedAt) ||
    left.sourceId.localeCompare(right.sourceId)
  );
}

function feedKey(printing: NormalizedPrinting): string {
  return [printing.riftboundId, printing.finish].join("\u0000");
}

function releaseKey(printing: NormalizedPrinting, repaired: ReadonlyMap<string, string>): string {
  return [
    cardIdOf(printing, repaired),
    printing.setCode,
    printing.collectorNumber,
    printing.finish,
  ].join("\u0000");
}

function cardIdOf(printing: NormalizedPrinting, repaired: ReadonlyMap<string, string>): string {
  return repaired.get(printing.identityName) ?? printing.identityName;
}

function cardGroups(
  printings: readonly NormalizedPrinting[],
  repaired: ReadonlyMap<string, string>,
  publishedOn: ReadonlyMap<string, string>,
  canonicalIds: ReadonlySet<string>,
): readonly CardGroup[] {
  const grouped = new Map<string, NormalizedPrinting[]>();

  for (const printing of printings) {
    const id = cardIdOf(printing, repaired);
    const held = grouped.get(id);
    if (held === undefined) grouped.set(id, [printing]);
    else held.push(printing);
  }

  return [...grouped]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, members]) => {
      const ranked = [...members].sort((left, right) =>
        printingOrder(left, right, publishedOn, canonicalIds),
      );
      const primary = ranked.filter((printing) => printing.isPrimaryFeed);

      return { id, printings: ranked, trusted: primary.length > 0 ? primary : ranked };
    });
}

function printingOrder(
  left: NormalizedPrinting,
  right: NormalizedPrinting,
  publishedOn: ReadonlyMap<string, string>,
  canonicalIds: ReadonlySet<string>,
): number {
  return (
    ahead(left.isPrimaryFeed) - ahead(right.isPrimaryFeed) ||
    (publishedOn.get(right.setCode) ?? "").localeCompare(publishedOn.get(left.setCode) ?? "") ||
    ahead(canonicalIds.has(left.sourceId)) - ahead(canonicalIds.has(right.sourceId)) ||
    ahead(left.finish === "standard") - ahead(right.finish === "standard") ||
    collectorPosition(left.collectorNumber) - collectorPosition(right.collectorNumber) ||
    left.collectorNumber.localeCompare(right.collectorNumber) ||
    left.sourceId.localeCompare(right.sourceId)
  );
}

function ahead(preferred: boolean): number {
  return preferred ? 0 : 1;
}

function collectorPosition(collectorNumber: string): number {
  const digits = LEADING_DIGITS.exec(collectorNumber);

  return digits ? Number(digits[0]) : 0;
}

function resolvedCard(group: CardGroup): Seed["cards"][number] {
  const [best] = group.trusted;
  if (best === undefined) throw new Error(`No printing resolves the card ${group.id}.`);

  return {
    id: group.id,
    cleanName: cleanName(group.id),
    energy: firstPrinted(group.trusted, (printing) => printing.energy),
    might: firstPrinted(group.trusted, (printing) => printing.might),
    power: firstPrinted(group.trusted, (printing) => printing.power),
    rulesTextRich:
      firstPrinted(group.trusted, (printing) => printedText(printing.rulesTextRich)) ?? "",
    rulesTextPlain:
      firstPrinted(group.trusted, (printing) => printedText(printing.rulesTextPlain)) ?? "",
    orientation: best.orientation,
    typeId: best.typeId,
    supertypeId: firstPrinted(group.trusted, (printing) => printing.supertypeId),
    championName: firstPrinted(group.trusted, (printing) => printing.championName),
  };
}

function firstPrinted<Value>(
  printings: readonly NormalizedPrinting[],
  valueOf: (printing: NormalizedPrinting) => Value | null,
): Value | null {
  for (const printing of printings) {
    const value = valueOf(printing);
    if (value !== null) return value;
  }

  return null;
}

function printedText(text: string): string | null {
  const bare = text.replace(MARKUP, "").trim();

  return bare.length === 0 || PLACEHOLDER_TEXT.test(bare) ? null : text;
}

function printedPrintings(printings: readonly NormalizedPrinting[]): readonly NormalizedPrinting[] {
  return printings.filter((printing) => printedText(printing.rulesTextPlain) !== null);
}

function groupKeywords(
  group: CardGroup,
  magnitudeIds: ReadonlySet<string>,
  remindersByPrinting: ReadonlyMap<string, ReadonlyMap<string, string>>,
  reminderTexts: ReadonlyMap<string, string>,
): readonly GroupKeyword[] {
  const held = new Map<string, GroupKeyword>();

  for (const printing of printedPrintings(group.trusted)) {
    const reminders = remindersByPrinting.get(printing.sourceId) ?? new Map<string, string>();
    for (const occurrence of withMagnitudeDefaults(
      keywordOccurrences(printing.rulesTextPlain),
      magnitudeIds,
    )) {
      const targets = keywordTargets(printing.sourceId, occurrence);
      const printed = reminders.get(occurrence.id) ?? null;
      const reminder = printed === reminderTexts.get(occurrence.id) ? null : printed;
      const key = [
        occurrence.id,
        String(occurrence.value),
        occurrence.cost ?? "",
        ...targets.map(targetKey),
      ].join("\u0000");
      const kept = held.get(key);
      if (kept === undefined) {
        held.set(key, {
          id: occurrence.id,
          value: occurrence.value,
          cost: occurrence.cost,
          reminder,
          targets,
        });
      } else if (kept.reminder === null && reminder !== null) held.set(key, { ...kept, reminder });
    }
  }

  return [...held.values()];
}

function groupSpeeds(group: CardGroup): readonly CardSpeed[] {
  const texts = printedPrintings(group.trusted).map((printing) => printing.rulesTextPlain);
  const speeds = new Set<CardSpeed>();

  for (const text of texts.length > 0 ? texts : [""])
    for (const speed of cardSpeeds(text)) speeds.add(speed);

  return [...speeds];
}

function targetKey(target: KeywordTarget): string {
  return `${target.kind}:${target.isToken}:${target.allegiance}`;
}

function printingsByIdentity(
  cards: readonly NormalizedPrinting[],
): ReadonlyMap<string, readonly NormalizedPrinting[]> {
  const grouped = new Map<string, NormalizedPrinting[]>();

  for (const card of cards) {
    const held = grouped.get(card.identityName);
    if (held === undefined) grouped.set(card.identityName, [card]);
    else held.push(card);
  }

  return grouped;
}

function hostIdentities(identities: readonly string[], tail: string): readonly string[] {
  return identities.filter(
    (identity) => identity !== tail && identity.endsWith(CANONICAL_SEPARATOR + tail),
  );
}

function droppedPrefix(host: string, tail: string): string {
  return host.slice(0, host.length - tail.length - CANONICAL_SEPARATOR.length);
}

function gameplayShape(card: NormalizedPrinting): string {
  return `${card.typeId}/${card.energy}/${card.might}/${card.power}`;
}

function reconciledIdentities(cards: readonly NormalizedPrinting[]): ReconciledIdentities {
  const grouped = printingsByIdentity(cards);
  const identities = [...grouped.keys()];
  const repaired = new Map<string, string>();
  const conflicts: IdentityConflict[] = [];

  for (const [tail, printings] of grouped) {
    const hosts = hostIdentities(identities, tail);
    if (hosts.length === 0) continue;
    const champions = new Set(
      printings
        .map((card) => card.championName)
        .filter((name) => name !== null)
        .map((name) => name.toLowerCase()),
    );
    const named = hosts.filter((host) => champions.has(droppedPrefix(host, tail).toLowerCase()));
    if (named.length === 0) continue;
    const [host] = named;
    if (host === undefined || named.length > 1) {
      conflicts.push({
        identityName: tail,
        hosts: named,
        reason: `${named.length} cards name its champion, so the prefix it dropped is ambiguous`,
      });
      continue;
    }
    const shapes = new Set([...printings, ...(grouped.get(host) ?? [])].map(gameplayShape));
    if (shapes.size > 1) {
      conflicts.push({
        identityName: tail,
        hosts: [host],
        reason: `type, energy, might or power disagree: ${[...shapes].join(" and ")}`,
      });
      continue;
    }
    repaired.set(tail, host);
  }

  return { repaired, conflicts };
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

function canonicalCardIds(cards: readonly NormalizedPrinting[]): ReadonlySet<string> {
  const chosen = new Map<string, NormalizedPrinting>();

  for (const card of cards) {
    const held = chosen.get(card.riftboundId);
    if (held === undefined || outranks(card, held)) chosen.set(card.riftboundId, card);
  }

  return new Set([...chosen.values()].map((card) => card.sourceId));
}

function outranks(card: NormalizedPrinting, held: NormalizedPrinting): boolean {
  const standard = card.finish === "standard";
  if (standard !== (held.finish === "standard")) return standard;

  return card.sourceId < held.sourceId;
}

function tagKind(
  tagId: string,
  regionNames: ReadonlySet<string>,
  championNames: ReadonlySet<string>,
): "character" | "region" | "trait" {
  const tag = normalizedPunctuation(tagId);
  if (regionNames.has(tag)) return "region";
  if (championNames.has(tag)) return "character";

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
function assertValid(seed: Seed): void {
  seed.cardSets.forEach((row) => cardSetInsertSchema.parse(row));
  seed.setMarketplaceReferences.forEach((row) => setMarketplaceReferenceInsertSchema.parse(row));
  seed.cardTypes.forEach((row) => cardTypeInsertSchema.parse(row));
  seed.cardSupertypes.forEach((row) => cardSupertypeInsertSchema.parse(row));
  seed.rarities.forEach((row) => rarityInsertSchema.parse(row));
  seed.domains.forEach((row) => domainInsertSchema.parse(row));
  seed.tags.forEach((row) => tagInsertSchema.parse(row));
  seed.keywords.forEach((row) => keywordInsertSchema.parse(row));
  seed.cards.forEach((row) => cardInsertSchema.parse(row));
  seed.cardPrintings.forEach((row) => cardPrintingInsertSchema.parse(row));
  seed.cardMarketplaceReferences.forEach((row) => cardMarketplaceReferenceInsertSchema.parse(row));
  seed.cardMedia.forEach((row) => cardMediaInsertSchema.parse(row));
  seed.cardImageSources.forEach((row) => cardImageSourceInsertSchema.parse(row));
  seed.cardDomains.forEach((row) => cardDomainInsertSchema.parse(row));
  seed.cardTags.forEach((row) => cardTagInsertSchema.parse(row));
  seed.cardKeywords.forEach((row) => cardKeywordInsertSchema.parse(row));
  seed.cardKeywordTargets.forEach((row) => cardKeywordTargetInsertSchema.parse(row));
  seed.cardSpeeds.forEach((row) => cardSpeedInsertSchema.parse(row));
  assertUnique(seed.cards, (row) => row.id, "card ID");
  assertOnePrintingPerRelease(seed);
  assertUnique(seed.cardPrintings, (row) => row.id, "printing ID");
  assertEveryPrintingHasMedia(seed);
  assertOneCanonicalPrintingPerFace(seed);
  assertEveryCardIsPrinted(seed);
  assertNothingIsOrphaned(seed);
}

function assertOnePrintingPerRelease(seed: Seed): void {
  assertUnique(
    seed.cardPrintings,
    (row) => `${row.setCode} ${row.collectorNumber} ${row.poolCode ?? "no pool"} ${row.finish}`,
    "printing set code, collector number, pool code and finish",
  );
}

function assertEveryPrintingHasMedia(seed: Seed): void {
  const withMedia = new Set(seed.cardMedia.map((row) => row.printingId));
  const missing = seed.cardPrintings.filter((row) => !withMedia.has(row.id));

  if (missing.length > 0)
    throw new Error(
      `${missing.length} printings carry no image source and have no media row: ${sample(
        missing.map((row) => row.id),
      )}.`,
    );
}

function assertOneCanonicalPrintingPerFace(seed: Seed): void {
  const canonical = seed.cardPrintings.filter((row) => row.isCanonical === true);
  assertUnique(canonical, (row) => row.riftboundId, "canonical Riftbound ID");
  const named = new Set(canonical.map((row) => row.riftboundId));
  const unnamed = [
    ...new Set(seed.cardPrintings.map((row) => row.riftboundId).filter((id) => !named.has(id))),
  ];

  if (unnamed.length > 0)
    throw new Error(
      `${unnamed.length} Riftbound IDs have no canonical printing: ${sample(unnamed)}.`,
    );
}

function assertEveryCardIsPrinted(seed: Seed): void {
  const printed = new Set(seed.cardPrintings.map((row) => row.cardId));
  const unprinted = seed.cards.filter((row) => !printed.has(row.id));

  if (unprinted.length > 0)
    throw new Error(
      `${unprinted.length} cards have no printing: ${sample(unprinted.map((row) => row.id))}.`,
    );
}

function assertNothingIsOrphaned(seed: Seed): void {
  const cardIds = new Set(seed.cards.map((row) => row.id));
  const printingIds = new Set(seed.cardPrintings.map((row) => row.id));
  const keywordIds = new Set(seed.keywords.map((row) => row.id));
  const cardKeywordIds = new Set(seed.cardKeywords.map((row) => String(row.id)));
  assertReferences(seed.cardPrintings, (row) => row.cardId, cardIds, "card_printing");
  assertReferences(seed.cardDomains, (row) => row.cardId, cardIds, "card_domain");
  assertReferences(seed.cardTags, (row) => row.cardId, cardIds, "card_tag");
  assertReferences(seed.cardSpeeds, (row) => row.cardId, cardIds, "card_speed");
  assertReferences(seed.cardKeywords, (row) => row.cardId, cardIds, "card_keyword");
  assertReferences(seed.cardKeywords, (row) => row.keywordId, keywordIds, "card_keyword keyword");
  assertReferences(seed.cardMedia, (row) => row.printingId, printingIds, "card_media");
  assertReferences(
    seed.cardImageSources,
    (row) => row.printingId,
    printingIds,
    "card_image_source",
  );
  assertReferences(
    seed.cardMarketplaceReferences,
    (row) => row.printingId,
    printingIds,
    "card_marketplace_reference",
  );
  assertReferences(
    seed.cardKeywordTargets,
    (row) => String(row.cardKeywordId),
    cardKeywordIds,
    "card_keyword_target",
  );
}

function assertReferences<Row>(
  rows: readonly Row[],
  keyOf: (row: Row) => string,
  owners: ReadonlySet<string>,
  label: string,
): void {
  const orphaned = [...new Set(rows.map(keyOf).filter((key) => !owners.has(key)))];

  if (orphaned.length > 0)
    throw new Error(
      `${orphaned.length} ${label} rows name an owner the seed has no row for: ${sample(
        orphaned,
      )}.`,
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
export type { ApiCard, BuiltSeed, FetchedCard, IdentityConflict, NormalizedPrinting, RawSet, Seed };
