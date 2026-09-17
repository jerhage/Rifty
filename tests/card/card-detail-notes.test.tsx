import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { Note } from "@/features/annotation/note";
import { SubjectNotes } from "@/features/annotation/presentation/components/subject-notes";
import {
  CARD_NOTES_NAME,
  CARD_NOTES_TITLE,
  CardDetailScreen,
} from "@/features/card/presentation/screens/card-detail-screen";

import { card, cardSet } from "./fixtures";
import {
  createNoteStore,
  fixedClock,
  noteId,
  sequentialIds,
  subject,
  type NoteStore,
} from "../annotation/fixtures";
import { recordAnnouncements } from "../announcements";
import { createTestWrapper } from "../test-wrapper";

const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const UNLEASHED = cardSet("UNL", "2026-05-08T00:00:00");
const VI = card("vi", UNLEASHED.code, { name: "Vi - Piltover Enforcer" });

function cardNote(id: string, body: string): Note {
  return {
    id: noteId(id),
    subject: { kind: "card", id: VI.printingId },
    title: "",
    body,
    createdAt: WRITTEN_AT,
    updatedAt: WRITTEN_AT,
  };
}

function createWrapper() {
  const QueryWrapper = createTestWrapper();

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryWrapper>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { bottom: 0, left: 0, right: 0, top: 0 },
          }}
        >
          {children}
        </SafeAreaProvider>
      </QueryWrapper>
    );
  };
}

async function renderCardDetail(store: NoteStore = createNoteStore()): Promise<NoteStore> {
  await render(
    <CardDetailScreen
      bookmarkControl={null}
      card={VI}
      notes={
        <SubjectNotes
          clock={fixedClock(WRITTEN_AT)}
          idGenerator={sequentialIds()}
          noteManager={store.manager}
          notesName={CARD_NOTES_NAME}
          subject={{ kind: "card", id: VI.printingId }}
        />
      }
    />,
    { wrapper: createWrapper() },
  );
  await screen.findByRole("button", { name: `Add a note to ${CARD_NOTES_NAME}` });

  return store;
}

async function addNote(body: string) {
  await fireEvent.press(screen.getByRole("button", { name: `Add a note to ${CARD_NOTES_NAME}` }));
  await fireEvent.changeText(screen.getByLabelText(`New note on ${CARD_NOTES_NAME}`), body);
  await fireEvent.press(
    screen.getByRole("button", { name: `Save the new note on ${CARD_NOTES_NAME}` }),
  );
}

describe("the notes on a card", () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should stand under their own heading on the card, saying how many there are", async () => {
    await renderCardDetail(createNoteStore([cardNote("note-0", "Holds the flank.")]));

    expect(screen.getByRole("header", { name: CARD_NOTES_TITLE })).toBeTruthy();
    expect(await screen.findByText("1 note")).toBeTruthy();
    expect(screen.getByText("Note 1 · 2026-09-16")).toBeTruthy();
  });

  it("should carry as many notes as the card has been given", async () => {
    await renderCardDetail(
      createNoteStore([cardNote("note-0", "Holds the flank."), cardNote("note-1", "Trade early.")]),
    );

    expect(await screen.findByText("2 notes")).toBeTruthy();
    expect(screen.getByLabelText(`Note 1 on ${CARD_NOTES_NAME}`).props.defaultValue).toBe(
      "Trade early.",
    );
    expect(screen.getByLabelText(`Note 2 on ${CARD_NOTES_NAME}`).props.defaultValue).toBe(
      "Holds the flank.",
    );
  });

  it("should add one against the card's own subject", async () => {
    const store = await renderCardDetail();

    await addNote("Mulligan it against aggro.");

    await waitFor(() => expect(store.notes()).toHaveLength(1));
    expect(store.notes()[0]?.subject).toEqual({ kind: "card", id: VI.printingId });
    expect(store.notes()[0]?.body).toBe("Mulligan it against aggro.");
    expect(await screen.findByText("1 note")).toBeTruthy();
  });

  it("should change a written one in place rather than add a second", async () => {
    const store = await renderCardDetail();

    await addNote("A first draft.");
    await screen.findByLabelText(`Note 1 on ${CARD_NOTES_NAME}`);

    await fireEvent(screen.getByLabelText(`Note 1 on ${CARD_NOTES_NAME}`), "endEditing", {
      nativeEvent: { text: "The settled wording." },
    });

    await waitFor(() =>
      expect(store.notes().map((note) => note.body)).toEqual(["The settled wording."]),
    );
  });

  it("should remove one only through its own control", async () => {
    const store = await renderCardDetail();

    await addNote("A note to drop.");
    await screen.findByLabelText(`Note 1 on ${CARD_NOTES_NAME}`);

    await fireEvent.press(
      screen.getByRole("button", { name: `Remove note 1 on ${CARD_NOTES_NAME}` }),
    );

    await waitFor(() => expect(store.notes()).toEqual([]));
    expect(store.removals()).toBe(1);
  });

  it("should store nothing when the body is blank, and say why", async () => {
    const announcements = recordAnnouncements();
    const store = await renderCardDetail();

    await fireEvent.press(screen.getByRole("button", { name: `Add a note to ${CARD_NOTES_NAME}` }));
    await fireEvent.press(
      screen.getByRole("button", { name: `Save the new note on ${CARD_NOTES_NAME}` }),
    );

    await waitFor(() =>
      expect(announcements.at(-1)?.message).toBe("A note needs something written in it."),
    );
    expect(store.notes()).toEqual([]);
  });

  it("should read only the notes on this card, leaving a rule's and the scratchpad's alone", async () => {
    const store = createNoteStore([
      {
        id: noteId("rule-note"),
        subject: subject("coreRule", "501.1"),
        title: "",
        body: "Chip damage is dealt.",
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      },
      {
        id: noteId("loose-note"),
        subject: null,
        title: "",
        body: "Round three went long.",
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      },
      cardNote("card-note", "Holds the flank."),
    ]);
    await renderCardDetail(store);

    expect(await screen.findByText("1 note")).toBeTruthy();
    expect(screen.getByLabelText(`Note 1 on ${CARD_NOTES_NAME}`).props.defaultValue).toBe(
      "Holds the flank.",
    );
    expect(screen.queryByDisplayValue("Chip damage is dealt.")).toBeNull();
    expect(screen.queryByDisplayValue("Round three went long.")).toBeNull();
    expect(store.scopes()).toEqual([
      { type: "onSubject", subject: { kind: "card", id: VI.printingId } },
    ]);
  });
});
