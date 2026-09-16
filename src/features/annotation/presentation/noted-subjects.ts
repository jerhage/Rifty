import { match } from "ts-pattern";

import type { Note } from "@/features/annotation/note";
import type {
  AnnotationSubject,
  AnnotationSubjectKind,
} from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import { savedCoreRules, type SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";

type NotedSubject =
  | { readonly type: "card"; readonly card: CardSummary }
  | { readonly type: "coreRule"; readonly saved: SavedCoreRule }
  | { readonly type: "unfindable"; readonly subject: AnnotationSubject };

interface NotedSubjectGroup<TSubject extends NotedSubject> {
  readonly notes: readonly Note[];
  readonly subject: TSubject;
}

type NotedCardGroup = NotedSubjectGroup<Extract<NotedSubject, { type: "card" }>>;
type NotedCoreRuleGroup = NotedSubjectGroup<Extract<NotedSubject, { type: "coreRule" }>>;
type UnfindableNoteGroup = NotedSubjectGroup<Extract<NotedSubject, { type: "unfindable" }>>;

interface NotedSubjectGroups {
  readonly cards: readonly NotedCardGroup[];
  readonly coreRules: readonly NotedCoreRuleGroup[];
  readonly unfindable: readonly UnfindableNoteGroup[];
}

interface SubjectNotes {
  readonly notes: Note[];
  readonly subject: AnnotationSubject;
}

function notedSubjectGroups(
  notes: readonly Note[],
  cards: readonly CardSummary[],
  coreRules: readonly CoreRule[],
): NotedSubjectGroups {
  const grouped = groupedBySubject(notes);
  const cardsByPrintingId = new Map(cards.map((card) => [card.printingId, card]));
  const notedNumbers = new Set(
    grouped.flatMap(({ subject }) => (subject.kind === "coreRule" ? [subject.id] : [])),
  );
  const savedByNumber = new Map(
    savedCoreRules(coreRules, (number) => notedNumbers.has(number)).map((saved) => [
      saved.coreRule.number,
      saved,
    ]),
  );
  const cardGroups: NotedCardGroup[] = [];
  const coreRuleGroups: NotedCoreRuleGroup[] = [];
  const unfindableGroups: UnfindableNoteGroup[] = [];

  for (const { notes: written, subject } of grouped) {
    match(notedSubjectOf(subject, cardsByPrintingId, savedByNumber))
      .with({ type: "card" }, (found) => {
        cardGroups.push({ notes: written, subject: found });
      })
      .with({ type: "coreRule" }, (found) => {
        coreRuleGroups.push({ notes: written, subject: found });
      })
      .with({ type: "unfindable" }, (missing) => {
        unfindableGroups.push({ notes: written, subject: missing });
      })
      .exhaustive();
  }

  return { cards: cardGroups, coreRules: coreRuleGroups, unfindable: unfindableGroups };
}

function groupedBySubject(notes: readonly Note[]): readonly SubjectNotes[] {
  const byKind = new Map<AnnotationSubjectKind, Map<string, SubjectNotes>>();
  const ordered: SubjectNotes[] = [];

  for (const note of notes) {
    const { subject } = note;

    if (subject === null) continue;

    const byId = byKind.get(subject.kind) ?? new Map<string, SubjectNotes>();

    byKind.set(subject.kind, byId);

    const held = byId.get(subject.id);

    if (held === undefined) {
      const group: SubjectNotes = { notes: [note], subject };

      byId.set(subject.id, group);
      ordered.push(group);
    } else held.notes.push(note);
  }

  return ordered;
}

function notedSubjectOf(
  subject: AnnotationSubject,
  cardsByPrintingId: ReadonlyMap<PrintingId, CardSummary>,
  savedByNumber: ReadonlyMap<CoreRuleNumber, SavedCoreRule>,
): NotedSubject {
  return match(subject)
    .with({ kind: "card" }, ({ id }): NotedSubject => {
      const card = cardsByPrintingId.get(id);

      return card === undefined ? { type: "unfindable", subject } : { type: "card", card };
    })
    .with({ kind: "coreRule" }, ({ id }): NotedSubject => {
      const saved = savedByNumber.get(id);

      return saved === undefined ? { type: "unfindable", subject } : { type: "coreRule", saved };
    })
    .with({ kind: "deck" }, (): NotedSubject => ({ type: "unfindable", subject }))
    .exhaustive();
}

export { notedSubjectGroups };
export type {
  NotedCardGroup,
  NotedCoreRuleGroup,
  NotedSubject,
  NotedSubjectGroup,
  NotedSubjectGroups,
  UnfindableNoteGroup,
};
