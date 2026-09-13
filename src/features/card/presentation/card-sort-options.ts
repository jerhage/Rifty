import { match } from "ts-pattern";

import type { CardSort } from "@/features/card/card-list-criteria";

/** Derived from the domain union so presentation never redeclares the direction vocabulary. */
type CardSortDirection = Extract<CardSort, { direction: unknown }>["direction"];
type CardSortId = CardSort["type"];

interface CardSortOption {
  readonly id: CardSortId;
  readonly label: string;
  readonly note: string;
  /**
   * Direction applied when this ordering is first picked, or `null` for an ordering that has no
   * direction to give. Catalog order is the only one of those.
   */
  readonly defaultDirection: CardSortDirection | null;
  /** How each direction reads for this attribute — "Z → A" means nothing for Might. */
  readonly descendingLabel: string;
  readonly ascendingLabel: string;
}

const CARD_SORT_OPTIONS_BY_ID: Readonly<Record<CardSortId, CardSortOption>> = {
  catalogOrder: {
    id: "catalogOrder",
    label: "Catalog order",
    note: "set and collector number",
    defaultDirection: null,
    descendingLabel: "Last set first",
    ascendingLabel: "First set first",
  },
  name: {
    id: "name",
    label: "Name",
    note: "alphabetical",
    defaultDirection: "ascending",
    descendingLabel: "Z → A",
    ascendingLabel: "A → Z",
  },
  energy: {
    id: "energy",
    label: "Energy cost",
    note: "curve position",
    defaultDirection: "ascending",
    descendingLabel: "Most expensive",
    ascendingLabel: "Cheapest first",
  },
  might: {
    id: "might",
    label: "Might",
    note: "body size",
    defaultDirection: "descending",
    descendingLabel: "Biggest first",
    ascendingLabel: "Smallest first",
  },
  power: {
    id: "power",
    label: "Power",
    note: "power value",
    defaultDirection: "descending",
    descendingLabel: "Highest first",
    ascendingLabel: "Lowest first",
  },
};

const CARD_SORT_OPTIONS: readonly CardSortOption[] = [
  CARD_SORT_OPTIONS_BY_ID.catalogOrder,
  CARD_SORT_OPTIONS_BY_ID.name,
  CARD_SORT_OPTIONS_BY_ID.energy,
  CARD_SORT_OPTIONS_BY_ID.might,
  CARD_SORT_OPTIONS_BY_ID.power,
];

function sortOptionForId(id: CardSortId): CardSortOption {
  return CARD_SORT_OPTIONS_BY_ID[id];
}

/**
 * Catalog order is carried as an absent sort rather than an explicit one, which is how a card
 * query has always expressed "no ordering asked for".
 */
function sortIdOf(sort: CardSort | undefined): CardSortId {
  return sort === undefined ? "catalogOrder" : sort.type;
}

function sortOptionFor(sort: CardSort | undefined): CardSortOption {
  return sortOptionForId(sortIdOf(sort));
}

function sortDirectionOf(sort: CardSort | undefined): CardSortDirection | null {
  return match(sort)
    .with(undefined, () => null)
    .with({ type: "catalogOrder" }, () => null)
    .with(
      { type: "name" },
      { type: "energy" },
      { type: "might" },
      { type: "power" },
      ({ direction }) => direction,
    )
    .exhaustive();
}

function buildSort(id: CardSortId, direction: CardSortDirection): CardSort | undefined {
  return match(id)
    .with("catalogOrder", () => undefined)
    .with("name", () => ({ type: "name", direction }) as const)
    .with("energy", () => ({ type: "energy", direction }) as const)
    .with("might", () => ({ type: "might", direction }) as const)
    .with("power", () => ({ type: "power", direction }) as const)
    .exhaustive();
}

/** Choosing an attribute adopts its natural direction rather than keeping the previous one. */
function sortForId(id: CardSortId): CardSort | undefined {
  const { defaultDirection } = sortOptionForId(id);

  return defaultDirection === null ? undefined : buildSort(id, defaultDirection);
}

function sortWithDirection(
  sort: CardSort | undefined,
  direction: CardSortDirection,
): CardSort | undefined {
  return buildSort(sortIdOf(sort), direction);
}

function toggledSort(sort: CardSort | undefined): CardSort | undefined {
  const direction = sortDirectionOf(sort);

  if (direction === null) return sort;

  return sortWithDirection(sort, direction === "descending" ? "ascending" : "descending");
}

function sortOptionLabel(sort: CardSort | undefined): string {
  return sortOptionFor(sort).label;
}

function sortDirectionArrow(sort: CardSort | undefined): string | null {
  const direction = sortDirectionOf(sort);

  if (direction === null) return null;

  return direction === "descending" ? "↓" : "↑";
}

export {
  CARD_SORT_OPTIONS,
  sortDirectionArrow,
  sortDirectionOf,
  sortForId,
  sortIdOf,
  sortOptionFor,
  sortOptionLabel,
  sortWithDirection,
  toggledSort,
};
export type { CardSortDirection, CardSortId, CardSortOption };
