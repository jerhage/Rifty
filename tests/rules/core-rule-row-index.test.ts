import { coreRuleRowIndex } from "@/features/rules/presentation/core-rule-row-index";

import { coreRuleDocument, coreRuleNumber } from "./fixtures";

const DOCUMENT = coreRuleDocument([
  { number: "100", kind: "heading", body: "Game Concepts" },
  { number: "101", kind: "heading", body: "Deck Construction" },
  { number: "101.1", body: "Runes pay for costs." },
  { number: "101.2", body: "Recycle a card to draw a card." },
]);

describe("coreRuleRowIndex", () => {
  it("should place every shown rule at its own row, in the order the list holds them", () => {
    const rows = coreRuleRowIndex(DOCUMENT);

    expect(rows.get(coreRuleNumber("100"))).toBe(0);
    expect(rows.get(coreRuleNumber("101"))).toBe(1);
    expect(rows.get(coreRuleNumber("101.1"))).toBe(2);
    expect(rows.get(coreRuleNumber("101.2"))).toBe(3);
  });

  it("should count rows against the shown list rather than the whole document", () => {
    const shown = DOCUMENT.filter((coreRule) => coreRule.number !== "101.1");

    expect(coreRuleRowIndex(shown).get(coreRuleNumber("101.2"))).toBe(2);
    expect(coreRuleRowIndex(DOCUMENT).get(coreRuleNumber("101.2"))).toBe(3);
  });

  it("should hold no row for a number the list does not show", () => {
    const shown = DOCUMENT.filter((coreRule) => coreRule.number !== "101.1");

    expect(coreRuleRowIndex(shown).get(coreRuleNumber("101.1"))).toBeUndefined();
    expect(coreRuleRowIndex(DOCUMENT).get(coreRuleNumber("999"))).toBeUndefined();
  });
});
