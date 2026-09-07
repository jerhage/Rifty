import { match } from "ts-pattern";

import type {
  CardListCriteria,
  CardNumericFilter,
} from "@/features/catalog/card/card-list-criteria";
import type { SetCode } from "@/features/catalog/value-objects/set-code";

/** The catalog query as the UI holds it: everything except the paging the data component owns. */
type CatalogQueryCriteria = Omit<CardListCriteria, "limit" | "offset">;

type NumericAttribute = "energy" | "might" | "power";

function toggleSet(criteria: CatalogQueryCriteria, setCode: SetCode): CatalogQueryCriteria {
  const currentCodes = criteria.setCodes ?? [];
  const nextCodes = currentCodes.includes(setCode)
    ? currentCodes.filter((code) => code !== setCode)
    : [...currentCodes, setCode];

  return { ...criteria, setCodes: nextCodes.length === 0 ? undefined : nextCodes };
}

function setMinimum(
  criteria: CatalogQueryCriteria,
  property: NumericAttribute,
  value: string,
): CatalogQueryCriteria {
  const parsedValue = parseNonnegativeInteger(value);

  return {
    ...criteria,
    [property]: parsedValue === undefined ? undefined : { type: "atLeast", value: parsedValue },
  };
}

function parseNonnegativeInteger(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;

  return Number(value);
}

function minimumValue(filter: CardNumericFilter | undefined): string {
  return match(filter)
    .with({ type: "atLeast" }, ({ value }) => String(value))
    .otherwise(() => "");
}

/**
 * How many advanced facets the sheet currently constrains. Domains and card types are excluded:
 * they live in the chips above the grid, where their state is already visible.
 */
function activeFilterCount(criteria: CatalogQueryCriteria): number {
  const facets = [
    criteria.setCodes?.length ?? 0,
    criteria.rarityIds?.length ?? 0,
    criteria.supertypeIds?.length ?? 0,
    criteria.tagIds?.length ?? 0,
    criteria.energy === undefined ? 0 : 1,
    criteria.might === undefined ? 0 : 1,
    criteria.power === undefined ? 0 : 1,
  ];

  return facets.filter((count) => count > 0).length;
}

export { activeFilterCount, minimumValue, setMinimum, toggleSet };
export type { CatalogQueryCriteria, NumericAttribute };
