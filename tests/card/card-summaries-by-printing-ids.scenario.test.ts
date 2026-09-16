import { printingIdSchema } from "@/features/card/value-objects/printing-id";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { card, cardSet } from "./fixtures";

const UNLEASHED = cardSet("UNL", "2026-05-08T00:00:00");

describe("card summaries by printing ids scenarios", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
    store.seedSet(UNLEASHED);
  });

  afterEach(() => {
    store.close();
  });

  function seedPrinting(printingId: string, collectorNumber: string) {
    store.seedCard(card(printingId, UNLEASHED.code, { collectorNumber }));
  }

  function asked(...values: readonly string[]) {
    return values.map((value) => printingIdSchema.parse(value));
  }

  it("should answer with the named printings in catalog order, whatever order they were asked in", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");
    seedPrinting("spirit", "3");

    const summaries = await store.cards.getSummariesByPrintingIds(asked("spirit", "vi"));

    expect(summaries).toEqual([
      expect.objectContaining({ printingId: "vi", name: "Card vi", domainIds: ["Chaos"] }),
      expect.objectContaining({ printingId: "spirit", name: "Card spirit" }),
    ]);
  });

  it("should name every id in one statement rather than one statement per id", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");
    seedPrinting("spirit", "3");
    const before = store.executedSql.length;

    await store.cards.getSummariesByPrintingIds(asked("vi", "jinx", "spirit"));

    const reads = store.executedSql.slice(before);
    expect(reads).toHaveLength(2);
    expect(reads[0]).toMatch(/where "card_printing"\."id" in \(\?, \?, \?\)/);
    expect(reads[1]).toMatch(/where "card_domain"\."card_id" in \(\?, \?, \?\)/);
  });

  it("should ask once for a repeated id rather than once per mention", async () => {
    seedPrinting("vi", "1");
    const before = store.executedSql.length;

    const summaries = await store.cards.getSummariesByPrintingIds(asked("vi", "vi"));

    expect(summaries.map((summary) => summary.printingId)).toEqual(["vi"]);
    expect(store.executedSql.slice(before)[0]).toMatch(
      /where "card_printing"\."id" in \(\?\)(?!, )/,
    );
  });

  it("should leave out an id the catalog no longer carries and still answer with the rest", async () => {
    seedPrinting("vi", "1");
    seedPrinting("jinx", "2");

    const summaries = await store.cards.getSummariesByPrintingIds(asked("vi", "withdrawn", "jinx"));

    expect(summaries.map((summary) => summary.printingId)).toEqual(["vi", "jinx"]);
  });

  it("should ask nothing and answer with nothing when no id is named", async () => {
    seedPrinting("vi", "1");
    const before = store.executedSql.length;

    await expect(store.cards.getSummariesByPrintingIds([])).resolves.toEqual([]);

    expect(store.executedSql.slice(before)).toEqual([]);
  });

  it("should resolve more ids than one statement may bind", async () => {
    const seeded = Array.from({ length: 250 }, (_, index) =>
      card(`card-${index}`, UNLEASHED.code, { collectorNumber: `${index + 1}` }),
    );
    for (const each of seeded) store.seedCard(each);

    const summaries = await store.cards.getSummariesByPrintingIds(
      seeded.map((each) => each.printingId),
    );

    expect([...summaries].map((summary) => summary.printingId).sort()).toEqual(
      seeded.map((each) => each.printingId).sort(),
    );
  });
});
