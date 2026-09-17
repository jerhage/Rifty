import type { Card, CardKeyword, CardTaxonomy } from "@/features/card/card";
import { cardIdSchema } from "@/features/card/value-objects/card-id";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { taxonomyIdSchema, type TaxonomyId } from "@/features/card/value-objects/taxonomy-id";
import type { CardSet } from "@/features/set/card-set";
import { setCodeSchema, type SetCode } from "@/features/set/value-objects/set-code";

import { identityName } from "../../scripts/card-derivation";

function carriedKeyword(id: string, name: string, value: number | null = null): CardKeyword {
  return { id, name, value, targets: [{ kind: "self", isToken: false, allegiance: "own" }] };
}

function grantedKeyword(id: string, name: string, value: number | null = null): CardKeyword {
  return { id, name, value, targets: [{ kind: "unit", isToken: false, allegiance: "friendly" }] };
}

function controllerKeyword(id: string, name: string, value: number | null = null): CardKeyword {
  return { id, name, value, targets: [{ kind: "player", isToken: false, allegiance: "own" }] };
}

function tokenKeyword(id: string, name: string, value: number | null = null): CardKeyword {
  return { id, name, value, targets: [{ kind: "unit", isToken: true, allegiance: "own" }] };
}

function setCode(value: string): SetCode {
  return setCodeSchema.parse(value);
}

function taxonomyId(value: string): TaxonomyId {
  return taxonomyIdSchema.parse(value);
}

function taxonomy(id: string, name = id): CardTaxonomy {
  return { id: taxonomyId(id), name };
}

function cardSet(code: string, publishedOn: string, name = code): CardSet {
  return {
    code: setCode(code),
    name,
    declaredCardCount: 100,
    publishedOn,
    marketplaceReferences: [{ marketplace: "tcgplayer", externalId: `tcgplayer-${code}` }],
  };
}

function card(
  printingId: string,
  code: string,
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
      | "speeds"
      | "keywords"
      | "championName"
      | "cardId"
      | "orientation"
      | "tags"
      | "marketplaceReferences"
    >
  > = {},
): Card {
  const name = options.name ?? `Card ${printingId}`;

  return {
    printingId: printingIdSchema.parse(printingId),
    cardId: cardIdSchema.parse(options.cardId ?? identityName(name)),
    riftboundId: `${code.toLowerCase()}-${printingId}-100`,
    setCode: setCode(code),
    collectorNumber: options.collectorNumber ?? "1",
    name,
    cleanName: options.cleanName ?? `Card ${printingId}`,
    attributes: options.attributes ?? { energy: 3, might: 2, power: null },
    rulesText: options.rulesText ?? {
      rich: "<p>Play effect.</p>",
      plain: "Play effect.",
      flavour: null,
    },
    orientation: options.orientation ?? "portrait",
    finish: "standard",
    sourceUpdatedAt: "2026-07-10T22:45:08.861364+00:00",
    classification: options.classification ?? {
      typeId: "Unit",
      supertypeId: null,
      rarity: taxonomy("common", "Common"),
    },
    domainIds: options.domainIds ?? ["Chaos"],
    speeds: options.speeds ?? ["normal"],
    keywords: options.keywords ?? [],
    championName: options.championName ?? null,
    tags: options.tags ?? [],
    imageUrl: `http://localhost:8787/${code.toLowerCase()}-${printingId}-100.webp`,
    marketplaceReferences: options.marketplaceReferences ?? [
      { marketplace: "tcgplayer", externalId: `tcgplayer-${printingId}` },
    ],
  };
}

export {
  card,
  cardSet,
  carriedKeyword,
  controllerKeyword,
  grantedKeyword,
  setCode,
  taxonomy,
  taxonomyId,
  tokenKeyword,
};
