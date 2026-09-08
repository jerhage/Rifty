import type { Card } from "@/features/catalog/card/card";
import type { CardListCriteria } from "@/features/catalog/card/card-list-criteria";
import type { CardDomain } from "@/features/catalog/value-objects/card-domain";
import type { CardType } from "@/features/catalog/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { zoneRules } from "@/features/deck/deck/deck-legality";

interface ZonePoolFilters {
  readonly query: string;
  readonly domainIds: readonly CardDomain[];
  readonly typeIds: readonly CardType[];
}

const emptyPoolFilters: ZonePoolFilters = { query: "", domainIds: [], typeIds: [] };

/** A deck plays within its legend's domains, so the pool starts narrowed to them. */
function defaultPoolFilters(legend: Card | null): ZonePoolFilters {
  return { ...emptyPoolFilters, domainIds: legend ? [...legend.domainIds] : [] };
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
  const rule = zoneRules.find((candidate) => candidate.section === section);

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
  const rule = zoneRules.find((candidate) => candidate.section === section);

  return `Search ${rule ? rule.label.toLowerCase() : "cards"}`;
}

function poolCriteria(
  section: DeckSection,
  filters: ZonePoolFilters,
  limit: number,
): CardListCriteria {
  const query = filters.query.trim();
  const chosenTypes = filters.typeIds.filter((type) => zoneCardTypes(section).includes(type));

  return {
    typeIds: chosenTypes.length > 0 ? chosenTypes : [...zoneCardTypes(section)],
    // Several domains mean "any of these", which the criteria's all-of semantics cannot express,
    // so only a single choice narrows the query and the rest is settled by matchesPoolFilters.
    domainIds: filters.domainIds.length === 1 ? [...filters.domainIds] : undefined,
    search: query ? { type: "nameOrRulesText", text: query } : undefined,
    limit,
  };
}

function matchesPoolFilters(card: Card, filters: ZonePoolFilters): boolean {
  if (filters.domainIds.length === 0) return true;

  return card.domainIds.some((domain) => filters.domainIds.includes(domain));
}

function activePoolFilterCount(filters: ZonePoolFilters): number {
  return filters.domainIds.length + filters.typeIds.length;
}

export {
  activePoolFilterCount,
  allowsTypeChoice,
  defaultPoolFilters,
  emptyPoolFilters,
  matchesPoolFilters,
  poolCriteria,
  searchHint,
  zoneCardTypes,
  zoneRuleSummary,
};
export type { ZonePoolFilters };
