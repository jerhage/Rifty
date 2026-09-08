import type { Card } from "@/features/catalog/card/card";
import type { CardSet } from "@/features/catalog/set/card-set";

function cardSet(code: string, publishedOn: string, name = code): CardSet {
  return {
    code,
    sourceId: `source-${code}`,
    name,
    declaredCardCount: 100,
    publishedOn,
    marketplaceReferences: [{ marketplace: "tcgplayer", externalId: `tcgplayer-${code}` }],
  };
}

function card(
  id: string,
  setCode: string,
  options: Partial<
    Pick<
      Card,
      | "collectorNumber"
      | "name"
      | "cleanName"
      | "attributes"
      | "rulesText"
      | "classification"
      | "domainIds"
      | "orientation"
      | "tagIds"
      | "marketplaceReferences"
    >
  > = {},
): Card {
  return {
    id,
    riftboundId: `${setCode.toLowerCase()}-${id}-100`,
    setCode,
    collectorNumber: options.collectorNumber ?? 1,
    name: options.name ?? `Card ${id}`,
    cleanName: options.cleanName ?? `Card ${id}`,
    attributes: options.attributes ?? { energy: 3, might: 2, power: null },
    rulesText: options.rulesText ?? {
      rich: "<p>Play effect.</p>",
      plain: "Play effect.",
      flavour: null,
    },
    orientation: options.orientation ?? "portrait",
    isAlternateArt: false,
    isOvernumbered: false,
    isSignature: false,
    sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
    classification: options.classification ?? {
      typeId: "Unit",
      supertypeId: null,
      rarityId: "common",
    },
    domainIds: options.domainIds ?? ["Chaos"],
    tagIds: options.tagIds ?? [],
    imageUrl: `https://images.riftbound-db.com/cards/ogn/${id}.webp`,
    marketplaceReferences: options.marketplaceReferences ?? [
      { marketplace: "tcgplayer", externalId: `tcgplayer-${id}` },
    ],
  };
}

export { card, cardSet };
