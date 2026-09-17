import { match } from "ts-pattern";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { Note } from "@/features/annotation/note";
import { savedCards } from "@/features/annotation/presentation/saved-cards";
import type {
  SavedSubject,
  SavedSubjectGroup,
  SubjectKeeping,
} from "@/features/annotation/presentation/saved-subject";
import {
  ORDERED_SAVED_SECTION_SPECS,
  unfindableSubjectName,
  type SavedSectionSpec,
} from "@/features/annotation/presentation/saved-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { savedCoreRules, type SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

type KeptCounts = Readonly<Record<SavedSubject["type"], number>>;

interface SavedSection {
  readonly groups: readonly SavedSubjectGroup[];
  readonly label: string;
  readonly message: string | null;
}

const STANDALONE_KEY = "standalone";

function savedSections(
  bookmarks: readonly Bookmark[],
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly CoreRule[],
): readonly SavedSection[] {
  const marked = bookmarks.map(({ subject }) => subject);
  const written = notes.flatMap(({ subject }) => (subject === null ? [] : [subject]));
  const markedNumbers = coreRuleNumbersOf(marked);
  const writtenNumbers = coreRuleNumbersOf(written);
  const markedPrintingIds = printingIdsOf(marked);
  const writtenPrintingIds = printingIdsOf(written);
  const keptCards = savedCards(new Set([...markedPrintingIds, ...writtenPrintingIds]), cards);
  const keptCoreRules = savedCoreRules(
    coreRules,
    (number) => markedNumbers.has(number),
    (number) => writtenNumbers.has(number),
  );
  const groupsByType: Readonly<Record<SavedSubject["type"], readonly SavedSubjectGroup[]>> = {
    standalone: [scratchpadGroup(notes)],
    card: keptCards.map((card) =>
      cardGroup(
        card,
        notes,
        subjectKeepingOf(card.printingId, markedPrintingIds, writtenPrintingIds),
      ),
    ),
    coreRule: keptCoreRules.map((saved) =>
      coreRuleGroup(
        saved,
        notes,
        subjectKeepingOf(saved.coreRule.number, markedNumbers, writtenNumbers),
      ),
    ),
    unfindable: unfindableGroups(notes, keptCards, keptCoreRules),
  };

  return ORDERED_SAVED_SECTION_SPECS.flatMap((spec) => sectionsFor(spec, groupsByType[spec.type]));
}

function sectionsFor(
  spec: SavedSectionSpec,
  groups: readonly SavedSubjectGroup[],
): readonly SavedSection[] {
  const label = spec.label(groups.length);

  return match(spec.presence)
    .with({ type: "always" }, ({ emptyMessage }): readonly SavedSection[] => [
      { groups, label, message: groups.length === 0 ? emptyMessage : null },
    ])
    .with({ type: "whenPopulated" }, ({ message }): readonly SavedSection[] =>
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

function scratchpadGroup(notes: readonly Note[]): SavedSubjectGroup {
  return {
    key: STANDALONE_KEY,
    notes: notes.filter(({ subject }) => subject === null),
    subject: { type: "standalone" },
  };
}

function subjectKeepingOf<TId>(
  id: TId,
  marked: ReadonlySet<TId>,
  written: ReadonlySet<TId>,
): SubjectKeeping {
  if (marked.has(id) && written.has(id)) return "both";

  return marked.has(id) ? "bookmarked" : "noted";
}

function cardGroup(
  card: CardSummary,
  notes: readonly Note[],
  keeping: SubjectKeeping,
): SavedSubjectGroup {
  return {
    key: card.printingId,
    notes: notesOn(notes, { kind: "card", id: card.printingId }),
    subject: { type: "card", card, keeping },
  };
}

function coreRuleGroup(
  saved: SavedCoreRule,
  notes: readonly Note[],
  keeping: SubjectKeeping,
): SavedSubjectGroup {
  return {
    key: saved.coreRule.number,
    notes: notesOn(notes, { kind: "coreRule", id: saved.coreRule.number }),
    subject: { type: "coreRule", saved, keeping },
  };
}

function unfindableGroups(
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly SavedCoreRule[],
): readonly SavedSubjectGroup[] {
  const missing = notes.flatMap(({ subject }) =>
    subject !== null && !isResolved(subject, cards, coreRules) ? [subject] : [],
  );

  return [...new Map(missing.map((subject) => [unfindableSubjectName(subject), subject]))].map(
    ([key, subject]): SavedSubjectGroup => ({
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

function keptCountsOf(sections: readonly SavedSection[]): KeptCounts {
  const counted: Record<SavedSubject["type"], number> = {
    card: 0,
    coreRule: 0,
    standalone: 0,
    unfindable: 0,
  };

  for (const { groups } of sections)
    for (const group of groups) counted[group.subject.type] += keptCountOf(group);

  return counted;
}

function keptCountOf({ notes, subject }: SavedSubjectGroup): number {
  return match(subject)
    .with({ type: "standalone" }, () => notes.length)
    .with({ type: "card" }, { type: "coreRule" }, { type: "unfindable" }, () => 1)
    .exhaustive();
}

function standaloneNotesOf(sections: readonly SavedSection[]): readonly Note[] {
  return sections
    .flatMap(({ groups }) => groups)
    .flatMap(({ notes, subject }) => (subject.type === "standalone" ? notes : []));
}

export { keptCountsOf, savedSections, standaloneNotesOf };
export type { KeptCounts, SavedSection };
