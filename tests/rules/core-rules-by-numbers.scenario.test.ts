import type { CoreRulesSeed } from "@/infrastructure/database/reference-seeder";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { coreRuleNumber } from "./fixtures";

const SEED: CoreRulesSeed = {
  coreRulesEditions: [
    { id: "2025-06-02", title: "Riftbound Core Rules", publishedOn: "2025-06-02" },
  ],
  coreRules: [
    { number: "100", parentNumber: null, position: 0, kind: "heading", body: "Golden Rules" },
    { number: "100.1", parentNumber: "100", position: 1, kind: "rule", body: "Cards win." },
    { number: "100.2", parentNumber: "100", position: 2, kind: "rule", body: "Then the rules." },
    { number: "101", parentNumber: null, position: 3, kind: "rule", body: "Two players." },
  ],
  coreRuleDetails: [
    { ruleNumber: "100.1", position: 0, kind: "bullet", body: "A card may contradict a rule." },
    { ruleNumber: "100.1", position: 1, kind: "example", body: "Recycle is such a card." },
  ],
};

describe("core rules by numbers scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(async () => {
    store = createSqliteScenarioStore();
    await store.seedCoreRules(SEED);
  });

  afterEach(() => {
    store.close();
  });

  function asked(...values: readonly string[]) {
    return values.map(coreRuleNumber);
  }

  it("should answer in document order, whatever order the numbers were asked in", async () => {
    const coreRules = await store.coreRules.getAllByNumbers(asked("101", "100.1", "100"));

    expect(coreRules.map((coreRule) => coreRule.number)).toEqual(["100", "100.1", "101"]);
  });

  it("should carry each answered rule's own details", async () => {
    const [found] = await store.coreRules.getAllByNumbers(asked("100.1"));

    expect(found?.details).toEqual([
      { position: 0, kind: "bullet", body: "A card may contradict a rule." },
      { position: 1, kind: "example", body: "Recycle is such a card." },
    ]);
  });

  it("should name every number in one statement rather than one statement per number", async () => {
    const before = store.executedSql.length;

    await store.coreRules.getAllByNumbers(asked("100", "100.1", "101"));

    const reads = store.executedSql.slice(before);
    expect(reads).toHaveLength(2);
    expect(reads[0]).toMatch(/where "core_rule"\."number" in \(\?, \?, \?\)/);
    expect(reads[1]).toMatch(/where "core_rule_detail"\."rule_number" in \(\?, \?, \?\)/);
  });

  it("should ask once for a repeated number rather than once per mention", async () => {
    const before = store.executedSql.length;

    const coreRules = await store.coreRules.getAllByNumbers(asked("101", "101"));

    expect(coreRules.map((coreRule) => coreRule.number)).toEqual(["101"]);
    expect(store.executedSql.slice(before)[0]).toMatch(
      /where "core_rule"\."number" in \(\?\)(?!, )/,
    );
  });

  it("should leave out a number the document has dropped and still answer with the rest", async () => {
    const coreRules = await store.coreRules.getAllByNumbers(asked("100.2", "612.9", "101"));

    expect(coreRules.map((coreRule) => coreRule.number)).toEqual(["100.2", "101"]);
  });

  it("should ask nothing and answer with nothing when no number is named", async () => {
    const before = store.executedSql.length;

    await expect(store.coreRules.getAllByNumbers([])).resolves.toEqual([]);

    expect(store.executedSql.slice(before)).toEqual([]);
  });

  it("should ask for no details when the document carries none of the numbers", async () => {
    const before = store.executedSql.length;

    await expect(store.coreRules.getAllByNumbers(asked("612.9"))).resolves.toEqual([]);

    expect(store.executedSql.slice(before)).toHaveLength(1);
  });
});
