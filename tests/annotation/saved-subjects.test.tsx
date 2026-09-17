import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";

import type { Note } from "@/features/annotation/note";
import { SavedSections } from "@/features/annotation/presentation/components/saved-sections";
import { SavedSectionsData } from "@/features/annotation/presentation/data/saved-sections-data";
import { SCRATCHPAD_TITLE } from "@/features/annotation/presentation/note-format";
import {
  NOTHING_SAVED_ON_CARDS_MESSAGE,
  savedCardsSectionLabel,
  savedCoreRulesSectionLabel,
  unfindableNotesSectionLabel,
} from "@/features/annotation/presentation/saved-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { CORE_RULES_NOTHING_SAVED_MESSAGE } from "@/features/rules/presentation/core-rules-format";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";

import {
  createBookmarkStore,
  createNoteStore,
  createSubjectStore,
  fixedClock,
  sequentialIds,
  subject,
  writtenNote,
  type BookmarkStore,
  type NoteStore,
  type SubjectStore,
} from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const VI_PRINTING = "ogn-119-298";
const WITHDRAWN_PRINTING = "ogn-999-298";
const RULE_NUMBER = "100.1";
const WITHDRAWN_NAME = `Card ${WITHDRAWN_PRINTING}`;
const PHONE = { height: 874, width: 402 } as const;

const VI: CardSummary = {
  printingId: printingIdSchema.parse(VI_PRINTING),
  riftboundId: "ogn-119-298",
  name: "Vi",
  domainIds: ["Fury"],
  orientation: "portrait",
  imageUrl: "http://localhost:8787/ogn-119-298.webp",
};

const GAME_CONCEPTS: CoreRule = {
  number: coreRuleNumberSchema.parse("100"),
  parentNumber: null,
  position: 0,
  kind: "heading",
  body: "Game Concepts",
  details: [],
};

const A_GAME: CoreRule = {
  number: coreRuleNumberSchema.parse(RULE_NUMBER),
  parentNumber: coreRuleNumberSchema.parse("100"),
  position: 1,
  kind: "rule",
  body: "A game of Riftbound is played between two players.",
  details: [],
};

const CARD_NOTE = writtenNote(
  "note-1",
  subject("card", VI_PRINTING),
  "Holds the point against aggro.",
  "2026-09-14T10:00:00.000Z",
);
const RULE_NOTE = writtenNote(
  "note-2",
  subject("coreRule", RULE_NUMBER),
  "Came up in round three.",
  "2026-09-15T10:00:00.000Z",
);
const SECOND_CARD_NOTE = writtenNote(
  "note-3",
  subject("card", VI_PRINTING),
  "Trade it for the legend instead.",
  "2026-09-16T10:00:00.000Z",
);
const WITHDRAWN_NOTE = writtenNote(
  "note-4",
  subject("card", WITHDRAWN_PRINTING),
  "Whatever this was, it mattered.",
  "2026-09-16T11:00:00.000Z",
);
const SCRATCHPAD_NOTE = writtenNote("note-5", null, "Trades to chase.", "2026-09-16T12:00:00.000Z");
const MARKED_CARD = subject("card", VI_PRINTING);
const MARKED_RULE = subject("coreRule", RULE_NUMBER);
const MARKED_WITHDRAWN_CARD = subject("card", WITHDRAWN_PRINTING);

interface SavedStores {
  readonly bookmarks: BookmarkStore;
  readonly notes: NoteStore;
  readonly subjects: SubjectStore;
}

async function renderSaved(
  seeded: readonly Note[],
  marked: readonly AnnotationSubject[] = [],
): Promise<SavedStores> {
  const bookmarks = createBookmarkStore(marked);
  const notes = createNoteStore(seeded);
  const subjects = createSubjectStore([VI], [GAME_CONCEPTS, A_GAME]);

  await render(
    <SavedSectionsData
      bookmarkManager={bookmarks.manager}
      cardSummariesFinder={subjects.cardSummariesFinder}
      clock={fixedClock("2026-09-16T13:00:00.000Z")}
      coreRulesFinder={subjects.coreRulesFinder}
      idGenerator={sequentialIds("written")}
      noteManager={notes.manager}
    >
      {(saved) => <SavedSections saved={saved} />}
    </SavedSectionsData>,
    { wrapper: createTestWrapper(PHONE) },
  );
  await screen.findByRole("header", { name: SCRATCHPAD_TITLE });

  return { bookmarks, notes, subjects };
}

function sectionHolding(label: string) {
  const header = screen.getByRole("header", { name: label });

  if (header.parent === null) throw new Error(`nothing stands around ${label}`);

  return header.parent;
}

describe("the notes gathered under their subjects", () => {
  it("should set a note on a card under the card's name and the printing it was written on", async () => {
    await renderSaved([CARD_NOTE]);

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: VI.name })).toBeTruthy();
    expect(screen.getByText(VI_PRINTING)).toBeTruthy();
    expect(screen.getByLabelText(`Note 1 on ${VI.name}`).props.defaultValue).toBe(CARD_NOTE.body);
  });

  it("should set a note on a rule under its number and the heading it stands beneath", async () => {
    await renderSaved([RULE_NOTE]);

    expect(screen.getByRole("header", { name: savedCoreRulesSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: GAME_CONCEPTS.body })).toBeTruthy();
    expect(screen.getByText(RULE_NUMBER)).toBeTruthy();
    expect(screen.getByLabelText(`Note 1 on rule ${RULE_NUMBER}`).props.defaultValue).toBe(
      RULE_NOTE.body,
    );
  });

  it("should stand a saved rule's own text beneath it, so the note reads without leaving", async () => {
    await renderSaved([RULE_NOTE]);

    expect(screen.getByText(A_GAME.body)).toBeTruthy();
  });

  it("should leave a saved card to its name and its printing, with no rules text beneath", async () => {
    await renderSaved([CARD_NOTE, RULE_NOTE]);

    expect(within(sectionHolding(savedCardsSectionLabel(1))).queryByText(A_GAME.body)).toBeNull();
    expect(
      within(sectionHolding(savedCoreRulesSectionLabel(1))).getByText(A_GAME.body),
    ).toBeTruthy();
  });

  it("should collect several notes on one subject under one heading, newest first", async () => {
    await renderSaved([CARD_NOTE, SECOND_CARD_NOTE]);

    expect(screen.getAllByRole("header", { name: VI.name })).toHaveLength(1);
    expect(screen.getByLabelText(`2 notes on ${VI.name}`)).toBeTruthy();
    expect(screen.getByText("Note 1 · 2026-09-16")).toBeTruthy();
    expect(screen.getByText("Note 2 · 2026-09-14")).toBeTruthy();
  });

  it("should keep the card and rule sections standing with nothing filed in either", async () => {
    await renderSaved([SCRATCHPAD_NOTE]);

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(0) })).toBeTruthy();
    expect(screen.getByRole("header", { name: savedCoreRulesSectionLabel(0) })).toBeTruthy();
    expect(screen.getByText(NOTHING_SAVED_ON_CARDS_MESSAGE)).toBeTruthy();
    expect(screen.getByText(CORE_RULES_NOTHING_SAVED_MESSAGE)).toBeTruthy();
  });

  it("should hold back the section for a missing subject until a note needs it", async () => {
    await renderSaved([CARD_NOTE]);

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.queryByText(/Notes with a missing subject/)).toBeNull();
  });

  it("should ask each feature for its subjects once rather than once per note", async () => {
    const { subjects } = await renderSaved(
      [CARD_NOTE, RULE_NOTE, SECOND_CARD_NOTE, WITHDRAWN_NOTE],
      [MARKED_CARD, MARKED_RULE],
    );

    expect(subjects.cardAsks()).toHaveLength(1);
    expect(subjects.coreRuleAsks()).toHaveLength(1);
    expect(subjects.cardAsks()[0]).toEqual(
      expect.arrayContaining([VI_PRINTING, WITHDRAWN_PRINTING]),
    );
    expect(subjects.coreRuleAsks()[0]).toEqual(expect.arrayContaining([RULE_NUMBER, "100"]));
  });

  it("should ask for what is marked as well as what is noted", async () => {
    const { bookmarks, subjects } = await renderSaved([], [MARKED_CARD, MARKED_RULE]);

    expect(bookmarks.scopes()).toEqual([{ type: "all" }]);
    expect(subjects.cardAsks()[0]).toEqual([VI_PRINTING]);
    expect(subjects.coreRuleAsks()[0]).toEqual(expect.arrayContaining([RULE_NUMBER, "100"]));
  });

  it("should take another note against a subject it already found", async () => {
    const { notes } = await renderSaved([CARD_NOTE]);

    await fireEvent.press(screen.getByRole("button", { name: `Add a note to ${VI.name}` }));
    await fireEvent.changeText(
      screen.getByLabelText(`New note on ${VI.name}`),
      "Blocks the two drop.",
    );
    await fireEvent.press(screen.getByRole("button", { name: `Save the new note on ${VI.name}` }));

    await waitFor(() => expect(notes.notes()).toHaveLength(2));
    expect(notes.notes()[1]?.subject).toEqual(subject("card", VI_PRINTING));
  });

  it("should take an edit to a note already written on a card", async () => {
    const { notes } = await renderSaved([CARD_NOTE]);

    await fireEvent(screen.getByLabelText(`Note 1 on ${VI.name}`), "endEditing", {
      nativeEvent: { text: "Holds the point against anything." },
    });

    await waitFor(() =>
      expect(notes.notes().map(({ body }) => body)).toEqual(["Holds the point against anything."]),
    );
    expect(notes.notes()[0]?.subject).toEqual(subject("card", VI_PRINTING));
  });

  it("should take an edit to a note already written on a rule", async () => {
    const { notes } = await renderSaved([RULE_NOTE]);

    await fireEvent(screen.getByLabelText(`Note 1 on rule ${RULE_NUMBER}`), "endEditing", {
      nativeEvent: { text: "Came up twice in round three." },
    });

    await waitFor(() =>
      expect(notes.notes().map(({ body }) => body)).toEqual(["Came up twice in round three."]),
    );
    expect(notes.notes()[0]?.subject).toEqual(subject("coreRule", RULE_NUMBER));
  });

  it("should seat every note it is given, whatever its subject turns out to be", async () => {
    await renderSaved([CARD_NOTE, RULE_NOTE, WITHDRAWN_NOTE, SCRATCHPAD_NOTE]);

    expect(screen.getByLabelText("Note 1 on the scratchpad").props.defaultValue).toBe(
      SCRATCHPAD_NOTE.body,
    );
    expect(screen.getByLabelText(`Note 1 on ${VI.name}`).props.defaultValue).toBe(CARD_NOTE.body);
    expect(screen.getByLabelText(`Note 1 on rule ${RULE_NUMBER}`).props.defaultValue).toBe(
      RULE_NOTE.body,
    );
    expect(screen.getByText(WITHDRAWN_NOTE.body)).toBeTruthy();
  });
});

describe("a note whose subject cannot be found", () => {
  it("should stand in its own section, saying what it was attached to", async () => {
    await renderSaved([CARD_NOTE, WITHDRAWN_NOTE]);

    expect(screen.getByRole("header", { name: unfindableNotesSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Card" })).toBeTruthy();
    expect(screen.getByText(WITHDRAWN_PRINTING)).toBeTruthy();
    expect(screen.getAllByText(WITHDRAWN_NOTE.body)).toHaveLength(1);
    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
  });

  it("should be shown as it stands, with nothing offering to change it", async () => {
    await renderSaved([WITHDRAWN_NOTE]);

    expect(screen.getByText(WITHDRAWN_NOTE.body)).toBeTruthy();
    expect(screen.queryByLabelText(`Note 1 on ${WITHDRAWN_NAME}`)).toBeNull();
    expect(screen.queryByRole("button", { name: `Add a note to ${WITHDRAWN_NAME}` })).toBeNull();
  });

  it("should be given up from there, which is the only place it can be", async () => {
    const { notes } = await renderSaved([WITHDRAWN_NOTE]);

    await fireEvent.press(
      screen.getByRole("button", { name: `Remove note 1 on ${WITHDRAWN_NAME}` }),
    );

    await waitFor(() => expect(notes.notes()).toEqual([]));
    expect(notes.removals()).toBe(1);
    await waitFor(() =>
      expect(screen.queryByRole("header", { name: unfindableNotesSectionLabel(1) })).toBeNull(),
    );
  });
});

describe("the notes with no subject at all", () => {
  it("should stand in the scratchpad section rather than under a subject", async () => {
    await renderSaved([CARD_NOTE, SCRATCHPAD_NOTE]);

    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
    expect(screen.getByLabelText("Note 1 on the scratchpad").props.defaultValue).toBe(
      SCRATCHPAD_NOTE.body,
    );
    expect(screen.getByLabelText(`1 note on ${VI.name}`)).toBeTruthy();
  });

  it("should keep its section standing even with nothing written in it", async () => {
    await renderSaved([CARD_NOTE]);

    expect(screen.getByRole("header", { name: SCRATCHPAD_TITLE })).toBeTruthy();
    expect(screen.getByLabelText("0 notes on the scratchpad")).toBeTruthy();
  });
});

describe("a subject that is marked rather than written on", () => {
  it("should file a marked rule under its heading with nothing written on it", async () => {
    await renderSaved([], [MARKED_RULE]);

    expect(screen.getByRole("header", { name: savedCoreRulesSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: GAME_CONCEPTS.body })).toBeTruthy();
    expect(screen.getByText(A_GAME.body)).toBeTruthy();
    expect(screen.getByLabelText(`0 notes on rule ${RULE_NUMBER}`)).toBeTruthy();
  });

  it("should file a marked card under its name with nothing written on it", async () => {
    await renderSaved([], [MARKED_CARD]);

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: VI.name })).toBeTruthy();
    expect(screen.getByText(VI_PRINTING)).toBeTruthy();
    expect(screen.getByLabelText(`0 notes on ${VI.name}`)).toBeTruthy();
  });

  it("should stand a rule that is both marked and written on once", async () => {
    await renderSaved([RULE_NOTE], [MARKED_RULE]);

    expect(screen.getByRole("header", { name: savedCoreRulesSectionLabel(1) })).toBeTruthy();
    expect(screen.getAllByRole("header", { name: GAME_CONCEPTS.body })).toHaveLength(1);
    expect(screen.getByLabelText(`1 note on rule ${RULE_NUMBER}`)).toBeTruthy();
  });

  it("should stand a card that is both marked and written on once", async () => {
    await renderSaved([CARD_NOTE], [MARKED_CARD]);

    expect(screen.getByRole("header", { name: savedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getAllByRole("header", { name: VI.name })).toHaveLength(1);
    expect(screen.getByLabelText(`1 note on ${VI.name}`)).toBeTruthy();
  });

  it("should take a note against a subject that only a mark had filed", async () => {
    const { notes } = await renderSaved([], [MARKED_CARD]);

    await fireEvent.press(screen.getByRole("button", { name: `Add a note to ${VI.name}` }));
    await fireEvent.changeText(
      screen.getByLabelText(`New note on ${VI.name}`),
      "Blocks the two drop.",
    );
    await fireEvent.press(screen.getByRole("button", { name: `Save the new note on ${VI.name}` }));

    await waitFor(() => expect(notes.notes()).toHaveLength(1));
    expect(notes.notes()[0]?.subject).toEqual(MARKED_CARD);
  });
});

describe("why a kept row stands where it does", () => {
  it("should say a card that only a mark filed is bookmarked", async () => {
    await renderSaved([], [MARKED_CARD]);

    expect(screen.getByText("Bookmarked")).toBeTruthy();
  });

  it("should say a card that only a note filed is noted, offering no mark to give up", async () => {
    await renderSaved([CARD_NOTE]);

    expect(screen.getByText("Noted")).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: `Bookmark on ${VI.name}` })).toBeNull();
  });

  it("should say a rule that both acts filed is bookmarked and noted", async () => {
    await renderSaved([RULE_NOTE], [MARKED_RULE]);

    expect(screen.getByText("Bookmarked and noted")).toBeTruthy();
  });

  it("should give up the mark from the row and leave what is written standing", async () => {
    const { bookmarks, notes } = await renderSaved([CARD_NOTE], [MARKED_CARD]);

    await fireEvent.press(screen.getByRole("checkbox", { name: `Bookmark on ${VI.name}` }));

    await waitFor(() => expect(bookmarks.marks()).toEqual([]));
    expect(await screen.findByText("Noted")).toBeTruthy();
    expect(notes.notes()).toHaveLength(1);
    expect(screen.getByLabelText(`Note 1 on ${VI.name}`).props.defaultValue).toBe(CARD_NOTE.body);
  });
});

describe("a mark whose subject cannot be found", () => {
  it("should be left out rather than filed as a missing subject", async () => {
    await renderSaved([], [MARKED_WITHDRAWN_CARD]);

    expect(screen.queryByText(WITHDRAWN_PRINTING)).toBeNull();
    expect(screen.queryByRole("header", { name: "Card" })).toBeNull();
    expect(screen.queryByText(/Notes with a missing subject/)).toBeNull();
    expect(screen.getByRole("header", { name: savedCardsSectionLabel(0) })).toBeTruthy();
  });

  it("should leave a note on the same missing subject standing", async () => {
    await renderSaved([WITHDRAWN_NOTE], [MARKED_WITHDRAWN_CARD]);

    expect(screen.getByRole("header", { name: unfindableNotesSectionLabel(1) })).toBeTruthy();
    expect(screen.getByText(WITHDRAWN_NOTE.body)).toBeTruthy();
  });
});
