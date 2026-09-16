import { match } from "ts-pattern";

import type { Note } from "@/features/annotation/note";
import { SCRATCHPAD_TITLE } from "@/features/annotation/presentation/note-format";
import type {
  NotedSubject,
  NotedSubjectGroup,
} from "@/features/annotation/presentation/noted-subject";
import {
  UNFINDABLE_NOTES_MESSAGE,
  notedCardsSectionLabel,
  notedCoreRulesSectionLabel,
  unfindableNotesSectionLabel,
  unfindableSubjectName,
} from "@/features/annotation/presentation/noted-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { savedCoreRules, type SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

interface NoteCounts {
  readonly card: number;
  readonly coreRule: number;
  readonly standalone: number;
  readonly unfindable: number;
}

interface NoteSection {
  readonly groups: readonly NotedSubjectGroup[];
  readonly label: string;
  readonly message: string | null;
}

interface GatheredNotes {
  readonly key: string;
  readonly notes: Note[];
  readonly subject: NotedSubject;
}

const STANDALONE_KEY = "standalone";

function noteSections(
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly CoreRule[],
): readonly NoteSection[] {
  const cardsByPrintingId = new Map(cards.map((card) => [card.printingId, card]));
  const savedByNumber = savedCoreRulesByNumber(notes, coreRules);
  /** A note can only be originated here, so it stands whether or not anything is in it. */
  const scratchpad: GatheredNotes = {
    key: STANDALONE_KEY,
    notes: [],
    subject: { type: "standalone" },
  };
  const cardGroups = new Map<string, GatheredNotes>();
  const coreRuleGroups = new Map<string, GatheredNotes>();
  const unfindableGroups = new Map<string, GatheredNotes>();

  for (const note of notes) {
    const noted = notedSubjectOf(note.subject, cardsByPrintingId, savedByNumber);

    match(noted)
      .with({ type: "standalone" }, () => {
        scratchpad.notes.push(note);
      })
      .with({ type: "card" }, ({ card }) => gather(cardGroups, card.printingId, note, noted))
      .with({ type: "coreRule" }, ({ saved }) =>
        gather(coreRuleGroups, saved.coreRule.number, note, noted),
      )
      .with({ type: "unfindable" }, ({ subject }) =>
        gather(unfindableGroups, unfindableSubjectName(subject), note, noted),
      )
      .exhaustive();
  }

  const sections: readonly NoteSection[] = [
    { groups: [scratchpad], label: SCRATCHPAD_TITLE, message: null },
    {
      groups: [...cardGroups.values()],
      label: notedCardsSectionLabel(cardGroups.size),
      message: null,
    },
    {
      groups: [...coreRuleGroups.values()],
      label: notedCoreRulesSectionLabel(coreRuleGroups.size),
      message: null,
    },
    {
      groups: [...unfindableGroups.values()],
      label: unfindableNotesSectionLabel(unfindableGroups.size),
      message: UNFINDABLE_NOTES_MESSAGE,
    },
  ];

  return sections.filter(({ groups }) => groups.length > 0);
}

function noteCountsOf(sections: readonly NoteSection[]): NoteCounts {
  const counted = { card: 0, coreRule: 0, standalone: 0, unfindable: 0 };

  for (const { groups } of sections)
    for (const { notes, subject } of groups) counted[subject.type] += notes.length;

  return counted;
}

function standaloneNotesOf(sections: readonly NoteSection[]): readonly Note[] {
  return sections
    .flatMap(({ groups }) => groups)
    .flatMap(({ notes, subject }) => (subject.type === "standalone" ? notes : []));
}

function gather(
  groups: Map<string, GatheredNotes>,
  key: string,
  note: Note,
  subject: NotedSubject,
): void {
  const held = groups.get(key);

  if (held === undefined) groups.set(key, { key, notes: [note], subject });
  else held.notes.push(note);
}

function notedSubjectOf(
  subject: AnnotationSubject | null,
  cardsByPrintingId: ReadonlyMap<PrintingId, CardSummary>,
  savedByNumber: ReadonlyMap<CoreRuleNumber, SavedCoreRule>,
): NotedSubject {
  return match(subject)
    .with(null, (): NotedSubject => ({ type: "standalone" }))
    .with({ kind: "card" }, (written): NotedSubject => {
      const card = cardsByPrintingId.get(written.id);

      return card === undefined ? { type: "unfindable", subject: written } : { type: "card", card };
    })
    .with({ kind: "coreRule" }, (written): NotedSubject => {
      const saved = savedByNumber.get(written.id);

      return saved === undefined
        ? { type: "unfindable", subject: written }
        : { type: "coreRule", saved };
    })
    .with({ kind: "deck" }, (written): NotedSubject => ({ type: "unfindable", subject: written }))
    .exhaustive();
}

function savedCoreRulesByNumber(
  notes: readonly Note[],
  coreRules: readonly CoreRule[],
): ReadonlyMap<CoreRuleNumber, SavedCoreRule> {
  const noted = new Set(
    notes.flatMap(({ subject }) => (subject?.kind === "coreRule" ? [subject.id] : [])),
  );

  return new Map(
    savedCoreRules(coreRules, (number) => noted.has(number)).map((saved) => [
      saved.coreRule.number,
      saved,
    ]),
  );
}

export { noteCountsOf, noteSections, standaloneNotesOf };
export type { NoteCounts, NoteSection };
