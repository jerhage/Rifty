import { searchCoreRules, type CoreRuleSearch } from "@/features/rules/core-rule-search";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { coreRuleNumbered, seededCoreRules } from "./fixtures";

function searched(search: CoreRuleSearch): Extract<CoreRuleSearch, { type: "searched" }> {
  if (search.type !== "searched") throw new Error("The query was not searched.");

  return search;
}

describe("core rules search scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should find every recycle hit in the seeded document", async () => {
    const coreRules = await seededCoreRules(store);

    const search = searched(searchCoreRules(coreRules, "recycle"));
    const detailHitCount = search.matches
      .flatMap((match) => match.passages)
      .filter((passage) => passage.target.type === "detail")
      .reduce((total, passage) => total + passage.offsets.length, 0);

    expect(search.hitCount).toBe(28);
    expect(search.matches).toHaveLength(18);
    expect(detailHitCount).toBe(10);
    expect(search.matches[0]).toEqual({
      number: "117.3",
      passages: [
        { target: { type: "body" }, offsets: [21] },
        { target: { type: "detail", position: 0 }, offsets: [14] },
      ],
      hitCount: 2,
    });
  });

  it("should quote the query back from every offset it reported", async () => {
    const coreRules = await seededCoreRules(store);

    const search = searched(searchCoreRules(coreRules, "recycle"));

    for (const match of search.matches) {
      const coreRule = coreRuleNumbered(coreRules, match.number);

      for (const passage of match.passages) {
        const text =
          passage.target.type === "body"
            ? coreRule.body
            : (coreRule.details[passage.target.position]?.body ?? "");

        for (const offset of passage.offsets) {
          expect(text.slice(offset, offset + search.queryLength).toLowerCase()).toBe("recycle");
        }
      }
    }
  });

  it("should show every match with its ancestors, and only real rules", async () => {
    const coreRules = await seededCoreRules(store);

    const search = searched(searchCoreRules(coreRules, "recycle"));
    const unresolved = [...search.shownNumbers].filter(
      (number) => !coreRules.some((coreRule) => coreRule.number === number),
    );

    expect(search.shownNumbers.size).toBe(31);
    expect(unresolved).toEqual([]);
    expect(search.matches.every((match) => search.shownNumbers.has(match.number))).toBe(true);
  });

  it("should filter nothing when the reader has typed nothing", async () => {
    const coreRules = await seededCoreRules(store);

    expect(searchCoreRules(coreRules, "")).toEqual({ type: "noQuery" });
  });
});
