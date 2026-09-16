import {
  coreRuleRowKindOf,
  coreRulesContents,
} from "@/features/rules/presentation/core-rules-format";
import { coreRuleDepthOf } from "@/features/rules/value-objects/core-rule-number";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { seededCoreRules } from "./fixtures";

describe("coreRulesContents", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should list every depth-1 heading of the real document, in printed order", async () => {
    const contents = coreRulesContents(await seededCoreRules(store));

    expect(contents).toHaveLength(112);
    expect(contents[0]).toMatchObject({ number: "000", body: "Golden and Silver Rules" });

    const positions = contents.map((entry) => entry.position);

    expect(positions).toEqual([...positions].sort((one, other) => one - other));
  });

  it("should carry the five chapters among them", async () => {
    const contents = coreRulesContents(await seededCoreRules(store));

    expect(
      contents.filter((entry) => coreRuleRowKindOf(entry) === "chapter").map((e) => e.number),
    ).toEqual(["000", "100", "500", "600", "700"]);
  });

  it("should hold nothing deeper than depth 1, and no rule", async () => {
    const contents = coreRulesContents(await seededCoreRules(store));

    expect(contents.filter((entry) => coreRuleDepthOf(entry.number) !== 1)).toEqual([]);
    expect(contents.filter((entry) => entry.kind !== "heading")).toEqual([]);
  });
});
