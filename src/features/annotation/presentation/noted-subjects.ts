import { match } from "ts-pattern";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { Note } from "@/features/annotation/note";
import type {
  NotedSubject,
  NotedSubjectGroup,
} from "@/features/annotation/presentation/noted-subject";
import {
  ORDERED_NOTE_SECTION_SPECS,
  unfindableSubjectName,
  type NoteSectionSpec,
} from "@/features/annotation/presentation/noted-subjects-format";
import { savedCards } from "@/features/annotation/presentation/saved-cards";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { savedCoreRules, type SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

type NoteCounts = Readonly<Record<NotedSubject["type"], number>>;

interface NoteSection {
  readonly groups: readonly NotedSubjectGroup[];
  readonly label: string;
  readonly message: string | null;
}

const STANDALONE_KEY = "standalone";

function noteSections(
  bookmarks: readonly Bookmark[],
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly CoreRule[],
): readonly NoteSection[] {
  const marked = bookmarks.map(({ subject }) => subject);
  const written = notes.flatMap(({ subject }) => (subject === null ? [] : [subject]));
  const markedNumbers = coreRuleNumbersOf(marked);
  const writtenNumbers = coreRuleNumbersOf(written);
  const keptCards = savedCards(printingIdsOf([...written, ...marked]), cards);
  const keptCoreRules = savedCoreRules(
    coreRules,
    (number) => markedNumbers.has(number),
    (number) => writtenNumbers.has(number),
  );
  const groupsByType: Readonly<Record<NotedSubject["type"], readonly NotedSubjectGroup[]>> = {
    standalone: [scratchpadGroup(notes)],
    card: keptCards.map((card) => cardGroup(card, notes)),
    coreRule: keptCoreRules.map((saved) => coreRuleGroup(saved, notes)),
    unfindable: unfindableGroups(notes, keptCards, keptCoreRules),
  };

  return ORDERED_NOTE_SECTION_SPECS.flatMap((spec) => sectionsFor(spec, groupsByType[spec.type]));
}

function sectionsFor(
  spec: NoteSectionSpec,
  groups: readonly NotedSubjectGroup[],
): readonly NoteSection[] {
  const label = spec.label(groups.length);

  return match(spec.presence)
    .with({ type: "always" }, ({ emptyMessage }): readonly NoteSection[] => [
      { groups, label, message: groups.length === 0 ? emptyMessage : null },
    ])
    .with({ type: "whenPopulated" }, ({ message }): readonly NoteSection[] =>
      groups.length === 0 ? [] : [{ groups, label, message }],
    )
    .exhaustive();
}

function printingIdsOf(subjects: readonly AnnotationSubject[]): ReadonlySet<PrintingId> {
  return new Set(subjects.flatMap((subject) => (subject.kind === "card" ? [subject.id] : [])));
}

function coreRuleNumbersOf(subjects: readonly AnnotationSubject[]): ReadonlySet<CoreRuleNumber> {
  return new Set(subjects.flatMap((subject) => (subject.kind === "coreRule" ? [subject.id] : [])));
}

function scratchpadGroup(notes: readonly Note[]): NotedSubjectGroup {
  return {
    key: STANDALONE_KEY,
    notes: notes.filter(({ subject }) => subject === null),
    subject: { type: "standalone" },
  };
}

function cardGroup(card: CardSummary, notes: readonly Note[]): NotedSubjectGroup {
  return {
    key: card.printingId,
    notes: notesOn(notes, { kind: "card", id: card.printingId }),
    subject: { type: "card", card },
  };
}

function coreRuleGroup(saved: SavedCoreRule, notes: readonly Note[]): NotedSubjectGroup {
  return {
    key: saved.coreRule.number,
    notes: notesOn(notes, { kind: "coreRule", id: saved.coreRule.number }),
    subject: { type: "coreRule", saved },
  };
}

function unfindableGroups(
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly SavedCoreRule[],
): readonly NotedSubjectGroup[] {
  const missing = notes.flatMap(({ subject }) =>
    subject !== null && !isResolved(subject, cards, coreRules) ? [subject] : [],
  );

  return [...new Map(missing.map((subject) => [unfindableSubjectName(subject), subject]))].map(
    ([key, subject]): NotedSubjectGroup => ({
      key,
      notes: notesOn(notes, subject),
      subject: { type: "unfindable", subject },
    }),
  );
}

function isResolved(
  subject: AnnotationSubject,
  cards: readonly CardSummary[],
  coreRules: readonly SavedCoreRule[],
): boolean {
  return match(subject)
    .with({ kind: "card" }, ({ id }) => cards.some(({ printingId }) => printingId === id))
    .with({ kind: "coreRule" }, ({ id }) =>
      coreRules.some(({ coreRule }) => coreRule.number === id),
    )
    .with({ kind: "deck" }, () => false)
    .exhaustive();
}

function notesOn(notes: readonly Note[], subject: AnnotationSubject): readonly Note[] {
  return notes.filter(
    ({ subject: written }) =>
      written !== null && written.kind === subject.kind && written.id === subject.id,
  );
}

function noteCountsOf(sections: readonly NoteSection[]): NoteCounts {
  const counted: Record<NotedSubject["type"], number> = {
    card: 0,
    coreRule: 0,
    standalone: 0,
    unfindable: 0,
  };

  for (const { groups } of sections)
    for (const { notes, subject } of groups) counted[subject.type] += notes.length;

  return counted;
}

function standaloneNotesOf(sections: readonly NoteSection[]): readonly Note[] {
  return sections
    .flatMap(({ groups }) => groups)
    .flatMap(({ notes, subject }) => (subject.type === "standalone" ? notes : []));
}

export { noteCountsOf, noteSections, standaloneNotesOf };
export type { NoteCounts, NoteSection };
