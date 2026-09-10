import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardListCriteria } from "@/features/card/card-list-criteria";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import type { CardType } from "@/features/card/value-objects/card-type";
import { zoneRule, type ZoneSection } from "@/features/deck/deck/deck-legality";

interface ZonePoolFilters {
  readonly domainIds: readonly CardDomain[];
  readonly keywordIds: readonly string[];
  readonly typeIds: readonly CardType[];
}

const EMPTY_POOL_FILTERS: ZonePoolFilters = {
  domainIds: [],
  keywordIds: [],
  typeIds: [],
};

const RUNE_ZONE_TYPES: readonly CardType[] = ["Rune"];
const BATTLEFIELD_ZONE_TYPES: readonly CardType[] = ["Battlefield"];
const PLAYABLE_ZONE_TYPES: readonly CardType[] = ["Unit", "Spell", "Gear"];

type ZonePoolLayout = "list" | "grid";

type ZonePoolView = "pool" | "inDeck" | "roles";

/** A deck plays within its legend's domains, so the pool starts narrowed to them. */
function defaultPoolFilters(legend: Card | null): ZonePoolFilters {
  return { ...EMPTY_POOL_FILTERS, domainIds: legend ? [...legend.domainIds] : [] };
}

/** Card types a zone will accept. Runes and battlefields take exactly one, so they offer no choice. */
function zoneCardTypes(section: ZoneSection): readonly CardType[] {
  return match(section)
    .with("runeDeck", () => RUNE_ZONE_TYPES)
    .with("battlefield", () => BATTLEFIELD_ZONE_TYPES)
    .with("mainDeck", "sideboard", () => PLAYABLE_ZONE_TYPES)
    .exhaustive();
}

function allowsTypeChoice(section: ZoneSection): boolean {
  return zoneCardTypes(section).length > 1;
}

function zoneRuleSummary(section: ZoneSection): string {
  const rule = zoneRule(section);

  const copies = match(rule.copyAllowance)
    .with({ type: "unlimited" }, () => "no copy limit")
    .with({ type: "limited", copies: 1 }, () => "1 each")
    .with({ type: "limited" }, ({ copies: limit }) => `max ${limit} each`)
    .exhaustive();

  return `${rule.requiredCount} cards · ${copies}`;
}

function searchHint(section: ZoneSection): string {
  return `Search ${zoneRule(section).label.toLowerCase()}`;
}

function poolCriteria(
  section: ZoneSection,
  filters: ZonePoolFilters,
  query: string,
): Omit<CardListCriteria, "limit" | "offset"> {
  const text = query.trim();
  const chosenTypes = filters.typeIds.filter((type) => zoneCardTypes(section).includes(type));

  return {
    typeIds: chosenTypes.length > 0 ? chosenTypes : [...zoneCardTypes(section)],
    // A deck plays anything inside its legend's domains, so several domains mean any of them.
    anyDomainIds: filters.domainIds.length > 0 ? [...filters.domainIds] : undefined,
    keywordIds: filters.keywordIds.length > 0 ? [...filters.keywordIds] : undefined,
    search: text ? { type: "nameOrRulesText", text } : undefined,
  };
}

function legendCriteria(
  query: string,
  domainIds: readonly CardDomain[],
): Omit<CardListCriteria, "limit" | "offset"> {
  const text = query.trim();

  return {
    typeIds: ["Legend"],
    // All of them: picking Calm and Mind asks for a legend that carries both, not either.
    domainIds: domainIds.length > 0 ? [...domainIds] : undefined,
    search: text ? { type: "nameOrRulesText", text } : undefined,
  };
}

function activePoolFilterCount(filters: ZonePoolFilters): number {
  return filters.domainIds.length + filters.keywordIds.length + filters.typeIds.length;
}

export {
  activePoolFilterCount,
  allowsTypeChoice,
  defaultPoolFilters,
  EMPTY_POOL_FILTERS,
  legendCriteria,
  poolCriteria,
  searchHint,
  zoneCardTypes,
  zoneRuleSummary,
};
export type { ZonePoolFilters, ZonePoolLayout, ZonePoolView };
