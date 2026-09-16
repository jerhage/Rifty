import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { Note } from "@/features/annotation/note";
import { NotedSubjectSections } from "@/features/annotation/presentation/components/noted-subject-sections";
import { NotedSubjectsData } from "@/features/annotation/presentation/data/noted-subjects-data";
import {
  notedCardsSectionLabel,
  notedCoreRulesSectionLabel,
  unfindableNotesSectionLabel,
} from "@/features/annotation/presentation/noted-subjects-format";
import type { CardSummary } from "@/features/card/card-summary";
import { printingIdSchema } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";

import {
  createNoteStore,
  createSubjectStore,
  subject,
  writtenNote,
  type NoteStore,
  type SubjectStore,
} from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const VI_PRINTING = "ogn-119-298";
const WITHDRAWN_PRINTING = "ogn-999-298";
const RULE_NUMBER = "100.1";

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

interface NotedScreen {
  readonly notes: NoteStore;
  readonly subjects: SubjectStore;
}

async function renderNoted(seeded: readonly Note[]): Promise<NotedScreen> {
  const notes = createNoteStore(seeded);
  const subjects = createSubjectStore([VI], [GAME_CONCEPTS, A_GAME]);

  await render(
    <NotedSubjectsData
      cardSummariesFinder={subjects.cardSummariesFinder}
      coreRulesFinder={subjects.coreRulesFinder}
      noteManager={notes.manager}
    >
      {(noted) => <NotedSubjectSections noted={noted} />}
    </NotedSubjectsData>,
    { wrapper: createTestWrapper() },
  );
  await waitFor(() => expect(subjects.coreRuleAsks()).toHaveLength(1));

  return { notes, subjects };
}

describe("the notes gathered under their subjects", () => {
  it("should set a note on a card under the card's name and the printing it was written on", async () => {
    await renderNoted([CARD_NOTE]);

    expect(await screen.findByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: VI.name })).toBeTruthy();
    expect(screen.getByText(VI_PRINTING)).toBeTruthy();
    expect(screen.getByText(CARD_NOTE.body)).toBeTruthy();
  });

  it("should set a note on a rule under its number and the heading it stands beneath", async () => {
    await renderNoted([RULE_NOTE]);

    expect(await screen.findByRole("header", { name: notedCoreRulesSectionLabel(1) })).toBeTruthy();
    expect(screen.getByRole("header", { name: GAME_CONCEPTS.body })).toBeTruthy();
    expect(screen.getByText(RULE_NUMBER)).toBeTruthy();
    expect(screen.getByText(RULE_NOTE.body)).toBeTruthy();
  });

  it("should collect several notes on one subject under one heading, newest first", async () => {
    await renderNoted([CARD_NOTE, SECOND_CARD_NOTE]);

    expect(await screen.findByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.getAllByRole("header", { name: VI.name })).toHaveLength(1);
    expect(screen.getByLabelText(`2 notes on ${VI.name}`)).toBeTruthy();
    expect(screen.getByText("Note 1 · 2026-09-16")).toBeTruthy();
    expect(screen.getByText("Note 2 · 2026-09-14")).toBeTruthy();
  });

  it("should leave a section with nothing under it without a heading", async () => {
    await renderNoted([CARD_NOTE]);

    expect(await screen.findByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.queryByRole("header", { name: notedCoreRulesSectionLabel(0) })).toBeNull();
    expect(screen.queryByRole("header", { name: unfindableNotesSectionLabel(0) })).toBeNull();
    expect(screen.queryByText(/Notes on rules/)).toBeNull();
    expect(screen.queryByText(/Notes with a missing subject/)).toBeNull();
  });

  it("should ask each feature for its subjects once rather than once per note", async () => {
    const { subjects } = await renderNoted([
      CARD_NOTE,
      RULE_NOTE,
      SECOND_CARD_NOTE,
      WITHDRAWN_NOTE,
    ]);

    expect(subjects.cardAsks()).toHaveLength(1);
    expect(subjects.coreRuleAsks()).toHaveLength(1);
    expect(subjects.cardAsks()[0]).toEqual(
      expect.arrayContaining([VI_PRINTING, WITHDRAWN_PRINTING]),
    );
    expect(subjects.coreRuleAsks()[0]).toEqual(expect.arrayContaining([RULE_NUMBER, "100"]));
  });
});

describe("a note whose subject cannot be found", () => {
  it("should stand in its own section, saying what it was attached to", async () => {
    await renderNoted([CARD_NOTE, WITHDRAWN_NOTE]);

    expect(
      await screen.findByRole("header", { name: unfindableNotesSectionLabel(1) }),
    ).toBeTruthy();
    expect(screen.getByRole("header", { name: "Card" })).toBeTruthy();
    expect(screen.getByText(WITHDRAWN_PRINTING)).toBeTruthy();
    expect(screen.getAllByText(WITHDRAWN_NOTE.body)).toHaveLength(1);
    expect(screen.getByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
  });

  it("should be given up from there, which is the only place it can be", async () => {
    const { notes } = await renderNoted([WITHDRAWN_NOTE]);

    await screen.findByRole("header", { name: unfindableNotesSectionLabel(1) });
    await fireEvent.press(
      screen.getByRole("button", { name: `Remove note 1 on Card ${WITHDRAWN_PRINTING}` }),
    );

    await waitFor(() => expect(notes.notes()).toEqual([]));
    expect(notes.removals()).toBe(1);
    await waitFor(() =>
      expect(screen.queryByRole("header", { name: unfindableNotesSectionLabel(1) })).toBeNull(),
    );
  });
});

describe("the notes with no subject at all", () => {
  it("should be left to the scratchpad rather than gathered under a subject", async () => {
    await renderNoted([CARD_NOTE, SCRATCHPAD_NOTE]);

    expect(await screen.findByRole("header", { name: notedCardsSectionLabel(1) })).toBeTruthy();
    expect(screen.queryByText(SCRATCHPAD_NOTE.body)).toBeNull();
    expect(screen.queryByRole("header", { name: unfindableNotesSectionLabel(1) })).toBeNull();
  });
});
