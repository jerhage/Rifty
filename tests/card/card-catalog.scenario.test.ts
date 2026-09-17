import { findCard } from "@/features/card/use-cases/find-card";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import { listCards } from "@/features/card/use-cases/list-cards";
import { Page } from "@/shared/page";

import {
  card,
  cardSet,
  carriedKeyword,
  grantedKeyword,
  setCode,
  taxonomy,
  taxonomyId,
} from "./fixtures";
import { createSqliteScenarioStore } from "../sqlite-scenario-store";

describe("card catalog scenarios", () => {
  it("should hydrate a card printing with its classification, media, and references", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00", "Unleashed");
    const vi = card("vi-signature", unleashed.code, {
      collectorNumber: "229",
      name: "Vi - Piltover Enforcer (Signature)",
      cleanName: "Vi Piltover Enforcer Signature",
      classification: {
        typeId: "Legend",
        supertypeId: taxonomyId("signature"),
        rarity: taxonomy("rare", "Rare"),
      },
      domainIds: ["Fury", "Order"],
      tags: [taxonomy("vi", "Vi"), taxonomy("piltover", "Piltover")],
      marketplaceReferences: [
        { marketplace: "tcgplayer", externalId: "685522" },
        { marketplace: "cardmarket", externalId: "98765" },
      ],
    });
    store.seedSet(unleashed);
    store.seedCard(vi);

    await expect(findCard(vi.printingId, { cardFinder: store.cards })).resolves.toEqual({
      type: "success",
      card: {
        ...vi,
        tags: [taxonomy("piltover", "Piltover"), taxonomy("vi", "Vi")],
        marketplaceReferences: [
          { marketplace: "cardmarket", externalId: "98765" },
          { marketplace: "tcgplayer", externalId: "685522" },
        ],
      },
    });
    store.close();
  });

  it("should keep an occurrence with several targets as one keyword rather than one per target", async () => {
    const store = createSqliteScenarioStore();
    const venture = cardSet("VEN", "2026-08-14T00:00:00", "Venture");
    const threshold = card("threshold", venture.code, {
      name: "Threshold of the Gray",
      keywords: [
        {
          id: "add",
          name: "Add",
          value: null,
          targets: [
            { kind: "player", isToken: false, allegiance: "enemy" },
            { kind: "player", isToken: false, allegiance: "own" },
          ],
        },
        carriedKeyword("shield", "Shield", 2),
      ],
    });
    store.seedSet(venture);
    store.seedCard(threshold);

    const found = await findCard(threshold.printingId, { cardFinder: store.cards });

    expect(found).toEqual({ type: "success", card: threshold });
    store.close();
  });

  it("should filter cards by taxonomy and text without exposing persistence rows", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const vi = card("vi", unleashed.code, {
      name: "Vi - Piltover Enforcer",
      classification: { typeId: "Legend", supertypeId: null, rarity: taxonomy("rare") },
      domainIds: ["Fury", "Order"],
      tags: [taxonomy("vi")],
    });
    const spirit = card("spirit", unleashed.code, {
      name: "Bewitching Spirit",
      classification: { typeId: "Unit", supertypeId: null, rarity: taxonomy("common") },
      domainIds: ["Chaos"],
      tags: [taxonomy("spirit")],
    });
    store.seedCard(vi);
    store.seedCard(spirit);

    await expect(
      listCards(
        {
          domainIds: ["Fury"],
          rarityIds: [taxonomyId("rare")],
          typeIds: ["Legend"],
          search: { type: "nameOrRulesText", text: "piltover" },
          limit: 10,
        },
        { cardCounter: store.cards, cardLister: store.cards },
      ),
    ).resolves.toEqual({ type: "success", page: Page.create([vi], false), total: 1 });
    store.close();
  });

  it("should report an absent card without treating it as a storage failure", async () => {
    const store = createSqliteScenarioStore();

    await expect(
      findCard(printingIdSchema.parse("unknown"), { cardFinder: store.cards }),
    ).resolves.toEqual({
      type: "notFound",
    });
    store.close();
  });

  it("should return ten cards first and expose the final card through the next page", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const collectorNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10a"];
    for (const collectorNumber of collectorNumbers) {
      store.seedCard(card(`card-${collectorNumber}`, unleashed.code, { collectorNumber }));
    }

    const firstPage = await store.cards.getPage({ limit: 10, offset: 0 });

    expect(firstPage.items.map((item) => item.printingId)).toEqual(
      collectorNumbers.slice(0, 10).map((collectorNumber) => `card-${collectorNumber}`),
    );
    expect(firstPage.hasMore).toBe(true);
    await expect(store.cards.getPage({ limit: 10, offset: 10 })).resolves.toEqual(
      Page.create([card("card-10a", unleashed.code, { collectorNumber: "10a" })], false),
    );
    store.close();
  });

  it("should list only the card data needed by the catalog screen", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    store.seedCard(card("vi", unleashed.code, { collectorNumber: "2", name: "Vi" }));
    const jinx = card("jinx", unleashed.code, { collectorNumber: "1", name: "Jinx" });
    store.seedCard(jinx);

    await expect(store.cards.getSummaryPage({ limit: 1, offset: 0 })).resolves.toEqual(
      Page.create(
        [
          {
            printingId: jinx.printingId,
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

  it("should carry the orientation the catalog grid needs to place landscape battlefields", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const spire = card("contested-spire", unleashed.code, {
      classification: { typeId: "Battlefield", supertypeId: null, rarity: taxonomy("rare") },
      collectorNumber: "1",
      name: "Contested Spire",
      orientation: "landscape",
    });
    const unit = card("novice", unleashed.code, { collectorNumber: "2", name: "Novice" });
    store.seedCard(spire);
    store.seedCard(unit);

    await expect(store.cards.getSummaryPage()).resolves.toMatchObject({
      items: [
        { printingId: spire.printingId, orientation: "landscape" },
        { printingId: unit.printingId, orientation: "portrait" },
      ],
    });
    store.close();
  });

  it("should match any of the given domains, unlike the all-of domain filter", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const calm = card("calm", unleashed.code, { collectorNumber: "1", domainIds: ["Calm"] });
    const mind = card("mind", unleashed.code, { collectorNumber: "2", domainIds: ["Mind"] });
    const both = card("both", unleashed.code, {
      collectorNumber: "3",
      domainIds: ["Calm", "Mind"],
    });
    const fury = card("fury", unleashed.code, { collectorNumber: "4", domainIds: ["Fury"] });
    for (const seeded of [calm, mind, both, fury]) store.seedCard(seeded);

    await expect(
      store.cards.getSummaryPage({ anyDomainIds: ["Calm", "Mind"] }),
    ).resolves.toMatchObject({
      items: [{ printingId: "calm" }, { printingId: "mind" }, { printingId: "both" }],
    });
    await expect(
      store.cards.getSummaryPage({ domainIds: ["Calm", "Mind"] }),
    ).resolves.toMatchObject({ items: [{ printingId: "both" }] });
    store.close();
  });

  it("should match any occurrence of any of the keywords whatever it targets, listing and counting each card once, and narrow by domain", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const carrier = card("carrier", unleashed.code, {
      collectorNumber: "1",
      keywords: [carriedKeyword("shield", "Shield", 1)],
    });
    const granter = card("granter", unleashed.code, {
      collectorNumber: "2",
      keywords: [grantedKeyword("shield", "Shield")],
    });
    const twice = card("twice", unleashed.code, {
      collectorNumber: "3",
      domainIds: ["Fury"],
      keywords: [carriedKeyword("shield", "Shield", 1), grantedKeyword("shield", "Shield", 2)],
    });
    const manyTargets = card("many-targets", unleashed.code, {
      collectorNumber: "4",
      keywords: [
        {
          id: "shield",
          name: "Shield",
          value: null,
          targets: [
            { kind: "unit", isToken: false, allegiance: "friendly" },
            { kind: "unit", isToken: true, allegiance: "own" },
          ],
        },
      ],
    });
    const tank = card("tank", unleashed.code, {
      collectorNumber: "5",
      keywords: [carriedKeyword("tank", "Tank")],
    });
    const plain = card("plain", unleashed.code, { collectorNumber: "6" });
    for (const seeded of [carrier, granter, twice, manyTargets, tank, plain]) {
      store.seedCard(seeded);
    }

    await expect(store.cards.getSummaryPage({ keywordIds: ["shield"] })).resolves.toMatchObject({
      items: [
        { printingId: carrier.printingId },
        { printingId: granter.printingId },
        { printingId: twice.printingId },
        { printingId: manyTargets.printingId },
      ],
    });
    await expect(store.cards.count({ keywordIds: ["shield"] })).resolves.toBe(4);
    await expect(
      store.cards.getSummaryPage({ keywordIds: ["shield", "tank"] }),
    ).resolves.toMatchObject({
      items: [
        { printingId: carrier.printingId },
        { printingId: granter.printingId },
        { printingId: twice.printingId },
        { printingId: manyTargets.printingId },
        { printingId: tank.printingId },
      ],
    });
    await expect(
      store.cards.getSummaryPage({ keywordIds: ["shield"], domainIds: ["Fury"] }),
    ).resolves.toMatchObject({ items: [{ printingId: twice.printingId }] });
    store.close();
  });

  it("should offer every keyword the catalog holds, ordered by name", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    store.seedCard(
      card("warden", unleashed.code, {
        keywords: [carriedKeyword("tank", "Tank"), grantedKeyword("shield", "Shield")],
      }),
    );

    await expect(store.keywords.getAll()).resolves.toEqual([
      { id: "shield", name: "Shield", reminderText: null },
      { id: "tank", name: "Tank", reminderText: null },
    ]);
    store.close();
  });

  it("should resolve cards by the riftbound id", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kept = card("kept", unleashed.code, { collectorNumber: "1", name: "Kept" });
    const other = card("other", unleashed.code, { collectorNumber: "2", name: "Other" });
    store.seedCard(kept);
    store.seedCard(other);

    await expect(store.cards.getPage({ riftboundIds: [kept.riftboundId] })).resolves.toMatchObject({
      items: [{ printingId: "kept" }],
    });
    await expect(
      store.cards.getPage({ riftboundIds: [kept.riftboundId, other.riftboundId] }),
    ).resolves.toMatchObject({ items: [{ printingId: "kept" }, { printingId: "other" }] });
    await expect(store.cards.getPage({ riftboundIds: ["missing"] })).resolves.toMatchObject({
      items: [],
    });
    store.close();
  });

  it("should find a champion's printings inside the chosen domains, leaving out its off-domain printing and other champions", async () => {
    const store = createSqliteScenarioStore();
    const origins = cardSet("OGN", "2026-01-01T00:00:00");
    store.seedSet(origins);
    const akaliFury = card("akali-fury", origins.code, {
      name: "Akali, Deadly Weapon",
      championName: "Akali",
      domainIds: ["Fury"],
      classification: {
        typeId: "Unit",
        supertypeId: taxonomyId("Champion"),
        rarity: taxonomy("rare"),
      },
    });
    const akaliCalm = card("akali-calm", origins.code, {
      name: "Akali, Silent",
      championName: "Akali",
      domainIds: ["Calm"],
      classification: {
        typeId: "Unit",
        supertypeId: taxonomyId("Champion"),
        rarity: taxonomy("rare"),
      },
    });
    const akaliOffIdentity = card("akali-chaos", origins.code, {
      name: "Akali, Elsewhere",
      championName: "Akali",
      domainIds: ["Chaos"],
      classification: {
        typeId: "Unit",
        supertypeId: taxonomyId("Champion"),
        rarity: taxonomy("rare"),
      },
    });
    const otherCharacter = card("sett", origins.code, {
      name: "Sett, Brawler",
      championName: "Sett",
      domainIds: ["Fury"],
      classification: {
        typeId: "Unit",
        supertypeId: taxonomyId("Champion"),
        rarity: taxonomy("rare"),
      },
    });
    for (const each of [akaliFury, akaliCalm, akaliOffIdentity, otherCharacter])
      store.seedCard(each);

    const page = await store.cards.getPage({
      supertypeIds: [taxonomyId("Champion")],
      championNames: ["Akali"],
      withinDomainIds: ["Fury", "Calm"],
    });

    expect(page.items.map((item) => item.printingId).sort()).toEqual(["akali-calm", "akali-fury"]);
    store.close();
  });

  it("should count every match the filters allow, not just the page asked for", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    for (let collectorNumber = 1; collectorNumber <= 12; collectorNumber += 1) {
      store.seedCard(
        card(`card-${collectorNumber}`, unleashed.code, {
          collectorNumber: String(collectorNumber),
          domainIds: collectorNumber % 2 === 0 ? ["Calm"] : ["Fury"],
        }),
      );
    }

    await expect(store.cards.count()).resolves.toBe(12);
    await expect(store.cards.count({ anyDomainIds: ["Calm"] })).resolves.toBe(6);
    await expect(store.cards.count({ limit: 3, offset: 0 })).resolves.toBe(12);
    await expect(store.cards.count({ setCodes: [setCode("NOPE")] })).resolves.toBe(0);
    store.close();
  });

  it("should sort card summaries by text and numeric attributes in SQL", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const zeta = card("zeta", unleashed.code, {
      attributes: { energy: 3, might: null, power: null },
      collectorNumber: "1",
      name: "Zeta",
    });
    const alpha = card("alpha", unleashed.code, {
      attributes: { energy: 7, might: 2, power: 2 },
      collectorNumber: "2",
      name: "Alpha",
    });
    const beta = card("beta", unleashed.code, {
      attributes: { energy: 5, might: 4, power: 1 },
      collectorNumber: "3",
      name: "Beta",
    });
    store.seedCard(zeta);
    store.seedCard(alpha);
    store.seedCard(beta);

    await expect(
      store.cards.getSummaryPage({ sort: { type: "name", direction: "ascending" } }),
    ).resolves.toMatchObject({
      items: [
        { printingId: alpha.printingId },
        { printingId: beta.printingId },
        { printingId: zeta.printingId },
      ],
    });
    await expect(
      store.cards.getSummaryPage({ sort: { type: "energy", direction: "descending" } }),
    ).resolves.toMatchObject({
      items: [
        { printingId: alpha.printingId },
        { printingId: beta.printingId },
        { printingId: zeta.printingId },
      ],
    });
    await expect(
      store.cards.getSummaryPage({ sort: { type: "power", direction: "ascending" } }),
    ).resolves.toMatchObject({
      items: [
        { printingId: beta.printingId },
        { printingId: alpha.printingId },
        { printingId: zeta.printingId },
      ],
    });
    store.close();
  });

  it("should filter card summaries by set, numeric attributes, and domains in SQL", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    const origins = cardSet("OGN", "2025-10-31T00:00:00");
    store.seedSet(unleashed);
    store.seedSet(origins);
    const novice = card("novice", unleashed.code, {
      attributes: { energy: 2, might: 1, power: null },
      collectorNumber: "1",
      domainIds: ["Order"],
    });
    const adept = card("adept", unleashed.code, {
      attributes: { energy: 4, might: 3, power: 1 },
      collectorNumber: "2",
      domainIds: ["Fury"],
    });
    const master = card("master", unleashed.code, {
      attributes: { energy: 6, might: 5, power: 2 },
      collectorNumber: "3",
      domainIds: ["Fury", "Order"],
    });
    const originsCard = card("origins-card", origins.code, {
      attributes: { energy: 9, might: 3, power: 1 },
      collectorNumber: "1",
      domainIds: ["Fury"],
    });
    store.seedCard(novice);
    store.seedCard(adept);
    store.seedCard(master);
    store.seedCard(originsCard);

    await expect(store.cards.getSummaryPage({ setCodes: [origins.code] })).resolves.toMatchObject({
      items: [{ printingId: originsCard.printingId }],
    });

    await expect(
      store.cards.getSummaryPage({ energy: { type: "between", minimum: 3, maximum: 5 } }),
    ).resolves.toMatchObject({ items: [{ printingId: adept.printingId }] });
    await expect(
      store.cards.getSummaryPage({ power: { type: "atLeast", value: 2 } }),
    ).resolves.toMatchObject({ items: [{ printingId: master.printingId }] });
    await expect(
      store.cards.getSummaryPage({ domainIds: ["Fury", "Order"] }),
    ).resolves.toMatchObject({ items: [{ printingId: master.printingId }] });
    store.close();
  });

  it("should find card summaries by printed or normalized card name", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kaisa = card("kaisa", unleashed.code, {
      cleanName: "KaiSa Daughter of the Void",
      collectorNumber: "1",
      name: "Kai'Sa - Daughter of the Void",
    });
    const jinx = card("jinx", unleashed.code, { collectorNumber: "2", name: "Jinx" });
    store.seedCard(kaisa);
    store.seedCard(jinx);

    await expect(
      store.cards.getSummaryPage({ search: { type: "name", text: "kaisa" } }),
    ).resolves.toEqual(
      Page.create(
        [
          {
            printingId: kaisa.printingId,
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

  it("should find a printing by the name printed on it", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kaisa = card("kaisa", unleashed.code, {
      cleanName: "KaiSa Daughter of the Void",
      collectorNumber: "1",
      name: "Kai'Sa - Daughter of the Void",
    });
    const alternate = card("kaisa-alt", unleashed.code, {
      cardId: kaisa.cardId,
      cleanName: "KaiSa Daughter of the Void",
      collectorNumber: "2",
      name: "Kai'Sa - Daughter of the Void (Alternate Art)",
    });
    store.seedCard(kaisa);
    store.seedCard(alternate);

    const criteria = { search: { type: "name", text: "(Alternate Art)" } } as const;
    const page = await store.cards.getSummaryPage(criteria);

    expect(page.items.map((summary) => summary.printingId)).toEqual([alternate.printingId]);
    await expect(store.cards.count(criteria)).resolves.toBe(page.items.length);
    store.close();
  });

  it("should search card summaries by name, plain rules text, or both", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const drawnName = card("drawn-name", unleashed.code, {
      collectorNumber: "1",
      name: "Drawn Name",
    });
    const drawSpell = card("draw-spell", unleashed.code, {
      cleanName: "Spell",
      collectorNumber: "2",
      name: "Spell",
      rulesText: { rich: "<p>Draw 2.</p>", plain: "Draw 2.", flavour: null },
    });
    const otherCard = card("other", unleashed.code, { collectorNumber: "3" });
    store.seedCard(drawnName);
    store.seedCard(drawSpell);
    store.seedCard(otherCard);

    await expect(
      store.cards.getSummaryPage({ search: { type: "name", text: "draw" } }),
    ).resolves.toEqual(
      Page.create(
        [
          {
            printingId: drawnName.printingId,
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
            printingId: drawSpell.printingId,
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
            printingId: drawnName.printingId,
            riftboundId: drawnName.riftboundId,
            domainIds: drawnName.domainIds,
            imageUrl: drawnName.imageUrl,
            name: drawnName.name,
            orientation: drawnName.orientation,
          },
          {
            printingId: drawSpell.printingId,
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

  it("should require every selected domain, on full cards and on summaries alike", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const fury = card("fury", unleashed.code, { collectorNumber: "1", domainIds: ["Fury"] });
    const furyOrder = card("fury-order", unleashed.code, {
      collectorNumber: "2",
      domainIds: ["Fury", "Order"],
    });
    const order = card("order", unleashed.code, { collectorNumber: "3", domainIds: ["Order"] });
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
            printingId: furyOrder.printingId,
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

  it("should refuse to answer with a printing whose media row is gone, in the grid as in the detail", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const kept = card("kept", unleashed.code, { collectorNumber: "1", name: "Kept" });
    const stripped = card("stripped", unleashed.code, { collectorNumber: "2", name: "Stripped" });
    store.seedCard(kept);
    store.seedCard(stripped);
    store.removeCardMedia(stripped.printingId);

    await expect(store.cards.getSummaryPage()).rejects.toThrow(
      "Catalog card stripped is missing required related data.",
    );
    await expect(findCard(stripped.printingId, { cardFinder: store.cards })).rejects.toThrow(
      "Catalog card stripped is missing required related data.",
    );
    await expect(store.cards.count()).resolves.toBe(2);
    store.close();
  });

  it("should resolve every printing a deck names, past the size of a catalog page", async () => {
    const store = createSqliteScenarioStore();
    const unleashed = cardSet("UNL", "2026-05-08T00:00:00");
    store.seedSet(unleashed);
    const seeded = Array.from({ length: 250 }, (_, index) =>
      card(`card-${index}`, unleashed.code, {
        collectorNumber: `${index + 1}`,
        name: `Card ${index}`,
      }),
    );
    for (const each of seeded) store.seedCard(each);
    const requested = seeded.map((each) => each.printingId);

    const resolved = await store.cards.getAllByPrintingIds(requested);

    expect([...resolved].map((found) => found.printingId).sort()).toEqual([...requested].sort());
    store.close();
  });
});
