import { savedCoreRules } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

import { coreRuleDocument } from "./fixtures";

/**
 * Five levels, and the heading over a rule sits at a different depth in each branch: `101.1.a`
 * hangs under a rule, `501.1` under a depth-2 heading, and `700.1` under the chapter itself.
 */
const DOCUMENT = coreRuleDocument([
  { number: "100", kind: "heading", body: "Game Concepts" },
  { number: "101", kind: "heading", body: "Deck Construction" },
  { number: "101.1", body: "Runes pay for costs." },
  { number: "101.1.a", body: "A rune is spent when it pays." },
  { number: "500", kind: "heading", body: "Playing the Game" },
  { number: "501", kind: "heading", body: "Turn Structure" },
  { number: "501.1", body: "Chip damage is dealt." },
  { number: "700", kind: "heading", body: "Additional Rules" },
  { number: "700.1", body: "Recycle a card to draw a card." },
]);

function marks(...numbers: readonly string[]): (number: CoreRuleNumber) => boolean {
  const marked = new Set(numbers);

  return (number) => marked.has(number);
}

describe("savedCoreRules", () => {
  it("should list only the marked rules", () => {
    const saved = savedCoreRules(DOCUMENT, marks("501.1"));

    expect(saved.map((entry) => entry.coreRule.number)).toEqual(["501.1"]);
  });

  it("should list them in document order rather than in the order they were marked", () => {
    const saved = savedCoreRules(DOCUMENT, marks("700.1", "101.1", "501.1"));

    expect(saved.map((entry) => entry.coreRule.number)).toEqual(["101.1", "501.1", "700.1"]);
  });

  it("should take the nearest heading above a rule rather than a fixed level", () => {
    const saved = savedCoreRules(DOCUMENT, marks("101.1.a", "501.1", "700.1"));

    expect(saved.map((entry) => entry.heading?.number)).toEqual(["101", "501", "700"]);
    expect(saved.map((entry) => entry.heading?.body)).toEqual([
      "Deck Construction",
      "Turn Structure",
      "Additional Rules",
    ]);
  });

  it("should leave the heading absent where no ancestor was printed as one", () => {
    const saved = savedCoreRules(
      coreRuleDocument([
        { number: "101", body: "A rule that is not a heading." },
        { number: "101.1", body: "Runes pay for costs." },
      ]),
      marks("101.1"),
    );

    expect(saved[0]?.heading).toBeNull();
  });

  it("should drop a mark naming a number the document no longer holds", () => {
    const saved = savedCoreRules(DOCUMENT, marks("101.1", "999.9"));

    expect(saved.map((entry) => entry.coreRule.number)).toEqual(["101.1"]);
  });

  it("should list nothing when nothing is marked", () => {
    expect(savedCoreRules(DOCUMENT, marks())).toEqual([]);
  });
});
