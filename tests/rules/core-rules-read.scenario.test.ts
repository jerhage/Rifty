import { findCoreRulesEdition } from "@/features/rules/use-cases/find-core-rules-edition";
import { listCoreRules } from "@/features/rules/use-cases/list-core-rules";
import { coreRulesSeed } from "@/infrastructure/database/generated/core-rules-seed";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { coreRuleNumbered, seededCoreRules } from "./fixtures";

describe("core rules read scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should read the whole document in position order", async () => {
    const coreRules = await seededCoreRules(store);

    expect(coreRules).toHaveLength(1364);
    expect(coreRules[0]?.number).toBe("000");
    expect(coreRules.map((coreRule) => coreRule.position)).toEqual(
      coreRules.map((_, index) => index),
    );
  });

  it("should attach each rule's details in their own position order", async () => {
    const coreRules = await seededCoreRules(store);

    expect(coreRuleNumbered(coreRules, "103.2").details).toEqual([
      { position: 0, kind: "bullet", body: "1 Chosen Champion Unit" },
      { position: 1, kind: "bullet", body: "Units" },
      { position: 2, kind: "bullet", body: "Gear" },
      { position: 3, kind: "bullet", body: "Spells" },
    ]);
    expect(
      coreRuleNumbered(coreRules, "103.2.a.2").details.map((detail) => ({
        position: detail.position,
        kind: detail.kind,
      })),
    ).toEqual([
      { position: 0, kind: "example" },
      { position: 1, kind: "example" },
    ]);
  });

  it("should give a rule with no details an empty list", async () => {
    const coreRules = await seededCoreRules(store);

    expect(coreRuleNumbered(coreRules, "000").details).toEqual([]);
  });

  it("should read the edition the device holds", async () => {
    await store.seedCoreRules(coreRulesSeed);

    await expect(
      findCoreRulesEdition({ coreRulesEditionFinder: store.coreRules }),
    ).resolves.toEqual({
      type: "success",
      edition: { title: "Riftbound Core Rules", publishedOn: "2025-06-02" },
    });
  });

  it("should report a missing document rather than throwing", async () => {
    await expect(listCoreRules({ coreRuleLister: store.coreRules })).resolves.toEqual({
      type: "documentMissing",
    });
    await expect(
      findCoreRulesEdition({ coreRulesEditionFinder: store.coreRules }),
    ).resolves.toEqual({ type: "documentMissing" });
  });
});
