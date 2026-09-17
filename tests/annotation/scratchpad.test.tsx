import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { NoteSections } from "@/features/annotation/presentation/components/note-sections";
import { NoteSectionsData } from "@/features/annotation/presentation/data/note-sections-data";
import {
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";

import {
  createBookmarkStore,
  createNoteStore,
  createSubjectStore,
  fixedClock,
  sequentialIds,
  subject,
  type NoteStore,
} from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const CARD = subject("card", "vi");
const PHONE = { height: 874, width: 402 } as const;

async function renderScratchpad(store: NoteStore = createNoteStore()): Promise<NoteStore> {
  const subjects = createSubjectStore();

  await render(
    <NoteSectionsData
      bookmarkLister={createBookmarkStore().manager}
      cardSummariesFinder={subjects.cardSummariesFinder}
      clock={fixedClock(WRITTEN_AT)}
      coreRulesFinder={subjects.coreRulesFinder}
      idGenerator={sequentialIds()}
      noteManager={store.manager}
    >
      {(written) => <NoteSections written={written} />}
    </NoteSectionsData>,
    { wrapper: createTestWrapper(PHONE) },
  );
  await screen.findByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` });

  return store;
}

async function addScratchpadNote(body: string) {
  await fireEvent.press(
    screen.getByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` }),
  );
  await fireEvent.changeText(screen.getByLabelText(`New note on ${SCRATCHPAD_NOTES_NAME}`), body);
  await fireEvent.press(
    screen.getByRole("button", { name: `Save the new note on ${SCRATCHPAD_NOTES_NAME}` }),
  );
}

describe("the scratchpad", () => {
  it("should name itself and say when nothing has been written in it", async () => {
    await renderScratchpad();

    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
    expect(screen.getByText(SCRATCHPAD_EMPTY_MESSAGE)).toBeTruthy();
    expect(screen.getByText("0 notes")).toBeTruthy();
  });

  it("should invite anything at all into a new note", async () => {
    await renderScratchpad();

    await fireEvent.press(
      screen.getByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` }),
    );

    expect(screen.getByLabelText(`New note on ${SCRATCHPAD_NOTES_NAME}`).props.placeholder).toBe(
      SCRATCHPAD_PLACEHOLDER,
    );
  });

  it("should reach the store through the one read the whole screen shares", async () => {
    const store = await renderScratchpad();

    expect(store.scopes()).toEqual([{ type: "all" }]);
  });

  it("should store a note with no subject and read it back", async () => {
    const store = await renderScratchpad();

    await addScratchpadNote("Match one: mulliganed two.");

    await waitFor(() => expect(store.notes()).toHaveLength(1));
    expect(store.notes()[0]?.subject).toBeNull();
    expect(await screen.findByText("1 note")).toBeTruthy();
    expect(screen.getByLabelText(`Note 1 on ${SCRATCHPAD_NOTES_NAME}`).props.defaultValue).toBe(
      "Match one: mulliganed two.",
    );
  });

  it("should keep what it holds out of every subject's notes", async () => {
    const store = await renderScratchpad();

    await addScratchpadNote("Trades to chase.");

    await waitFor(() => expect(store.notes()).toHaveLength(1));
    await expect(store.manager.getAll({ type: "onSubject", subject: CARD })).resolves.toEqual([]);
    await expect(
      store.manager.getAll({ type: "onSubject", subject: subject("coreRule", "501.1") }),
    ).resolves.toEqual([]);
    const everything = await store.manager.getAll({ type: "all" });

    expect(everything.filter(({ subject }) => subject === null)).toHaveLength(1);
  });

  it("should collect several notes rather than hold one", async () => {
    const store = await renderScratchpad();

    await addScratchpadNote("Round one.");
    await screen.findByLabelText(`Note 1 on ${SCRATCHPAD_NOTES_NAME}`);
    await addScratchpadNote("Round two.");

    await waitFor(() => expect(store.notes()).toHaveLength(2));
    expect(await screen.findByText("2 notes")).toBeTruthy();
  });

  it("should give one up through its own control", async () => {
    const store = await renderScratchpad();

    await addScratchpadNote("A note to drop.");
    await screen.findByLabelText(`Note 1 on ${SCRATCHPAD_NOTES_NAME}`);

    await fireEvent.press(
      screen.getByRole("button", { name: `Remove note 1 on ${SCRATCHPAD_NOTES_NAME}` }),
    );

    await waitFor(() => expect(store.notes()).toEqual([]));
    expect(store.removals()).toBe(1);
  });
});
