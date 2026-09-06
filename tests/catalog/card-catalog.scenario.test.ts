import { findCard } from "@/features/catalog/card/use-cases/find-card";
import { listCards } from "@/features/catalog/card/use-cases/list-cards";
import { Page } from "@/shared/page";

import { card, cardSet } from "./fixtures";
import { createSqliteScenarioStore } from "./sqlite-scenario-store";

describe("card catalog scenarios", () => {
  it("hydrates a card printing with its classification, media, and references", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00", "Unleashed");
    const vi = card("vi-signature", unleashed.code, {
      collectorNumber: 229,
      name: "Vi - Piltover Enforcer (Signature)",
      cleanName: "Vi Piltover Enforcer Signature",
      classification: { typeId: "legend", supertypeId: "signature", rarityId: "rare" },
      domainIds: ["fury", "order"],
      tagIds: ["vi", "piltover"],
      marketplaceReferences: [
        { marketplace: "tcgplayer", externalId: "685522" },
        { marketplace: "cardmarket", externalId: "98765" },
      ],
    });
    store.seedSet(unleashed);
    store.seedCard(vi);

    await expect(findCard(vi.id, { cardFinder: store.cards })).resolves.toEqual({
      type: "success",
      card: {
        ...vi,
        tagIds: ["piltover", "vi"],
        marketplaceReferences: [
          { marketplace: "cardmarket", externalId: "98765" },
          { marketplace: "tcgplayer", externalId: "685522" },
        ],
      },
    });
    store.close();
  });

  it("filters cards by taxonomy and text without exposing persistence rows", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const vi = card("vi", unleashed.code, {
      name: "Vi - Piltover Enforcer",
      classification: { typeId: "legend", supertypeId: null, rarityId: "rare" },
      domainIds: ["fury", "order"],
      tagIds: ["vi"],
    });
    const spirit = card("spirit", unleashed.code, {
      name: "Bewitching Spirit",
      classification: { typeId: "unit", supertypeId: null, rarityId: "common" },
      domainIds: ["chaos"],
      tagIds: ["spirit"],
    });
    store.seedCard(vi);
    store.seedCard(spirit);

    await expect(
      listCards(
        { domainIds: ["fury"], rarityIds: ["rare"], search: "piltover", limit: 10 },
        { cardLister: store.cards },
      ),
    ).resolves.toEqual({ type: "success", page: Page.create([vi], false) });
    store.close();
  });

  it("reports an absent card without treating it as a storage failure", async () => {
    const store = createSqliteScenarioStore();

    await expect(findCard("unknown", { cardFinder: store.cards })).resolves.toEqual({
      type: "notFound",
    });
    store.close();
  });

  it("returns ten cards first and exposes the final card through the next page", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    for (let collectorNumber = 1; collectorNumber <= 11; collectorNumber += 1) {
      store.seedCard(card(`card-${collectorNumber}`, unleashed.code, { collectorNumber }));
    }

    await expect(store.cards.getPage({ limit: 10, offset: 0 })).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: "card-1" })]),
      hasMore: true,
    });
    await expect(store.cards.getPage({ limit: 10, offset: 10 })).resolves.toEqual(
      Page.create([card("card-11", unleashed.code, { collectorNumber: 11 })], false),
    );
    store.close();
  });

  it("lists only the card data needed by the catalog screen", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    store.seedCard(card("vi", unleashed.code, { collectorNumber: 2, name: "Vi" }));
    store.seedCard(card("jinx", unleashed.code, { collectorNumber: 1, name: "Jinx" }));

    await expect(store.cards.getSummaryPage({ limit: 1, offset: 0 })).resolves.toEqual(
      Page.create([{ id: "jinx", name: "Jinx" }], true),
    );
    store.close();
  });

  it("gets cards belonging to one or every selected domain", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const fury = card("fury", unleashed.code, { collectorNumber: 1, domainIds: ["fury"] });
    const furyOrder = card("fury-order", unleashed.code, {
      collectorNumber: 2,
      domainIds: ["fury", "order"],
    });
    const order = card("order", unleashed.code, { collectorNumber: 3, domainIds: ["order"] });
    store.seedCard(fury);
    store.seedCard(furyOrder);
    store.seedCard(order);

    await expect(store.cards.getPageForDomains("fury")).resolves.toEqual(
      Page.create([fury, furyOrder], false),
    );
    await expect(store.cards.getPageForDomains(["fury", "order"])).resolves.toEqual(
      Page.create([furyOrder], false),
    );
    await expect(store.cards.getSummaryPageForDomains(["fury", "order"])).resolves.toEqual(
      Page.create([{ id: furyOrder.id, name: furyOrder.name }], false),
    );
    store.close();
  });
});
