import { match } from "ts-pattern";

import type { Card } from "@/features/card/card";
import type { CardListCriteria, CardSort } from "@/features/card/card-list-criteria";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { sortForId } from "@/features/card/presentation/card-sort-options";
import type { CardType } from "@/features/card/value-objects/card-type";
import type { DeckSection } from "@/features/deck/deck/deck";
import { sectionRule } from "@/features/deck/deck/deck-legality";
import type { LayoutClass } from "@/hooks/use-layout-size";

interface SectionPoolFilters {
  readonly domainIds: readonly CardDomain[];
  readonly keywordIds: readonly string[];
  readonly typeIds: readonly CardType[];
}

const EMPTY_POOL_FILTERS: SectionPoolFilters = {
  domainIds: [],
  keywordIds: [],
  typeIds: [],
};

const LEGEND_SECTION_TYPES: readonly CardType[] = ["Legend"];
const RUNE_SECTION_TYPES: readonly CardType[] = ["Rune"];
const BATTLEFIELD_SECTION_TYPES: readonly CardType[] = ["Battlefield"];
const PLAYABLE_SECTION_TYPES: readonly CardType[] = ["Unit", "Spell", "Gear"];

type SectionPoolLayout = "list" | "grid";

type SectionPoolView = "pool" | "inDeck" | "roles";

const STACKED_POOL_VIEWS: readonly SectionPoolView[] = ["pool", "inDeck", "roles"];
const COLUMN_POOL_VIEWS: readonly SectionPoolView[] = ["pool", "roles"];

interface SectionPoolViewChoice {
  readonly options: readonly SectionPoolView[];
  readonly shown: SectionPoolView;
}

/**
 * Two columns keep the deck's contents on screen, so "in deck" stops being somewhere to switch to.
 * The stored view is read rather than rewritten, so one column gets it back exactly as it was left.
 */
function sectionPoolViewChoice(
  view: SectionPoolView,
  layoutClass: LayoutClass,
): SectionPoolViewChoice {
  return match(layoutClass)
    .with("phone", () => ({ options: STACKED_POOL_VIEWS, shown: view }))
    .with("tablet", () => ({ options: COLUMN_POOL_VIEWS, shown: viewBesideTheDeck(view) }))
    .exhaustive();
}

function viewBesideTheDeck(view: SectionPoolView): SectionPoolView {
  return match<SectionPoolView, SectionPoolView>(view)
    .with("inDeck", () => "pool")
    .with("pool", "roles", (kept) => kept)
    .exhaustive();
}

/** The pool opens alphabetically, the order the catalog opens in and the one the deck lists in. */
const DEFAULT_POOL_SORT: CardSort | undefined = sortForId("name");

/** A deck plays within its legend's domains, so the pool starts narrowed to them. */
function defaultPoolFilters(legend: Card | null): SectionPoolFilters {
  return { ...EMPTY_POOL_FILTERS, domainIds: legend ? [...legend.domainIds] : [] };
}

/** Card types a section will accept. A legend, a rune and a battlefield are each their own type. */
function sectionCardTypes(section: DeckSection): readonly CardType[] {
  return match(section)
    .with("legend", () => LEGEND_SECTION_TYPES)
    .with("runeDeck", () => RUNE_SECTION_TYPES)
    .with("battlefield", () => BATTLEFIELD_SECTION_TYPES)
    .with("mainDeck", "sideboard", () => PLAYABLE_SECTION_TYPES)
    .exhaustive();
}

function allowsTypeChoice(section: DeckSection): boolean {
  return sectionCardTypes(section).length > 1;
}

function sectionRuleSummary(section: DeckSection): string {
  const rule = sectionRule(section);

  const copies = match(rule.copyAllowance)
    .with({ type: "unlimited" }, () => "no copy limit")
    .with({ type: "limited", copies: 1 }, () => "1 each")
    .with({ type: "limited" }, ({ copies: limit }) => `max ${limit} each`)
    .exhaustive();

  return `${rule.requiredCount} ${rule.requiredCount === 1 ? "card" : "cards"} · ${copies}`;
}

function searchHint(section: DeckSection): string {
  return `Search ${sectionRule(section).label.toLowerCase()}`;
}

function poolCriteria(
  section: DeckSection,
  filters: SectionPoolFilters,
  query: string,
  sort: CardSort | undefined,
): Omit<CardListCriteria, "limit" | "offset"> {
  const text = query.trim();
  const chosenTypes = filters.typeIds.filter((type) => sectionCardTypes(section).includes(type));

  return {
    typeIds: chosenTypes.length > 0 ? chosenTypes : [...sectionCardTypes(section)],
    // A deck plays anything inside its legend's domains, so several domains mean any of them.
    anyDomainIds: filters.domainIds.length > 0 ? [...filters.domainIds] : undefined,
    keywordIds: filters.keywordIds.length > 0 ? [...filters.keywordIds] : undefined,
    search: text ? { type: "nameOrRulesText", text } : undefined,
    sort,
  };
}

function legendCriteria(
  query: string,
  domainIds: readonly CardDomain[],
): Omit<CardListCriteria, "limit" | "offset"> {
  const text = query.trim();

  return {
    typeIds: [...LEGEND_SECTION_TYPES],
    // All of them: picking Calm and Mind asks for a legend that carries both, not either.
    domainIds: domainIds.length > 0 ? [...domainIds] : undefined,
    search: text ? { type: "nameOrRulesText", text } : undefined,
  };
}

function activePoolFilterCount(filters: SectionPoolFilters): number {
  return filters.domainIds.length + filters.keywordIds.length + filters.typeIds.length;
}

export {
  DEFAULT_POOL_SORT,
  EMPTY_POOL_FILTERS,
  activePoolFilterCount,
  allowsTypeChoice,
  defaultPoolFilters,
  legendCriteria,
  poolCriteria,
  searchHint,
  sectionCardTypes,
  sectionPoolViewChoice,
  sectionRuleSummary,
};
export type { SectionPoolFilters, SectionPoolLayout, SectionPoolView, SectionPoolViewChoice };
