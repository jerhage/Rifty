import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import type { Deck, DeckVerification } from "@/features/deck/deck/deck";
import { RIFTBOUND_STANDARD } from "@/features/deck/deck/deck-legality";
import type { ListDecksCapabilities } from "@/features/deck/deck/use-cases/list-decks";
import type { SectionsStepProps } from "@/features/deck/presentation/components/build/steps/sections-step";
import {
  DeckSaveData,
  type DeckSaveControls,
} from "@/features/deck/presentation/data/deck-save-data";
import type { DeckBuildCapabilities } from "@/features/deck/presentation/deck-build-start";
import { listDecksQuery } from "@/features/deck/queries/deck-queries";
import { useReadState } from "@/hooks/use-read-state";

import { recordAnnouncements, type Announcement } from "../announcements";
import { createTestWrapper } from "../test-wrapper";

import { deck, fixedClock, sequentialIds } from "./fixtures";

const SAVE_FAILURE = new Error("The store is unavailable.");
const LEGAL: DeckVerification = { type: "legal", ruleset: RIFTBOUND_STANDARD };
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

/** Every value a leaf receives from the sections boundary, narrowed to lifecycle-shaped ones. */
type LeafLifecycleValue = Extract<
  SectionsStepProps[keyof SectionsStepProps],
  { readonly type: string }
>;

interface DeckStore {
  readonly capabilities: DeckBuildCapabilities;
  readonly listing: ListDecksCapabilities;
  listReads(): number;
  writes(): number;
}

function createDeckStore(
  existing: readonly Deck[] = [],
  failure: Error | null = null,
  gate: Promise<void> | null = null,
): DeckStore {
  const saved = [...existing];
  let listReads = 0;
  let writes = 0;

  return {
    capabilities: {
      clock: fixedClock("2026-09-02T10:00:00.000Z"),
      deckLister: { getAll: () => Promise.resolve([...saved]) },
      deckSaver: {
        save: async (written: Deck) => {
          writes += 1;
          if (gate) await gate;
          if (failure) throw failure;
          saved.push(written);
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
    writes: () => writes,
  };
}

function DeckListProbe({ listing }: { readonly listing: ListDecksCapabilities }) {
  const { state } = useReadState(listDecksQuery(listing));

  return (
    <Text>
      {match(state)
        .with({ type: "loading" }, () => "decks: loading")
        .with({ type: "failed" }, () => "decks: failed")
        .with({ type: "success" }, ({ decks }) => `decks: [${decks.map((one) => one.name).join()}]`)
        .exhaustive()}
    </Text>
  );
}

async function renderDeckSave(store: DeckStore, name = "Storm") {
  const onChangeName = jest.fn();
  const onSaved = jest.fn();
  const childProps: (readonly string[])[] = [];
  let controls: DeckSaveControls | null = null;

  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DeckListProbe listing={store.listing} />
      <DeckSaveData
        capabilities={store.capabilities}
        onChangeName={onChangeName}
        onSaved={onSaved}
        request={{ chosenChampion: null, entries: [], name, verification: LEGAL }}
        start={{ type: "create" }}
      >
        {(received) => {
          childProps.push(Object.keys(received));
          controls = received;

          return <Text>section pool</Text>;
        }}
      </DeckSaveData>
    </SafeAreaProvider>,
    { wrapper: createTestWrapper() },
  );

  await screen.findByText(/^decks: \[/);

  return { childProps, controls: () => controls, onChangeName, onSaved };
}

function createGatedDeckStore(): { release: () => void; store: DeckStore } {
  const held: { release: () => void } = { release: () => undefined };
  const gate = new Promise<void>((resolve) => {
    held.release = resolve;
  });

  return { release: () => held.release(), store: createDeckStore([], null, gate) };
}

async function pressSave() {
  await fireEvent.press(screen.getByRole("button", { name: "Save deck" }));
}

describe("DeckSaveData", () => {
  let announcements: Announcement[] = [];

  beforeEach(() => {
    announcements = recordAnnouncements();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should refetch the deck list when a save succeeds", async () => {
    const store = createDeckStore();
    const { onSaved } = await renderDeckSave(store);

    expect(store.listReads()).toBe(1);

    await pressSave();

    expect(await screen.findByText("decks: [Storm]")).toBeTruthy();
    expect(store.listReads()).toBe(2);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("should leave the deck list alone when the name is already taken", async () => {
    const store = createDeckStore([deck("storm", { name: "Storm" })]);
    const { onSaved } = await renderDeckSave(store);

    await pressSave();

    expect(await screen.findByText("You already have a deck with that name.")).toBeTruthy();
    expect(store.listReads()).toBe(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should report a missing name rather than write a deck that has none", async () => {
    const store = createDeckStore();
    const { onSaved } = await renderDeckSave(store, "");

    await pressSave();

    expect(await screen.findByText("Give the deck a name.")).toBeTruthy();
    expect(store.writes()).toBe(0);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should render its own failure when the write throws", async () => {
    const store = createDeckStore([], SAVE_FAILURE);
    const { onSaved } = await renderDeckSave(store);

    await pressSave();

    expect(await screen.findByText("Could not save the deck. Try again.")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should label the control while the write is in flight", async () => {
    const { release, store } = createGatedDeckStore();
    await renderDeckSave(store);

    await pressSave();

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeTruthy();

    release();

    expect(await screen.findByText("decks: [Storm]")).toBeTruthy();
  });

  it("should refuse a second press while the write is in flight", async () => {
    const { release, store } = createGatedDeckStore();
    await renderDeckSave(store);

    await pressSave();
    const inFlight = await screen.findByRole("button", { name: "Saving…" });

    expect(inFlight.props.accessibilityState).toEqual({ busy: true, disabled: true });

    await fireEvent.press(inFlight);

    expect(store.writes()).toBe(1);

    release();

    expect(await screen.findByText("decks: [Storm]")).toBeTruthy();
    expect(store.writes()).toBe(1);
  });

  it("should let the control take a press again once the write has failed", async () => {
    const store = createDeckStore([], SAVE_FAILURE);
    await renderDeckSave(store);

    await pressSave();
    await screen.findByText("Could not save the deck. Try again.");

    const control = screen.getByRole("button", { name: "Save deck" });

    expect(control.props.accessibilityState).toEqual({ busy: false, disabled: false });

    await fireEvent.press(control);

    expect(store.writes()).toBe(2);
  });

  it("should clear a name clash when the name is edited", async () => {
    const store = createDeckStore([deck("storm", { name: "Storm" })]);
    const { controls, onChangeName } = await renderDeckSave(store);
    await pressSave();
    await screen.findByText("You already have a deck with that name.");

    await act(() => controls()?.changeName("Storm Two"));

    expect(onChangeName).toHaveBeenCalledWith("Storm Two");
    await waitFor(() => expect(screen.getByText("Ready to save")).toBeTruthy());
  });

  it("should hand its child a name callback and nothing of the save's lifecycle", async () => {
    const store = createDeckStore();
    const { childProps } = await renderDeckSave(store);

    await pressSave();
    await screen.findByText("decks: [Storm]");

    for (const keys of childProps) expect(keys).toEqual(["changeName"]);
  });

  it("should not name a lifecycle value anywhere in the leaf step's props", () => {
    const leafTakesNoLifecycleValue: [LeafLifecycleValue] extends [never] ? true : false = true;

    expect(leafTakesNoLifecycleValue).toBe(true);
  });

  it("should announce nothing before the save is pressed", async () => {
    const store = createDeckStore();
    await renderDeckSave(store);

    expect(announcements).toEqual([]);
  });

  it("should announce a save that succeeded", async () => {
    const store = createDeckStore();
    await renderDeckSave(store);

    await pressSave();
    await screen.findByText("decks: [Storm]");

    expect(announcements).toEqual([{ message: "Deck saved.", queued: true }]);
  });

  it("should announce a save that failed", async () => {
    const store = createDeckStore([], SAVE_FAILURE);
    await renderDeckSave(store);

    await pressSave();
    await screen.findByText("Could not save the deck. Try again.");

    expect(announcements).toEqual([
      { message: "Could not save the deck. Try again.", queued: false },
    ]);
  });

  it("should announce the refusal when the name is already taken", async () => {
    const store = createDeckStore([deck("storm", { name: "Storm" })]);
    await renderDeckSave(store);

    await pressSave();
    await screen.findByText("You already have a deck with that name.");

    expect(announcements).toEqual([
      { message: "You already have a deck with that name.", queued: false },
    ]);
  });
});
