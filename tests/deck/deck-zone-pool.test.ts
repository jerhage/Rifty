import {
  defaultPoolFilters,
  legendCriteria,
  poolCriteria,
} from "@/features/deck/presentation/deck-zone-pool";

import { card } from "../catalog/fixtures";

const legend = card("legend", "OGN", { domainIds: ["Fury", "Order"] });

describe("deck zone pool", () => {
  it("opens on the legend's domains", () => {
    expect(defaultPoolFilters(legend).domainIds).toEqual(["Fury", "Order"]);
    expect(defaultPoolFilters(null).domainIds).toEqual([]);
  });

  it("asks the query for any of the chosen domains, never all of them", () => {
    const one = poolCriteria("mainDeck", { domainIds: ["Fury"], keywordIds: [], typeIds: [] }, "");
    const two = poolCriteria("mainDeck", defaultPoolFilters(legend), "");

    expect(one.anyDomainIds).toEqual(["Fury"]);
    expect(two.anyDomainIds).toEqual(["Fury", "Order"]);
    // domainIds is all-of, which would match only cards carrying both.
    expect(one.domainIds).toBeUndefined();
    expect(two.domainIds).toBeUndefined();
  });

  it("asks for legends carrying every chosen domain", () => {
    const criteria = legendCriteria("", ["Calm", "Mind"]);

    // A legend pick is a domain pair, so this is all-of rather than the pool's any-of.
    expect(criteria.domainIds).toEqual(["Calm", "Mind"]);
    expect(criteria.anyDomainIds).toBeUndefined();
    expect(criteria.typeIds).toEqual(["Legend"]);
  });

  it("searches legends by name or rules text", () => {
    expect(legendCriteria("  volibear  ", []).search).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
    expect(legendCriteria("   ", []).search).toBeUndefined();
  });

  it("asks the query for any of the chosen keywords", () => {
    const filters = { ...defaultPoolFilters(legend), keywordIds: ["shield", "tank"] };

    expect(poolCriteria("mainDeck", filters, "").keywordIds).toEqual(["shield", "tank"]);
    expect(poolCriteria("mainDeck", defaultPoolFilters(legend), "").keywordIds).toBeUndefined();
  });

  it("searches the pool by name or rules text, apart from the filters", () => {
    const filters = defaultPoolFilters(legend);

    expect(poolCriteria("mainDeck", filters, "  volibear  ").search).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
    expect(poolCriteria("mainDeck", filters, "   ").search).toBeUndefined();
  });

  it("limits each zone to the card types it accepts", () => {
    expect(poolCriteria("runeDeck", defaultPoolFilters(null), "").typeIds).toEqual(["Rune"]);
    expect(poolCriteria("battlefield", defaultPoolFilters(null), "").typeIds).toEqual([
      "Battlefield",
    ]);
    expect(poolCriteria("mainDeck", defaultPoolFilters(null), "").typeIds).toEqual([
      "Unit",
      "Spell",
      "Gear",
    ]);
  });
});
