import { act, renderHook } from "@testing-library/react-native";

import type { DeckBuildMode } from "@/features/deck/presentation/deck-build-mode";
import { NOT_PICKED, pickOf } from "@/features/deck/presentation/deck-build-steps";
import { useDeckBuild } from "@/features/deck/presentation/hooks/use-deck-build";

import { card } from "../card/fixtures";
import { createTestWrapper } from "../test-wrapper";

import { cardId, deck, resolvedDeck } from "./fixtures";

const legend = card("legend", "OGN", {
  name: "Volibear",
  domainIds: ["Fury"],
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const otherLegend = card("legend-two", "OGN", {
  name: "Lux",
  domainIds: ["Mind"],
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const champion = card("champion", "OGN", {
  name: "Yasuo",
  classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
});

const savedLegend = card("ogn-003", "OGN", {
  name: "Ember Legend",
  cardId: cardId("Ember Legend"),
  classification: { typeId: "Legend", supertypeId: null, rarityId: "rare" },
});
const savedMainCard = card("ogn-001", "OGN", { name: "Card 001", cardId: cardId("Card 001") });
const savedRune = card("ogn-rune", "OGN", { name: "Fury Rune", cardId: cardId("Fury Rune") });
const savedBattlefield = card("ogn-100", "OGN", {
  name: "Ember Field",
  cardId: cardId("Ember Field"),
});
const savedSideboardCard = card("ogn-050", "OGN", {
  name: "Ember Answer",
  cardId: cardId("Ember Answer"),
});
const unseatedChampion = card("ogn-hero", "OGN", {
  name: "Ember Hero",
  cardId: cardId("Ember Hero"),
  classification: { typeId: "Unit", supertypeId: "Champion", rarityId: "rare" },
});

const savedDeck = deck("deck-2", {
  chosenChampionCardId: "Ember Hero",
  entries: [
    { section: "legend", cardId: "Ember Legend", printingId: "ogn-003", quantity: 1 },
    { section: "mainDeck", cardId: "Card 001", printingId: "ogn-001", quantity: 4 },
    { section: "runeDeck", cardId: "Fury Rune", printingId: "ogn-rune", quantity: 12 },
    { section: "battlefield", cardId: "Ember Field", printingId: "ogn-100", quantity: 3 },
    { section: "sideboard", cardId: "Ember Answer", printingId: "ogn-050", quantity: 2 },
  ],
});

const savedEdit = resolvedDeck(
  savedDeck,
  [savedLegend, savedMainCard, savedRune, savedBattlefield, savedSideboardCard],
  unseatedChampion,
);

async function renderBuild(mode: DeckBuildMode = { type: "create" }) {
  const onExit = jest.fn();
  const rendered = await renderHook(() => useDeckBuild(mode, { onExit }), {
    wrapper: createTestWrapper(),
  });

  return { onExit, result: rendered.result };
}

describe("deck build", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should open a new deck on the first step and an edit on the sections step", async () => {
    expect((await renderBuild()).result.current.steps.step.id).toBe("legend");

    const editing = await renderBuild({ type: "edit", resolvedDeck: savedEdit });

    expect(editing.result.current.steps.step.id).toBe("sections");
  });

  it("should keep every entry of the edited deck in the opening draft", async () => {
    const { result } = await renderBuild({ type: "edit", resolvedDeck: savedEdit });

    expect(result.current.draft.entries).toHaveLength(savedDeck.entries.length);
    expect(result.current.draft.entries).toEqual(expect.arrayContaining([...savedDeck.entries]));
    expect(result.current.draft.draft.legend).toEqual(pickOf(savedLegend));
  });

  it("should keep a chosen champion the main deck does not seat", async () => {
    const { result } = await renderBuild({ type: "edit", resolvedDeck: savedEdit });

    expect(savedDeck.entries).not.toContainEqual(
      expect.objectContaining({ section: "mainDeck", cardId: unseatedChampion.cardId }),
    );
    expect(result.current.draft.draft.chosenChampion).toEqual(pickOf(unseatedChampion));
  });

  it("should leave the builder when back is pressed on the first step", async () => {
    const { onExit, result } = await renderBuild();

    await act(() => result.current.steps.back());

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(result.current.steps.step.id).toBe("legend");
  });

  it("should reset the pool to the legend's domains and clear the query on the sections step", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.pool.setQuery("storm"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleKeyword("shield"));
    await act(() => result.current.pool.applyFilters());
    await act(() => result.current.steps.next());
    await act(() => result.current.steps.next());

    expect(result.current.steps.step.id).toBe("sections");
    expect(result.current.pool.filters.domainIds).toEqual(["Fury"]);
    expect(result.current.pool.filters.keywordIds).toEqual([]);
    expect(result.current.pool.query).toBe("");
  });

  it("should reset the pool to the legend's domains when the section changes", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.steps.goToStep("sections"));
    await act(() => result.current.pool.openFilters());
    await act(() => result.current.pool.toggleDomain("Fury"));
    await act(() => result.current.pool.applyFilters());

    expect(result.current.pool.filters.domainIds).toEqual([]);

    await act(() => result.current.pool.setSection("runeDeck"));

    expect(result.current.pool.section).toBe("runeDeck");
    expect(result.current.pool.filters.domainIds).toEqual(["Fury"]);
  });

  it("should clear the chosen champion when a different legend is picked", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.draft.pickChampion(champion));

    expect(result.current.draft.draft.chosenChampion).toEqual(pickOf(champion));

    await act(() => result.current.draft.pickLegend(otherLegend));

    expect(result.current.draft.draft.legend).toEqual(pickOf(otherLegend));
    expect(result.current.draft.draft.chosenChampion).toEqual(NOT_PICKED);
  });

  it("should deselect a legend or a champion picked twice", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickLegend(legend));
    await act(() => result.current.draft.pickLegend(legend));

    expect(result.current.draft.draft.legend).toEqual(NOT_PICKED);

    await act(() => result.current.draft.pickChampion(champion));
    await act(() => result.current.draft.pickChampion(champion));

    expect(result.current.draft.draft.chosenChampion).toEqual(NOT_PICKED);
  });

  it("should keep one copy of the chosen champion in the main deck", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.draft.pickChampion(champion));
    await act(() => result.current.draft.setQuantity("mainDeck", champion, 0));

    expect(
      result.current.draft.entries.find((entry) => entry.printingId === champion.printingId)
        ?.quantity,
    ).toBe(1);

    await act(() => result.current.draft.setQuantity("mainDeck", champion, 3));

    expect(
      result.current.draft.entries.find((entry) => entry.printingId === champion.printingId)
        ?.quantity,
    ).toBe(3);
  });

  it("should debounce the legend query while the field stays live", async () => {
    const { result } = await renderBuild();

    await act(() => result.current.legends.setQuery("voli"));

    expect(result.current.legends.query).toBe("voli");
    expect(result.current.legends.searchQuery).toBe("");

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.legends.searchQuery).toBe("voli");
  });
});
