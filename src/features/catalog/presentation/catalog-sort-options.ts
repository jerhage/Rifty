import { match } from "ts-pattern";

import type { CardSort } from "@/features/catalog/card/card-list-criteria";

/** Derived from the domain union so presentation never redeclares the direction vocabulary. */
type CardSortDirection = Extract<CardSort, { direction: unknown }>["direction"];
type CatalogSortId = "catalogOrder" | "name" | "energy" | "might" | "power";

interface CatalogSortOption {
  readonly id: CatalogSortId;
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

const SORT_OPTIONS: readonly CatalogSortOption[] = [
  {
    id: "catalogOrder",
    label: "Catalog order",
    note: "set and collector number",
    defaultDirection: null,
    descendingLabel: "Last set first",
    ascendingLabel: "First set first",
  },
  {
    id: "name",
    label: "Name",
    note: "alphabetical",
    defaultDirection: "ascending",
    descendingLabel: "Z → A",
    ascendingLabel: "A → Z",
  },
  {
    id: "energy",
    label: "Energy cost",
    note: "curve position",
    defaultDirection: "ascending",
    descendingLabel: "Most expensive",
    ascendingLabel: "Cheapest first",
  },
  {
    id: "might",
    label: "Might",
    note: "body size",
    defaultDirection: "descending",
    descendingLabel: "Biggest first",
    ascendingLabel: "Smallest first",
  },
  {
    id: "power",
    label: "Power",
    note: "power value",
    defaultDirection: "descending",
    descendingLabel: "Highest first",
    ascendingLabel: "Lowest first",
  },
];

/**
 * Catalog order is carried as an absent sort rather than an explicit one, which is how the catalog
 * query has always expressed "no ordering asked for".
 */
function sortIdOf(sort: CardSort | undefined): CatalogSortId {
  return sort === undefined ? "catalogOrder" : sort.type;
}

function sortOptionFor(sort: CardSort | undefined): CatalogSortOption {
  const id = sortIdOf(sort);

  return SORT_OPTIONS.find((option) => option.id === id) ?? SORT_OPTIONS[0];
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

function buildSort(id: CatalogSortId, direction: CardSortDirection): CardSort | undefined {
  return match(id)
    .with("catalogOrder", () => undefined)
    .with("name", () => ({ type: "name", direction }) as const)
    .with("energy", () => ({ type: "energy", direction }) as const)
    .with("might", () => ({ type: "might", direction }) as const)
    .with("power", () => ({ type: "power", direction }) as const)
    .exhaustive();
}

/** Choosing an attribute adopts its natural direction rather than keeping the previous one. */
function sortForId(id: CatalogSortId): CardSort | undefined {
  const option = SORT_OPTIONS.find((candidate) => candidate.id === id);

  return option?.defaultDirection === null || option === undefined
    ? undefined
    : buildSort(id, option.defaultDirection);
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
  sortDirectionArrow,
  sortDirectionOf,
  sortForId,
  sortIdOf,
  sortOptionFor,
  sortOptionLabel,
  SORT_OPTIONS,
  sortWithDirection,
  toggledSort,
};
export type { CardSortDirection, CatalogSortId, CatalogSortOption };
