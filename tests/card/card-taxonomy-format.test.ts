import {
  cardAttributeParts,
  cardDomainNames,
  formatCardAttributes,
  formatCardTypeAndAttributes,
  spokenCardTypeAndAttributes,
} from "@/features/card/presentation/card-taxonomy-format";

import { card } from "./fixtures";

const ZED = card("ogn-001", "OGN", {
  name: "Zed",
  attributes: { energy: 3, might: 5, power: null },
  domainIds: ["Fury"],
});

describe("card attribute parts", () => {
  it("should spell out every attribute the card carries", () => {
    expect(cardAttributeParts(ZED)).toEqual(["3 energy", "5 might"]);
  });

  it("should leave out an attribute the card does not carry", () => {
    const spell = card("ogn-050", "OGN", {
      attributes: { energy: 2, might: null, power: null },
    });

    expect(cardAttributeParts(spell)).toEqual(["2 energy"]);
  });

  it("should join the visible stats line with the separator the row shows", () => {
    expect(formatCardAttributes(ZED)).toBe("3 energy · 5 might");
  });
});

describe("card type and attributes", () => {
  it("should keep the compact form for the visible subline", () => {
    expect(formatCardTypeAndAttributes(ZED)).toBe("Unit · 3E · 5M");
  });

  it("should spell the same line out for a screen reader", () => {
    expect(spokenCardTypeAndAttributes(ZED)).toBe("Unit, 3 energy, 5 might");
  });
});

describe("card domain names", () => {
  it("should give one name per domain so a caller chooses its own separator", () => {
    expect(cardDomainNames(["Fury", "Body"])).toEqual(["Fury", "Body"]);
  });

  it("should name a card with no domain colorless", () => {
    expect(cardDomainNames([])).toEqual(["Colorless"]);
  });
});
