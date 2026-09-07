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
        {
          domainIds: ["fury"],
          rarityIds: ["rare"],
          typeIds: ["legend"],
          search: { type: "nameOrRulesText", text: "piltover" },
          limit: 10,
        },
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
    const jinx = card("jinx", unleashed.code, { collectorNumber: 1, name: "Jinx" });
    store.seedCard(jinx);

    await expect(store.cards.getSummaryPage({ limit: 1, offset: 0 })).resolves.toEqual(
      Page.create([{ id: jinx.id, imageUrl: jinx.imageUrl, name: jinx.name }], true),
    );
    store.close();
  });

  it("sorts card summaries by text and numeric attributes in SQL", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const zeta = card("zeta", unleashed.code, {
      attributes: { energy: 3, might: null, power: null },
      collectorNumber: 1,
      name: "Zeta",
    });
    const alpha = card("alpha", unleashed.code, {
      attributes: { energy: 7, might: 2, power: 2 },
      collectorNumber: 2,
      name: "Alpha",
    });
    const beta = card("beta", unleashed.code, {
      attributes: { energy: 5, might: 4, power: 1 },
      collectorNumber: 3,
      name: "Beta",
    });
    store.seedCard(zeta);
    store.seedCard(alpha);
    store.seedCard(beta);

    await expect(
      store.cards.getSummaryPage({ sort: { type: "name", direction: "ascending" } }),
    ).resolves.toMatchObject({ items: [{ id: alpha.id }, { id: beta.id }, { id: zeta.id }] });
    await expect(
      store.cards.getSummaryPage({ sort: { type: "energy", direction: "descending" } }),
    ).resolves.toMatchObject({ items: [{ id: alpha.id }, { id: beta.id }, { id: zeta.id }] });
    await expect(
      store.cards.getSummaryPage({ sort: { type: "power", direction: "ascending" } }),
    ).resolves.toMatchObject({ items: [{ id: beta.id }, { id: alpha.id }, { id: zeta.id }] });
    store.close();
  });

  it("filters card summaries by numeric attributes and domains in SQL", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const novice = card("novice", unleashed.code, {
      attributes: { energy: 2, might: 1, power: null },
      collectorNumber: 1,
      domainIds: ["order"],
    });
    const adept = card("adept", unleashed.code, {
      attributes: { energy: 4, might: 3, power: 1 },
      collectorNumber: 2,
      domainIds: ["fury"],
    });
    const master = card("master", unleashed.code, {
      attributes: { energy: 6, might: 5, power: 2 },
      collectorNumber: 3,
      domainIds: ["fury", "order"],
    });
    store.seedCard(novice);
    store.seedCard(adept);
    store.seedCard(master);

    await expect(
      store.cards.getSummaryPage({ energy: { type: "between", minimum: 3, maximum: 5 } }),
    ).resolves.toMatchObject({ items: [{ id: adept.id }] });
    await expect(
      store.cards.getSummaryPage({ power: { type: "atLeast", value: 2 } }),
    ).resolves.toMatchObject({ items: [{ id: master.id }] });
    await expect(
      store.cards.getSummaryPage({ domainIds: ["fury", "order"] }),
    ).resolves.toMatchObject({ items: [{ id: master.id }] });
    store.close();
  });

  it("finds card summaries by printed or normalized card name", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kaisa = card("kaisa", unleashed.code, {
      cleanName: "KaiSa Daughter of the Void",
      collectorNumber: 1,
      name: "Kai'Sa - Daughter of the Void",
    });
    const jinx = card("jinx", unleashed.code, { collectorNumber: 2, name: "Jinx" });
    store.seedCard(kaisa);
    store.seedCard(jinx);

    await expect(
      store.cards.getSummaryPage({ search: { type: "name", text: "kaisa" } }),
    ).resolves.toEqual(
      Page.create([{ id: kaisa.id, imageUrl: kaisa.imageUrl, name: kaisa.name }], false),
    );
    await expect(
      store.cards.getSummaryPage({ search: { type: "name", text: " " } }),
    ).resolves.toEqual(Page.empty());
    store.close();
  });

  it("searches card summaries by name, plain rules text, or both", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const drawnName = card("drawn-name", unleashed.code, {
      collectorNumber: 1,
      name: "Drawn Name",
    });
    const drawSpell = card("draw-spell", unleashed.code, {
      cleanName: "Spell",
      collectorNumber: 2,
      name: "Spell",
      rulesText: { rich: "<p>Draw 2.</p>", plain: "Draw 2.", flavour: null },
    });
    const otherCard = card("other", unleashed.code, { collectorNumber: 3 });
    store.seedCard(drawnName);
    store.seedCard(drawSpell);
    store.seedCard(otherCard);

    await expect(
      store.cards.getSummaryPage({ search: { type: "name", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [{ id: drawnName.id, imageUrl: drawnName.imageUrl, name: drawnName.name }],
        false,
      ),
    );
    await expect(
      store.cards.getSummaryPage({ search: { type: "rulesText", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [{ id: drawSpell.id, imageUrl: drawSpell.imageUrl, name: drawSpell.name }],
        false,
      ),
    );
    await expect(
      store.cards.getSummaryPage({ search: { type: "nameOrRulesText", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [
          { id: drawnName.id, imageUrl: drawnName.imageUrl, name: drawnName.name },
          { id: drawSpell.id, imageUrl: drawSpell.imageUrl, name: drawSpell.name },
        ],
        false,
      ),
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

    await expect(store.cards.getPage({ domainIds: ["fury"] })).resolves.toEqual(
      Page.create([fury, furyOrder], false),
    );
    await expect(store.cards.getPage({ domainIds: ["fury", "order"] })).resolves.toEqual(
      Page.create([furyOrder], false),
    );
    await expect(store.cards.getSummaryPage({ domainIds: ["fury", "order"] })).resolves.toEqual(
      Page.create(
        [{ id: furyOrder.id, imageUrl: furyOrder.imageUrl, name: furyOrder.name }],
        false,
      ),
    );
    store.close();
  });
});
