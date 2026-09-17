import { championCriteria } from "@/features/deck/presentation/data/champion-pool-data";
import { NOT_PICKED, pickOf } from "@/features/deck/presentation/deck-build-steps";

import { card, taxonomyId } from "../card/fixtures";

const legend = card("ogn-legend", "OGN", {
  name: "Yasuo, Unforgiven",
  championName: "Yasuo",
  domainIds: ["Fury", "Body"],
  classification: {
    typeId: "Legend",
    supertypeId: taxonomyId("Champion"),
    rarityId: taxonomyId("rare"),
  },
});
const legendWithoutChampion = card("ogn-legend-plain", "OGN", {
  name: "Nameless Legend",
  classification: { typeId: "Legend", supertypeId: null, rarityId: taxonomyId("rare") },
});

describe("champion pool criteria", () => {
  it("should name the unit type as well as the champion supertype with no legend picked", () => {
    expect(championCriteria(NOT_PICKED)).toEqual({ typeIds: ["Unit"], supertypeIds: ["Champion"] });
  });

  it("should name the unit type on the pool a legend narrows", () => {
    expect(championCriteria(pickOf(legend))).toEqual({
      typeIds: ["Unit"],
      supertypeIds: ["Champion"],
      championNames: ["Yasuo"],
      withinDomainIds: ["Fury", "Body"],
    });
  });

  it("should fall back to every champion unit when the legend names no champion", () => {
    expect(championCriteria(pickOf(legendWithoutChampion))).toEqual({
      typeIds: ["Unit"],
      supertypeIds: ["Champion"],
    });
  });
});
