import { findCard } from "@/features/catalog/card/use-cases/find-card";
import { listCards } from "@/features/catalog/card/use-cases/list-cards";
import { Page } from "@/shared/page";

import { card, cardSet } from "./fixtures";
import { createSqliteScenarioStore } from "../sqlite-scenario-store";

describe("card catalog scenarios", () => {
  it("hydrates a card printing with its classification, media, and references", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00", "Unleashed");
    const vi = card("vi-signature", unleashed.code, {
      collectorNumber: 229,
      name: "Vi - Piltover Enforcer (Signature)",
      cleanName: "Vi Piltover Enforcer Signature",
      classification: { typeId: "Legend", supertypeId: "signature", rarityId: "rare" },
      domainIds: ["Fury", "Order"],
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
      classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
      domainIds: ["Fury", "Order"],
      tagIds: ["vi"],
    });
    const spirit = card("spirit", unleashed.code, {
      name: "Bewitching Spirit",
      classification: { typeId: "Unit", supertypeId: null, rarityId: "common" },
      domainIds: ["Chaos"],
      tagIds: ["spirit"],
    });
    store.seedCard(vi);
    store.seedCard(spirit);

    await expect(
      listCards(
        {
          domainIds: ["Fury"],
          rarityIds: ["rare"],
          typeIds: ["Legend"],
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
      Page.create(
        [
          {
            id: jinx.id,
            riftboundId: jinx.riftboundId,
            domainIds: jinx.domainIds,
            imageUrl: jinx.imageUrl,
            name: jinx.name,
            orientation: jinx.orientation,
          },
        ],
        true,
      ),
    );
    store.close();
  });

  it("carries the orientation the catalog grid needs to place landscape battlefields", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const spire = card("contested-spire", unleashed.code, {
      classification: { typeId: "Battlefield", supertypeId: null, rarityId: "rare" },
      collectorNumber: 1,
      name: "Contested Spire",
      orientation: "landscape",
    });
    const unit = card("novice", unleashed.code, { collectorNumber: 2, name: "Novice" });
    store.seedCard(spire);
    store.seedCard(unit);

    await expect(store.cards.getSummaryPage()).resolves.toMatchObject({
      items: [
        { id: spire.id, orientation: "landscape" },
        { id: unit.id, orientation: "portrait" },
      ],
    });
    store.close();
  });

  it("matches any of the given domains, unlike the all-of domain filter", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const calm = card("calm", unleashed.code, { collectorNumber: 1, domainIds: ["Calm"] });
    const mind = card("mind", unleashed.code, { collectorNumber: 2, domainIds: ["Mind"] });
    const both = card("both", unleashed.code, { collectorNumber: 3, domainIds: ["Calm", "Mind"] });
    const fury = card("fury", unleashed.code, { collectorNumber: 4, domainIds: ["Fury"] });
    for (const seeded of [calm, mind, both, fury]) store.seedCard(seeded);

    await expect(
      store.cards.getSummaryPage({ anyDomainIds: ["Calm", "Mind"] }),
    ).resolves.toMatchObject({
      items: [{ id: "calm" }, { id: "mind" }, { id: "both" }],
    });
    await expect(
      store.cards.getSummaryPage({ domainIds: ["Calm", "Mind"] }),
    ).resolves.toMatchObject({ items: [{ id: "both" }] });
    store.close();
  });

  it("resolves cards by the riftbound id a deck stores", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kept = card("kept", unleashed.code, { collectorNumber: 1, name: "Kept" });
    const other = card("other", unleashed.code, { collectorNumber: 2, name: "Other" });
    store.seedCard(kept);
    store.seedCard(other);

    await expect(store.cards.getPage({ riftboundIds: [kept.riftboundId] })).resolves.toMatchObject({
      items: [{ id: "kept" }],
    });
    await expect(
      store.cards.getPage({ riftboundIds: [kept.riftboundId, other.riftboundId] }),
    ).resolves.toMatchObject({ items: [{ id: "kept" }, { id: "other" }] });
    await expect(store.cards.getPage({ riftboundIds: ["missing"] })).resolves.toMatchObject({
      items: [],
    });
    store.close();
  });

  it("finds a legend's champions by name without touching another character's", async () => {
    const store = createSqliteScenarioStore();
    const origins = cardSet("OGN", "2026-01-01T00:00:00");
    store.seedSet(origins);
    const akaliFury = card("akali-fury", origins.code, {
      name: "Akali, Deadly Weapon",
      championName: "Akali",
      domainIds: ["Fury"],
      classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
    });
    const akaliCalm = card("akali-calm", origins.code, {
      name: "Akali, Silent",
      championName: "Akali",
      domainIds: ["Calm"],
      classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
    });
    const akaliOffIdentity = card("akali-chaos", origins.code, {
      name: "Akali, Elsewhere",
      championName: "Akali",
      domainIds: ["Chaos"],
      classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
    });
    const otherCharacter = card("sett", origins.code, {
      name: "Sett, Brawler",
      championName: "Sett",
      domainIds: ["Fury"],
      classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
    });
    for (const each of [akaliFury, akaliCalm, akaliOffIdentity, otherCharacter])
      store.seedCard(each);

    const page = await store.cards.getPage({
      supertypeIds: ["Champion"],
      championNames: ["Akali"],
      withinDomainIds: ["Fury", "Calm"],
    });

    expect(page.items.map((item) => item.id).sort()).toEqual(["akali-calm", "akali-fury"]);
    store.close();
  });

  it("counts every match, not just the page asked for", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    for (let collectorNumber = 1; collectorNumber <= 12; collectorNumber += 1) {
      store.seedCard(
        card(`card-${collectorNumber}`, unleashed.code, {
          collectorNumber,
          domainIds: collectorNumber % 2 === 0 ? ["Calm"] : ["Fury"],
        }),
      );
    }

    await expect(store.cards.count()).resolves.toBe(12);
    await expect(store.cards.count({ anyDomainIds: ["Calm"] })).resolves.toBe(6);
    await expect(store.cards.count({ limit: 3, offset: 0 })).resolves.toBe(12);
    await expect(store.cards.count({ setCodes: ["NOPE"] })).resolves.toBe(0);
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

  it("filters card summaries by set, numeric attributes, and domains in SQL", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    const origins = cardSet("OGN", "2025-10-31T00:00:00");
    store.seedSet(unleashed);
    store.seedSet(origins);
    const novice = card("novice", unleashed.code, {
      attributes: { energy: 2, might: 1, power: null },
      collectorNumber: 1,
      domainIds: ["Order"],
    });
    const adept = card("adept", unleashed.code, {
      attributes: { energy: 4, might: 3, power: 1 },
      collectorNumber: 2,
      domainIds: ["Fury"],
    });
    const master = card("master", unleashed.code, {
      attributes: { energy: 6, might: 5, power: 2 },
      collectorNumber: 3,
      domainIds: ["Fury", "Order"],
    });
    const originsCard = card("origins-card", origins.code, {
      attributes: { energy: 9, might: 3, power: 1 },
      collectorNumber: 1,
      domainIds: ["Fury"],
    });
    store.seedCard(novice);
    store.seedCard(adept);
    store.seedCard(master);
    store.seedCard(originsCard);

    await expect(store.cards.getSummaryPage({ setCodes: [origins.code] })).resolves.toMatchObject({
      items: [{ id: originsCard.id }],
    });

    await expect(
      store.cards.getSummaryPage({ energy: { type: "between", minimum: 3, maximum: 5 } }),
    ).resolves.toMatchObject({ items: [{ id: adept.id }] });
    await expect(
      store.cards.getSummaryPage({ power: { type: "atLeast", value: 2 } }),
    ).resolves.toMatchObject({ items: [{ id: master.id }] });
    await expect(
      store.cards.getSummaryPage({ domainIds: ["Fury", "Order"] }),
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
      Page.create(
        [
          {
            id: kaisa.id,
            riftboundId: kaisa.riftboundId,
            domainIds: kaisa.domainIds,
            imageUrl: kaisa.imageUrl,
            name: kaisa.name,
            orientation: kaisa.orientation,
          },
        ],
        false,
      ),
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
        [
          {
            id: drawnName.id,
            riftboundId: drawnName.riftboundId,
            domainIds: drawnName.domainIds,
            imageUrl: drawnName.imageUrl,
            name: drawnName.name,
            orientation: drawnName.orientation,
          },
        ],
        false,
      ),
    );
    await expect(
      store.cards.getSummaryPage({ search: { type: "rulesText", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [
          {
            id: drawSpell.id,
            riftboundId: drawSpell.riftboundId,
            domainIds: drawSpell.domainIds,
            imageUrl: drawSpell.imageUrl,
            name: drawSpell.name,
            orientation: drawSpell.orientation,
          },
        ],
        false,
      ),
    );
    await expect(
      store.cards.getSummaryPage({ search: { type: "nameOrRulesText", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [
          {
            id: drawnName.id,
            riftboundId: drawnName.riftboundId,
            domainIds: drawnName.domainIds,
            imageUrl: drawnName.imageUrl,
            name: drawnName.name,
            orientation: drawnName.orientation,
          },
          {
            id: drawSpell.id,
            riftboundId: drawSpell.riftboundId,
            domainIds: drawSpell.domainIds,
            imageUrl: drawSpell.imageUrl,
            name: drawSpell.name,
            orientation: drawSpell.orientation,
          },
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
    const fury = card("fury", unleashed.code, { collectorNumber: 1, domainIds: ["Fury"] });
    const furyOrder = card("fury-order", unleashed.code, {
      collectorNumber: 2,
      domainIds: ["Fury", "Order"],
    });
    const order = card("order", unleashed.code, { collectorNumber: 3, domainIds: ["Order"] });
    store.seedCard(fury);
    store.seedCard(furyOrder);
    store.seedCard(order);

    await expect(store.cards.getPage({ domainIds: ["Fury"] })).resolves.toEqual(
      Page.create([fury, furyOrder], false),
    );
    await expect(store.cards.getPage({ domainIds: ["Fury", "Order"] })).resolves.toEqual(
      Page.create([furyOrder], false),
    );
    await expect(store.cards.getSummaryPage({ domainIds: ["Fury", "Order"] })).resolves.toEqual(
      Page.create(
        [
          {
            id: furyOrder.id,
            riftboundId: furyOrder.riftboundId,
            domainIds: furyOrder.domainIds,
            imageUrl: furyOrder.imageUrl,
            name: furyOrder.name,
            orientation: furyOrder.orientation,
          },
        ],
        false,
      ),
    );
    store.close();
  });
});
