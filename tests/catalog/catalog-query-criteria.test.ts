import {
  activeFilterCount,
  toggleOnlyBookmarked,
  type CatalogQueryCriteria,
} from "@/features/catalog/presentation/catalog-query-criteria";

const NO_FACETS: CatalogQueryCriteria = { sort: { type: "name", direction: "ascending" } };

describe("active filter count", () => {
  it("should count nothing when no facet is set", () => {
    expect(activeFilterCount(NO_FACETS)).toBe(0);
  });

  it("should count every selection within a facet, not the facet itself", () => {
    expect(activeFilterCount({ ...NO_FACETS, keywordIds: ["shield", "tank", "vision"] })).toBe(3);
  });

  it("should add selections across facets", () => {
    expect(
      activeFilterCount({
        ...NO_FACETS,
        keywordIds: ["shield", "tank"],
        setCodes: ["OGN"],
        energy: { type: "atLeast", value: 3 },
      }),
    ).toBe(4);
  });

  it("should count an attribute range once whatever its bounds", () => {
    expect(
      activeFilterCount({ ...NO_FACETS, energy: { type: "between", minimum: 2, maximum: 5 } }),
    ).toBe(1);
  });

  it("should count the bookmarked filter beside the sheet's other facets", () => {
    expect(activeFilterCount({ ...NO_FACETS, onlyBookmarked: true, setCodes: ["OGN"] })).toBe(2);
    expect(activeFilterCount({ ...NO_FACETS, onlyBookmarked: undefined })).toBe(0);
  });
});

describe("the bookmarked criterion", () => {
  it("should turn on and off again, leaving every other facet alone", () => {
    const filtered = toggleOnlyBookmarked({ ...NO_FACETS, setCodes: ["OGN"] });

    expect(filtered).toEqual({ ...NO_FACETS, onlyBookmarked: true, setCodes: ["OGN"] });
    expect(toggleOnlyBookmarked(filtered)).toEqual({
      ...NO_FACETS,
      onlyBookmarked: undefined,
      setCodes: ["OGN"],
    });
  });
});
