import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { NotedSubjectSections } from "@/features/annotation/presentation/components/noted-subject-sections";
import { Scratchpad } from "@/features/annotation/presentation/components/scratchpad";
import { NotedSubjectsData } from "@/features/annotation/presentation/data/noted-subjects-data";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";
import { notedCardsSectionLabel } from "@/features/annotation/presentation/noted-subjects-format";
import {
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";
import {
  SAVED_TITLE,
  SCRATCHPAD_EMPTY_SUMMARY,
  SCRATCHPAD_WRITTEN_SUMMARY,
} from "@/components/app-shell/saved-format";
import { SavedScreen } from "@/components/app-shell/saved-screen";
import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";

import {
  createNoteStore,
  createSubjectStore,
  fixedClock,
  sequentialIds,
  subject,
  writtenNote,
  type NoteStore,
} from "../annotation/fixtures";
import { createTestWrapper } from "../test-wrapper";

const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const CARD = subject("card", "vi");
const PHONE = { height: 874, width: 402 } as const;
const VI = {
  printingId: printingIdSchema.parse("vi"),
  riftboundId: "ogn-119-298",
  name: "Vi",
  domainIds: ["Fury"],
  orientation: "portrait",
  imageUrl: "http://localhost:8787/ogn-119-298.webp",
} as const satisfies CardSummary;

async function renderSaved(store: NoteStore = createNoteStore()): Promise<NoteStore> {
  const subjects = createSubjectStore([VI]);

  await render(
    <NotesData
      clock={fixedClock(WRITTEN_AT)}
      idGenerator={sequentialIds()}
      noteManager={store.manager}
      subject={null}
    >
      {(written) => (
        <SavedScreen
          notes={
            <NotedSubjectsData
              cardSummariesFinder={subjects.cardSummariesFinder}
              coreRulesFinder={subjects.coreRulesFinder}
              noteManager={store.manager}
            >
              {(noted) => <NotedSubjectSections noted={noted} />}
            </NotedSubjectsData>
          }
          scratchpad={<Scratchpad written={written} />}
          scratchpadNoteCount={written.notes.length}
        />
      )}
    </NotesData>,
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

describe("the saved screen", () => {
  it("should name itself and hold the scratchpad the rules tab used to", async () => {
    await renderSaved();

    expect(screen.getByRole("header", { name: SAVED_TITLE })).toBeTruthy();
    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
  });

  it("should hold a note on a card beside the scratchpad rather than in it", async () => {
    await renderSaved(
      createNoteStore([writtenNote("note-1", CARD, "Holds the point.", WRITTEN_AT)]),
    );

    expect(await screen.findByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: VI.name })).toBeTruthy();
    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
    expect(screen.getByLabelText(`0 notes on ${SCRATCHPAD_NOTES_NAME}`)).toBeTruthy();
  });

  it("should store a note written from it against no subject at all", async () => {
    const store = await renderSaved();

    await addScratchpadNote("Match one: mulliganed two.");

    await waitFor(() => expect(store.notes()).toHaveLength(1));
    expect(store.notes()[0]?.subject).toBeNull();
    expect(store.scopes()).toContainEqual({ type: "standalone" });
    await expect(store.manager.getAll({ type: "onSubject", subject: CARD })).resolves.toEqual([]);
  });
});

describe("the saved summary", () => {
  it("should say the scratchpad is empty while nothing has been written in it", async () => {
    await renderSaved();

    expect(screen.getByText(SCRATCHPAD_EMPTY_SUMMARY)).toBeTruthy();
  });

  it("should say the scratchpad is written once something is in it", async () => {
    await renderSaved();

    await addScratchpadNote("Trades to chase.");

    expect(await screen.findByText(SCRATCHPAD_WRITTEN_SUMMARY)).toBeTruthy();
    expect(screen.queryByText(SCRATCHPAD_EMPTY_SUMMARY)).toBeNull();
  });

  it("should count nothing that has no section yet, so no zero stands for one", async () => {
    await renderSaved();

    expect(screen.queryByText(/\d+ rules?/)).toBeNull();
    expect(screen.queryByText(/\d+ cards?/)).toBeNull();
  });
});
