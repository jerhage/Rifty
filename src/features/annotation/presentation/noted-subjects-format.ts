import { match } from "ts-pattern";

import {
  NOTES_EMPTY_MESSAGE,
  NOTE_PLACEHOLDER,
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
} from "@/features/annotation/presentation/note-format";
import type { NotedSubject } from "@/features/annotation/presentation/noted-subject";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { coreRuleSavedContextLabel } from "@/features/rules/presentation/core-rules-format";

type NoteWriting =
  | { readonly type: "offered"; readonly subject: AnnotationSubject | null }
  | { readonly type: "withheld" };

interface NotedGroupView {
  readonly detail: string | null;
  readonly emptyMessage: string;
  readonly name: string | null;
  readonly notesName: string;
  readonly placeholder: string;
  readonly writing: NoteWriting;
}

const UNFINDABLE_SUBJECT_KIND_LABELS = {
  card: "Card",
  coreRule: "Rule",
  deck: "Deck",
} as const;

const UNFINDABLE_NOTES_MESSAGE =
  "These were written against something the app can no longer find. Removing one is all that is left to do with it.";

function notedCardsSectionLabel(count: number): string {
  return `Notes on cards ${count}`;
}

function notedCoreRulesSectionLabel(count: number): string {
  return `Notes on rules ${count}`;
}

function unfindableNotesSectionLabel(count: number): string {
  return `Notes with a missing subject ${count}`;
}

function unfindableSubjectName(subject: AnnotationSubject): string {
  return `${UNFINDABLE_SUBJECT_KIND_LABELS[subject.kind]} ${subject.id}`;
}

function notedGroupView(subject: NotedSubject): NotedGroupView {
  return match(subject)
    .with({ type: "standalone" }, (): NotedGroupView => ({
      detail: null,
      emptyMessage: SCRATCHPAD_EMPTY_MESSAGE,
      name: null,
      notesName: SCRATCHPAD_NOTES_NAME,
      placeholder: SCRATCHPAD_PLACEHOLDER,
      writing: { type: "offered", subject: null },
    }))
    .with({ type: "card" }, ({ card }): NotedGroupView => ({
      detail: card.printingId,
      emptyMessage: NOTES_EMPTY_MESSAGE,
      name: card.name,
      notesName: card.name,
      placeholder: NOTE_PLACEHOLDER,
      writing: { type: "offered", subject: { kind: "card", id: card.printingId } },
    }))
    .with({ type: "coreRule" }, ({ saved }): NotedGroupView => ({
      detail: saved.coreRule.number,
      emptyMessage: NOTES_EMPTY_MESSAGE,
      name: coreRuleSavedContextLabel(saved),
      notesName: `rule ${saved.coreRule.number}`,
      placeholder: NOTE_PLACEHOLDER,
      writing: { type: "offered", subject: { kind: "coreRule", id: saved.coreRule.number } },
    }))
    .with({ type: "unfindable" }, ({ subject: missing }): NotedGroupView => ({
      detail: missing.id,
      emptyMessage: NOTES_EMPTY_MESSAGE,
      name: UNFINDABLE_SUBJECT_KIND_LABELS[missing.kind],
      notesName: unfindableSubjectName(missing),
      placeholder: NOTE_PLACEHOLDER,
      writing: { type: "withheld" },
    }))
    .exhaustive();
}

export {
  UNFINDABLE_NOTES_MESSAGE,
  notedCardsSectionLabel,
  notedCoreRulesSectionLabel,
  notedGroupView,
  unfindableNotesSectionLabel,
  unfindableSubjectName,
};
export type { NoteWriting, NotedGroupView };
