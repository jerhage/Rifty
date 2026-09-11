import { findSet } from "@/features/set/use-cases/find-set";
import { listSets } from "@/features/set/use-cases/list-sets";

import { cardSet } from "../card/fixtures";
import { createSqliteScenarioStore } from "../sqlite-scenario-store";

describe("set catalog scenarios", () => {
  it("should list sets in publication order and retains marketplace references", async () => {
    const store = createSqliteScenarioStore();
    const origins = cardSet("OGN", "2025-10-31T00:00:00", "Origins");
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00", "Unleashed");
    store.seedSet(unleashed);
    store.seedSet(origins);

    await expect(listSets({ setLister: store.sets })).resolves.toEqual({
      type: "success",
      cardSets: [origins, unleashed],
    });
    await expect(findSet(unleashed.code, { setFinder: store.sets })).resolves.toEqual({
      type: "success",
      cardSet: unleashed,
    });
    store.close();
  });
});
