import type { Card } from "@/features/catalog/card/card";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { ZONE_RULES } from "@/features/deck/deck/deck-legality";

interface ZonePoolFilters {
  readonly query: string;
  readonly domainIds: readonly CardDomain[];
  readonly keywordIds: readonly string[];
  readonly typeIds: readonly CardType[];
}

const EMPTY_POOL_FILTERS: ZonePoolFilters = {
  query: "",
  domainIds: [],
  keywordIds: [],
  typeIds: [],
};

type ZonePoolLayout = "list" | "grid";

type ZonePoolView = "pool" | "inDeck" | "roles";

function poolCardSubtitle(card: Card): string {
  const energy = card.attributes.energy === null ? null : `${card.attributes.energy}E`;
  const might = card.attributes.might === null ? null : `${card.attributes.might}M`;

  return [card.classification.typeId, energy, might]
    .filter((part): part is string => part !== null)
    .join(" · ");
}

/** A deck plays within its legend's domains, so the pool starts narrowed to them. */
function defaultPoolFilters(legend: Card | null): ZonePoolFilters {
  return { ...EMPTY_POOL_FILTERS, domainIds: legend ? [...legend.domainIds] : [] };
}

/** Card types a zone will accept. Runes and battlefields take exactly one, so they offer no choice. */
function zoneCardTypes(section: DeckSection): readonly CardType[] {
  if (section === "runeDeck") return ["Rune"];
  if (section === "battlefield") return ["Battlefield"];

  return ["Unit", "Spell", "Gear"];
}

function allowsTypeChoice(section: DeckSection): boolean {
  return zoneCardTypes(section).length > 1;
}

function zoneRuleSummary(section: DeckSection): string {
  const rule = ZONE_RULES.find((candidate) => candidate.section === section);

  if (!rule) return "";

  const copies =
    rule.copyLimit === null
      ? "no copy limit"
      : rule.copyLimit === 1
        ? "1 each"
        : `max ${rule.copyLimit} each`;

  return `${rule.requiredCount} cards · ${copies}`;
}

function searchHint(section: DeckSection): string {
  const rule = ZONE_RULES.find((candidate) => candidate.section === section);

  return `Search ${rule ? rule.label.toLowerCase() : "cards"}`;
}

function poolCriteria(
  section: DeckSection,
  filters: ZonePoolFilters,
): Omit<CardListCriteria, "limit" | "offset"> {
  const query = filters.query.trim();
  const chosenTypes = filters.typeIds.filter((type) => zoneCardTypes(section).includes(type));

  return {
    typeIds: chosenTypes.length > 0 ? chosenTypes : [...zoneCardTypes(section)],
    // A deck plays anything inside its legend's domains, so several domains mean any of them.
    anyDomainIds: filters.domainIds.length > 0 ? [...filters.domainIds] : undefined,
    keywordIds: filters.keywordIds.length > 0 ? [...filters.keywordIds] : undefined,
    search: query ? { type: "nameOrRulesText", text: query } : undefined,
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
  poolCardSubtitle,
  poolCriteria,
  searchHint,
  zoneCardTypes,
  zoneRuleSummary,
};
export type { ZonePoolFilters, ZonePoolLayout, ZonePoolView };
