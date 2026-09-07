import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod/v4";
import { parseImageUrl } from "../src/shared/image-url";
import { cardDomainSchema } from "../src/features/catalog/value-objects/card-domain";
import { cardTypeSchema } from "../src/features/catalog/value-objects/card-type";

import {
  cardClassificationInsertSchema,
  cardDomainInsertSchema,
  cardMarketplaceReferenceInsertSchema,
  cardMediaInsertSchema,
  cardTagInsertSchema,
  catalogCardInsertSchema,
} from "../src/infrastructure/database/catalog-schema/cards";
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
  cardMarketplaceReferences,
  cardMedia,
  cardTags,
  catalogCards,
} from "../src/infrastructure/database/catalog-schema/cards";
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

const dataDirectory = process.env.CATALOG_DATA_DIRECTORY ?? "data";
const outputPath =
  process.env.CATALOG_SEED_OUTPUT_PATH ?? "src/infrastructure/database/generated/catalog-seed.ts";
const nullableString = z.string().nullish();
const marketplaceId = z.union([z.string(), z.array(z.string())]).nullish();
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
  orientation: z.enum(["landscape", "portrait"]),
  metadata: z.object({
    clean_name: nullableString,
    updated_on: z.string(),
    alternate_art: z.boolean(),
    overnumbered: z.boolean(),
    signature: z.boolean(),
  }),
});
const pageSchema = <Item extends z.ZodType>(item: Item) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    pages: z.number().int().positive(),
  });
type RawCard = z.output<typeof rawCardSchema>;
type RawSet = z.output<typeof rawSetSchema>;
type Page<Item> = { items: Item[]; total: number; page: number; size: number; pages: number };
type Taxonomy = typeof cardTypes.$inferInsert;
type Marketplace = "cardmarket" | "tcgplayer";
type Seed = {
  cardSets: (typeof cardSets.$inferInsert)[];
  setMarketplaceReferences: (typeof setMarketplaceReferences.$inferInsert)[];
  cardTypes: (typeof cardTypes.$inferInsert)[];
  cardSupertypes: (typeof cardSupertypes.$inferInsert)[];
  rarities: (typeof rarities.$inferInsert)[];
  domains: (typeof domains.$inferInsert)[];
  tags: (typeof tags.$inferInsert)[];
  catalogCards: (typeof catalogCards.$inferInsert)[];
  cardMarketplaceReferences: (typeof cardMarketplaceReferences.$inferInsert)[];
  cardMedia: (typeof cardMedia.$inferInsert)[];
  cardClassifications: (typeof cardClassifications.$inferInsert)[];
  cardDomains: (typeof cardDomains.$inferInsert)[];
  cardTags: (typeof cardTags.$inferInsert)[];
};

const files = await readdir(dataDirectory);
const cardPages = await Promise.all(
  files
    .filter((file) => /^cards-page-\d+\.json$/.test(file))
    .sort(naturalCompare)
    .map(readCardPage),
);
const setPages = await Promise.all(
  files
    .filter((file) => /^sets-page-\d+\.json$/.test(file))
    .sort(naturalCompare)
    .map(readSetPage),
);
if (cardPages.length === 0 || setPages.length === 0)
  throw new Error("Expected card and set pages in data/.");
assertComplete(cardPages, "card");
assertComplete(setPages, "set");
const cards = cardPages.flatMap((page) => page.items);
const sets = setPages.flatMap((page) => page.items);
assertUnique(cards, (card) => card.id, "card id");
assertUnique(sets, (cardSet) => cardSet.set_id, "set code");
const setCodes = new Set(sets.map((cardSet) => cardSet.set_id));
for (const card of cards)
  if (!setCodes.has(card.set.set_id))
    throw new Error(`Card ${card.id} refers to missing set ${card.set.set_id}.`);
const seed = buildSeed(cards, sets);
assertValid(seed);
const version = createHash("sha256").update(JSON.stringify(seed)).digest("hex");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated by scripts/generate-catalog-seed.ts. Do not edit manually.\nexport const CATALOG_SEED_VERSION = ${JSON.stringify(version)} as const;\nexport const catalogSeed = ${JSON.stringify(seed, null, 2)} as const;\n`,
);
console.log(
  `Generated ${outputPath} with ${seed.catalogCards.length} cards (${version.slice(0, 12)}).`,
);

async function readCardPage(file: string): Promise<Page<RawCard>> {
  return pageSchema(rawCardSchema).parse(
    JSON.parse(await readFile(join(dataDirectory, file), "utf8")),
  );
}
async function readSetPage(file: string): Promise<Page<RawSet>> {
  return pageSchema(rawSetSchema).parse(
    JSON.parse(await readFile(join(dataDirectory, file), "utf8")),
  );
}
function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true });
}
function assertComplete<Item>(pages: readonly Page<Item>[], label: string): void {
  if (pages.reduce((count, page) => count + page.items.length, 0) !== pages.at(0)?.total)
    throw new Error(`Incomplete ${label} pages.`);
}
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

function buildSeed(cards: readonly RawCard[], sets: readonly RawSet[]): Seed {
  const cardSets = sets
    .map((value) => ({
      code: value.set_id,
      sourceId: value.id,
      name: value.name,
      declaredCardCount: value.card_count,
      publishedOn: value.published_on,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
  const types = new Map<string, Taxonomy>();
  const supertypes = new Map<string, Taxonomy>();
  const rarities = new Map<string, Taxonomy>();
  const domains = new Map<string, Taxonomy>();
  const tags = new Map<string, Taxonomy>();
  const catalogCards: Seed["catalogCards"] = [];
  const cardMarketplaceReferences: Seed["cardMarketplaceReferences"] = [];
  const cardMedia: Seed["cardMedia"] = [];
  const cardClassifications: Seed["cardClassifications"] = [];
  const cardDomains: Seed["cardDomains"] = [];
  const cardTags: Seed["cardTags"] = [];
  for (const card of [...cards].sort((left, right) => left.id.localeCompare(right.id))) {
    add(types, card.classification.type);
    add(rarities, card.classification.rarity);
    if (card.classification.supertype) add(supertypes, card.classification.supertype);
    catalogCards.push({
      id: card.id,
      riftboundId: card.riftbound_id,
      setCode: card.set.set_id,
      collectorNumber: card.collector_number,
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
      isOvernumbered: card.metadata.overnumbered,
      isSignature: card.metadata.signature,
      sourceUpdatedAt: card.metadata.updated_on,
    });
    cardClassifications.push({
      cardId: card.id,
      typeId: card.classification.type,
      supertypeId: card.classification.supertype ?? null,
      rarityId: card.classification.rarity,
    });
    const image = parseImageUrl(card.media.image_url);
    cardMedia.push({
      cardId: card.id,
      imageAssetId: image.assetId,
      imageWidth: image.dimensions.width,
      imageHeight: image.dimensions.height,
      artist: card.media.artist ?? null,
      accessibilityText: card.media.accessibility_text ?? null,
    });
    cardMarketplaceReferences.push(
      ...marketplaces<Seed["cardMarketplaceReferences"][number]>(
        card,
        (marketplace, externalId) => ({ cardId: card.id, marketplace, externalId }),
      ),
    );
    for (const domainId of card.classification.domain) {
      add(domains, domainId);
      cardDomains.push({ cardId: card.id, domainId });
    }
    for (const tagId of card.tags) {
      add(tags, tagId);
      cardTags.push({ cardId: card.id, tagId });
    }
  }
  return {
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
    rarities: taxonomyRows(rarities).map((rarity, sortOrder) => ({ ...rarity, sortOrder })),
    domains: taxonomyRows(domains),
    tags: taxonomyRows(tags),
    catalogCards,
    cardMarketplaceReferences: uniqueBy(cardMarketplaceReferences, (row) => [
      row.cardId,
      row.marketplace,
      row.externalId,
    ]),
    cardMedia,
    cardClassifications,
    cardDomains: uniqueBy(cardDomains, (row) => [row.cardId, row.domainId]),
    cardTags: uniqueBy(cardTags, (row) => [row.cardId, row.tagId]),
  };
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
  seed.catalogCards.forEach((row) => catalogCardInsertSchema.parse(row));
  seed.cardMarketplaceReferences.forEach((row) => cardMarketplaceReferenceInsertSchema.parse(row));
  seed.cardMedia.forEach((row) => cardMediaInsertSchema.parse(row));
  seed.cardClassifications.forEach((row) => cardClassificationInsertSchema.parse(row));
  seed.cardDomains.forEach((row) => cardDomainInsertSchema.parse(row));
  seed.cardTags.forEach((row) => cardTagInsertSchema.parse(row));
}
