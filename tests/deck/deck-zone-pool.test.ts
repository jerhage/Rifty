import {
  defaultPoolFilters,
  matchesPoolFilters,
  poolCriteria,
} from "@/features/deck/presentation/deck-zone-pool";

import { card } from "../catalog/fixtures";

const legend = card("legend", "OGN", { domainIds: ["Fury", "Order"] });
const fury = card("fury", "OGN", { domainIds: ["Fury"] });
const order = card("order", "OGN", { domainIds: ["Order"] });
const calm = card("calm", "OGN", { domainIds: ["Calm"] });

describe("deck zone pool", () => {
  it("opens on the legend's domains", () => {
    expect(defaultPoolFilters(legend).domainIds).toEqual(["Fury", "Order"]);
    expect(defaultPoolFilters(null).domainIds).toEqual([]);
  });

  it("treats several domains as any of them, not all of them", () => {
    const filters = defaultPoolFilters(legend);

    expect(matchesPoolFilters(fury, filters)).toBe(true);
    expect(matchesPoolFilters(order, filters)).toBe(true);
    expect(matchesPoolFilters(calm, filters)).toBe(false);
  });

  it("only narrows the query by domain when one is chosen", () => {
    const one = poolCriteria("mainDeck", { query: "", domainIds: ["Fury"], typeIds: [] }, 100);
    const two = poolCriteria("mainDeck", defaultPoolFilters(legend), 100);

    expect(one.domainIds).toEqual(["Fury"]);
    // Two domains would be read as all-of by the catalog query, so they are settled in memory.
    expect(two.domainIds).toBeUndefined();
  });

  it("limits each zone to the card types it accepts", () => {
    expect(poolCriteria("runeDeck", defaultPoolFilters(null), 100).typeIds).toEqual(["Rune"]);
    expect(poolCriteria("battlefield", defaultPoolFilters(null), 100).typeIds).toEqual([
      "Battlefield",
    ]);
    expect(poolCriteria("mainDeck", defaultPoolFilters(null), 100).typeIds).toEqual([
      "Unit",
      "Spell",
      "Gear",
    ]);
  });
});
