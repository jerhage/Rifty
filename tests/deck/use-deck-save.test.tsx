import { act, renderHook, waitFor } from "@testing-library/react-native";

import type { Deck } from "@/features/deck/deck/deck";
import type { ListDecksCapabilities } from "@/features/deck/deck/use-cases/list-decks";
import type { DeckBuildCapabilities } from "@/features/deck/presentation/deck-build-start";
import {
  useDeckSave,
  type DeckSaveRequest,
} from "@/features/deck/presentation/hooks/use-deck-save";
import { listDecksQuery } from "@/features/deck/presentation/queries/deck-queries";
import { useReadState } from "@/hooks/use-read-state";

import { createTestWrapper } from "../test-wrapper";

import { deck, fixedClock, sequentialIds } from "./fixtures";

const STORM: DeckSaveRequest = { chosenChampionCardId: null, entries: [], name: "Storm" };

interface DeckStore {
  readonly capabilities: DeckBuildCapabilities;
  readonly listing: ListDecksCapabilities;
  listReads(): number;
}

function createDeckStore(existing: readonly Deck[] = []): DeckStore {
  const saved = [...existing];
  let listReads = 0;

  return {
    capabilities: {
      clock: fixedClock("2026-09-02T10:00:00.000Z"),
      deckLister: { getAll: () => Promise.resolve([...saved]) },
      deckSaver: {
        save: (written: Deck) => {
          saved.push(written);
          return Promise.resolve();
        },
      },
      idGenerator: sequentialIds(),
    },
    listing: {
      deckLister: {
        getAll: () => {
          listReads += 1;
          return Promise.resolve([...saved]);
        },
      },
    },
    listReads: () => listReads,
  };
}

async function renderDeckSave(store: DeckStore) {
  const onSaved = jest.fn();
  const rendered = await renderHook(
    () => ({
      decks: useReadState(listDecksQuery(store.listing)),
      saving: useDeckSave({ type: "new" }, store.capabilities, { onSaved }),
    }),
    { wrapper: createTestWrapper() },
  );

  await waitFor(() => expect(rendered.result.current.decks.state.type).toBe("success"));

  return { onSaved, result: rendered.result };
}

describe("useDeckSave", () => {
  it("should refetch the deck list when a save succeeds", async () => {
    const store = createDeckStore();
    const { onSaved, result } = await renderDeckSave(store);

    expect(store.listReads()).toBe(1);

    await act(() => result.current.saving.save(STORM));

    await waitFor(() => expect(result.current.saving.state).toMatchObject({ type: "success" }));
    await waitFor(() =>
      expect(result.current.decks.state).toMatchObject({
        type: "success",
        decks: [{ name: "Storm" }],
      }),
    );
    expect(store.listReads()).toBe(2);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("should leave the deck list alone when the name is already taken", async () => {
    const store = createDeckStore([deck("storm", { name: "Storm" })]);
    const { onSaved, result } = await renderDeckSave(store);

    await act(() => result.current.saving.save(STORM));

    await waitFor(() => expect(result.current.saving.state).toEqual({ type: "nameTaken" }));
    expect(store.listReads()).toBe(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should report a missing name when the name is blank", async () => {
    const store = createDeckStore();
    const { onSaved, result } = await renderDeckSave(store);

    await act(() => result.current.saving.save({ ...STORM, name: "" }));

    await waitFor(() => expect(result.current.saving.state).toEqual({ type: "nameMissing" }));
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should return to idle when the name is edited after a clash", async () => {
    const store = createDeckStore([deck("storm", { name: "Storm" })]);
    const { result } = await renderDeckSave(store);
    await act(() => result.current.saving.save(STORM));
    await waitFor(() => expect(result.current.saving.state).toEqual({ type: "nameTaken" }));

    await act(() => result.current.saving.clearFailure());

    await waitFor(() => expect(result.current.saving.state).toEqual({ type: "idle" }));
  });
});
