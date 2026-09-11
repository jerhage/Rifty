import { activeFilterCount } from "@/features/catalog/presentation/catalog-query-criteria";

describe("active filter count", () => {
  it("should count nothing when no facet is set", () => {
    expect(activeFilterCount({})).toBe(0);
  });

  it("should count every selection within a facet, not the facet itself", () => {
    expect(activeFilterCount({ keywordIds: ["shield", "tank", "vision"] })).toBe(3);
  });

  it("should add selections across facets", () => {
    expect(
      activeFilterCount({
        keywordIds: ["shield", "tank"],
        setCodes: ["OGN"],
        energy: { type: "atLeast", value: 3 },
      }),
    ).toBe(4);
  });

  it("should count an attribute range once whatever its bounds", () => {
    expect(activeFilterCount({ energy: { type: "between", minimum: 2, maximum: 5 } })).toBe(1);
  });
});
