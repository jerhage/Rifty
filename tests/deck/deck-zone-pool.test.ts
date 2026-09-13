import {
  DEFAULT_POOL_SORT,
  defaultPoolFilters,
  legendCriteria,
  poolCriteria,
  zonePoolViewChoice,
} from "@/features/deck/presentation/deck-zone-pool";

import { card } from "../card/fixtures";

const legend = card("legend", "OGN", { domainIds: ["Fury", "Order"] });

describe("deck zone pool", () => {
  it("should open on the legend's domains", () => {
    expect(defaultPoolFilters(legend).domainIds).toEqual(["Fury", "Order"]);
    expect(defaultPoolFilters(null).domainIds).toEqual([]);
  });

  it("should ask the query for any of the chosen domains, never all of them", () => {
    const one = poolCriteria(
      "mainDeck",
      { domainIds: ["Fury"], keywordIds: [], typeIds: [] },
      "",
      undefined,
    );
    const two = poolCriteria("mainDeck", defaultPoolFilters(legend), "", undefined);

    expect(one.anyDomainIds).toEqual(["Fury"]);
    expect(two.anyDomainIds).toEqual(["Fury", "Order"]);
    // domainIds is all-of, which would match only cards carrying both.
    expect(one.domainIds).toBeUndefined();
    expect(two.domainIds).toBeUndefined();
  });

  it("should ask for legends carrying every chosen domain", () => {
    const criteria = legendCriteria("", ["Calm", "Mind"]);

    // A legend pick is a domain pair, so this is all-of rather than the pool's any-of.
    expect(criteria.domainIds).toEqual(["Calm", "Mind"]);
    expect(criteria.anyDomainIds).toBeUndefined();
    expect(criteria.typeIds).toEqual(["Legend"]);
  });

  it("should search legends by name or rules text", () => {
    expect(legendCriteria("  volibear  ", []).search).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
    expect(legendCriteria("   ", []).search).toBeUndefined();
  });

  it("should ask the query for any of the chosen keywords", () => {
    const filters = { ...defaultPoolFilters(legend), keywordIds: ["shield", "tank"] };

    expect(poolCriteria("mainDeck", filters, "", undefined).keywordIds).toEqual(["shield", "tank"]);
    expect(
      poolCriteria("mainDeck", defaultPoolFilters(legend), "", undefined).keywordIds,
    ).toBeUndefined();
  });

  it("should search the pool by name or rules text, apart from the filters", () => {
    const filters = defaultPoolFilters(legend);

    expect(poolCriteria("mainDeck", filters, "  volibear  ", undefined).search).toEqual({
      type: "nameOrRulesText",
      text: "volibear",
    });
    expect(poolCriteria("mainDeck", filters, "   ", undefined).search).toBeUndefined();
  });

  it("should carry the ordering the pool was given into the query", () => {
    const filters = defaultPoolFilters(legend);

    expect(
      poolCriteria("mainDeck", filters, "", { type: "energy", direction: "ascending" }).sort,
    ).toEqual({ type: "energy", direction: "ascending" });
    expect(poolCriteria("mainDeck", filters, "", undefined).sort).toBeUndefined();
  });

  it("should open the pool in the same order the catalog opens in", () => {
    expect(DEFAULT_POOL_SORT).toEqual({ type: "name", direction: "ascending" });
  });

  it("should limit each zone to the card types it accepts", () => {
    expect(poolCriteria("runeDeck", defaultPoolFilters(null), "", undefined).typeIds).toEqual([
      "Rune",
    ]);
    expect(poolCriteria("battlefield", defaultPoolFilters(null), "", undefined).typeIds).toEqual([
      "Battlefield",
    ]);
    expect(poolCriteria("mainDeck", defaultPoolFilters(null), "", undefined).typeIds).toEqual([
      "Unit",
      "Spell",
      "Gear",
    ]);
  });
});

describe("the views the zone pool offers", () => {
  it("should offer all three views when the pool is stacked above nothing", () => {
    expect(zonePoolViewChoice("pool", "phone").options).toEqual(["pool", "inDeck", "roles"]);
    expect(zonePoolViewChoice("inDeck", "phone").shown).toBe("inDeck");
  });

  it("should drop the in-deck tab once the deck stands in its own column", () => {
    expect(zonePoolViewChoice("pool", "tablet").options).toEqual(["pool", "roles"]);
  });

  it("should show a view that is still offered when the stored one is not", () => {
    expect(zonePoolViewChoice("inDeck", "tablet").shown).toBe("pool");
  });

  it("should leave a view the columns still offer exactly where it was", () => {
    expect(zonePoolViewChoice("roles", "tablet").shown).toBe("roles");
    expect(zonePoolViewChoice("pool", "tablet").shown).toBe("pool");
  });

  it("should hand back the stored view when the columns give way to one again", () => {
    const stored = "inDeck";

    expect(zonePoolViewChoice(stored, "tablet").shown).toBe("pool");
    expect(zonePoolViewChoice(stored, "phone").shown).toBe("inDeck");
  });
});
