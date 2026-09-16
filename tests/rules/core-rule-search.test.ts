import {
  activeCoreRuleHit,
  searchCoreRules,
  type CoreRuleSearch,
} from "@/features/rules/core-rule-search";

import { coreRuleDocument } from "./fixtures";

function searched(search: CoreRuleSearch): Extract<CoreRuleSearch, { type: "searched" }> {
  if (search.type !== "searched") throw new Error("The query was not searched.");

  return search;
}

describe("searchCoreRules", () => {
  it("should offset every occurrence in a body, including the first and last character runs", () => {
    const body = "Recycle then RECYCLE and recycle";
    const search = searched(
      searchCoreRules(coreRuleDocument([{ number: "101", body }]), "recycle"),
    );

    expect(search.matches).toEqual([
      {
        number: "101",
        passages: [{ target: { type: "body" }, offsets: [0, 13, 25] }],
        hitCount: 3,
      },
    ]);
    expect(search.hitCount).toBe(3);
    expect(search.queryLength).toBe(7);
    expect(body.slice(25, 25 + search.queryLength)).toBe("recycle");
    expect(body).toHaveLength(32);
  });

  it("should find a match in a detail and report it against that detail's position", () => {
    const document = coreRuleDocument([
      {
        number: "101.1",
        body: "A player may discard a card.",
        details: ["Draw a card.", "For example, recycle two cards, then recycle a third."],
      },
    ]);

    const search = searched(searchCoreRules(document, "recycle"));

    expect(search.matches).toEqual([
      {
        number: "101.1",
        passages: [{ target: { type: "detail", position: 1 }, offsets: [13, 37] }],
        hitCount: 2,
      },
    ]);
  });

  it("should count body and detail hits together for one rule", () => {
    const document = coreRuleDocument([
      { number: "101", body: "Recycle a card.", details: ["Then recycle again."] },
    ]);

    const search = searched(searchCoreRules(document, "recycle"));

    expect(search.matches[0]?.passages).toEqual([
      { target: { type: "body" }, offsets: [0] },
      { target: { type: "detail", position: 0 }, offsets: [5] },
    ]);
    expect(search.matches[0]?.hitCount).toBe(2);
    expect(search.hitCount).toBe(2);
  });

  it("should show a deep match under every one of its ancestors", () => {
    const document = coreRuleDocument([{ number: "626.1.d.1.a", body: "Recycle the top card." }]);

    const search = searched(searchCoreRules(document, "recycle"));

    expect([...search.shownNumbers]).toEqual([
      "626",
      "626.1",
      "626.1.d",
      "626.1.d.1",
      "626.1.d.1.a",
    ]);
  });

  it("should treat an empty or whitespace-only query as nothing searched", () => {
    const document = coreRuleDocument([{ number: "101", body: "Recycle a card." }]);

    expect(searchCoreRules(document, "")).toEqual({ type: "noQuery" });
    expect(searchCoreRules(document, "   \n\t ")).toEqual({ type: "noQuery" });
  });

  it("should trim the query it searched and reports", () => {
    const document = coreRuleDocument([{ number: "101", body: "Recycle a card." }]);

    const search = searched(searchCoreRules(document, "  recycle  "));

    expect(search.query).toBe("recycle");
    expect(search.queryLength).toBe(7);
    expect(search.hitCount).toBe(1);
  });

  it("should match case-insensitively in both directions", () => {
    const document = coreRuleDocument([
      { number: "101", body: "RECYCLE a card." },
      { number: "102", body: "recycle a card." },
    ]);

    expect(searched(searchCoreRules(document, "recycle")).hitCount).toBe(2);
    expect(searched(searchCoreRules(document, "RECYCLE")).hitCount).toBe(2);
    expect(searched(searchCoreRules(document, "ReCyClE")).hitCount).toBe(2);
  });

  it("should report a query that appears nowhere as no hits and nothing shown", () => {
    const document = coreRuleDocument([{ number: "101", body: "Recycle a card." }]);

    const search = searched(searchCoreRules(document, "planeswalker"));

    expect(search.matches).toEqual([]);
    expect(search.hitCount).toBe(0);
    expect(search.shownNumbers.size).toBe(0);
  });

  it("should count overlapping occurrences once, so `aa` in `aaa` is one hit", () => {
    const document = coreRuleDocument([{ number: "101", body: "aaa" }]);

    const search = searched(searchCoreRules(document, "aa"));

    expect(search.matches[0]?.passages).toEqual([{ target: { type: "body" }, offsets: [0] }]);
    expect(search.hitCount).toBe(1);
  });
});

describe("activeCoreRuleHit", () => {
  const document = coreRuleDocument([
    { number: "101", body: "Recycle then recycle." },
    { number: "102", body: "Nothing here.", details: ["Recycle once more."] },
  ]);

  function search(): CoreRuleSearch {
    return searchCoreRules(document, "recycle");
  }

  it("should resolve the first hit at index zero", () => {
    expect(activeCoreRuleHit(search(), 0)).toEqual({
      type: "hit",
      hitIndex: 0,
      number: "101",
      target: { type: "body" },
      offset: 0,
    });
  });

  it("should resolve the last hit at the last index", () => {
    expect(searched(search()).hitCount).toBe(3);
    expect(activeCoreRuleHit(search(), 2)).toEqual({
      type: "hit",
      hitIndex: 2,
      number: "102",
      target: { type: "detail", position: 0 },
      offset: 0,
    });
  });

  it("should wrap one past the last index round to the first hit", () => {
    expect(activeCoreRuleHit(search(), 3)).toEqual(activeCoreRuleHit(search(), 0));
    expect(activeCoreRuleHit(search(), 7)).toEqual(activeCoreRuleHit(search(), 1));
  });

  it("should wrap a negative index back to the last hit", () => {
    expect(activeCoreRuleHit(search(), -1)).toEqual(activeCoreRuleHit(search(), 2));
    expect(activeCoreRuleHit(search(), -4)).toEqual(activeCoreRuleHit(search(), 2));
    expect(activeCoreRuleHit(search(), -5)).toEqual(activeCoreRuleHit(search(), 1));
  });

  it("should have no active hit at any index when nothing matched", () => {
    const missing = searchCoreRules(document, "planeswalker");

    expect(activeCoreRuleHit(missing, 0)).toEqual({ type: "noHit" });
    expect(activeCoreRuleHit(missing, 12)).toEqual({ type: "noHit" });
    expect(activeCoreRuleHit(missing, -3)).toEqual({ type: "noHit" });
  });

  it("should have no active hit when nothing was searched", () => {
    expect(activeCoreRuleHit(searchCoreRules(document, "  "), 0)).toEqual({ type: "noHit" });
  });
});
