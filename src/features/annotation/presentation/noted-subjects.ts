import { match } from "ts-pattern";

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
  const gatheredByType = gatheringWithStandingScratchpad();

  for (const note of notes) {
    const noted = notedSubjectOf(note.subject, cardsByPrintingId, savedByNumber);

    gather(gatheredByType[noted.type], notedGroupKey(noted), note, noted);
  }

  return ORDERED_NOTE_SECTION_SPECS.flatMap((spec) =>
    sectionsFor(spec, [...gatheredByType[spec.type].values()]),
  );
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

function gatheringWithStandingScratchpad(): Readonly<
  Record<NotedSubject["type"], Map<string, GatheredNotes>>
> {
  /** A note can only be originated here, so it stands whether or not anything is in it. */
  const scratchpad: GatheredNotes = {
    key: STANDALONE_KEY,
    notes: [],
    subject: { type: "standalone" },
  };

  return {
    standalone: new Map([[scratchpad.key, scratchpad]]),
    card: new Map(),
    coreRule: new Map(),
    unfindable: new Map(),
  };
}

function notedGroupKey(noted: NotedSubject): string {
  return match(noted)
    .with({ type: "standalone" }, () => STANDALONE_KEY)
    .with({ type: "card" }, ({ card }) => card.printingId)
    .with({ type: "coreRule" }, ({ saved }) => saved.coreRule.number)
    .with({ type: "unfindable" }, ({ subject }) => unfindableSubjectName(subject))
    .exhaustive();
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
    savedCoreRules(
      coreRules,
      () => false,
      (number) => noted.has(number),
    ).map((saved) => [saved.coreRule.number, saved]),
  );
}

export { noteCountsOf, noteSections, standaloneNotesOf };
export type { NoteCounts, NoteSection };
