import type { Card, CardKeyword } from "@/features/card/card";
import type { CardSet } from "@/features/set/card-set";

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
      | "speeds"
      | "keywords"
      | "championName"
      | "cardId"
      | "orientation"
      | "tagIds"
      | "marketplaceReferences"
    >
  > = {},
): Card {
  const name = options.name ?? `Card ${id}`;

  return {
    id,
    cardId: options.cardId ?? identityName(name),
    riftboundId: `${setCode.toLowerCase()}-${id}-100`,
    setCode,
    collectorNumber: options.collectorNumber ?? 1,
    name,
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
    speeds: options.speeds ?? ["normal"],
    keywords: options.keywords ?? [],
    championName: options.championName ?? null,
    tagIds: options.tagIds ?? [],
    imageUrl: `http://localhost:8787/${setCode.toLowerCase()}-${id}-100.webp`,
    marketplaceReferences: options.marketplaceReferences ?? [
      { marketplace: "tcgplayer", externalId: `tcgplayer-${id}` },
    ],
  };
}

export { card, cardSet, carriedKeyword, controllerKeyword, grantedKeyword, tokenKeyword };
