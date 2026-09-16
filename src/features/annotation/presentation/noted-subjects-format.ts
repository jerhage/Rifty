import type {
  AnnotationSubject,
  AnnotationSubjectKind,
} from "@/features/annotation/value-objects/annotation-subject";
import type { SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";

function notedCardsSectionLabel(count: number): string {
  return `Notes on cards ${count}`;
}

function notedCoreRulesSectionLabel(count: number): string {
  return `Notes on rules ${count}`;
}

function unfindableNotesSectionLabel(count: number): string {
  return `Notes with a missing subject ${count}`;
}

function notedCoreRuleName(saved: SavedCoreRule): string {
  return `rule ${saved.coreRule.number}`;
}

const UNFINDABLE_SUBJECT_KIND_LABELS: Readonly<Record<AnnotationSubjectKind, string>> = {
  card: "Card",
  coreRule: "Rule",
  deck: "Deck",
};

function unfindableSubjectKindLabel(subject: AnnotationSubject): string {
  return UNFINDABLE_SUBJECT_KIND_LABELS[subject.kind];
}

function unfindableSubjectName(subject: AnnotationSubject): string {
  return `${unfindableSubjectKindLabel(subject)} ${subject.id}`;
}

const UNFINDABLE_NOTES_MESSAGE =
  "These were written against something the app can no longer find. Removing one is all that is left to do with it.";

export {
  UNFINDABLE_NOTES_MESSAGE,
  notedCardsSectionLabel,
  notedCoreRuleName,
  notedCoreRulesSectionLabel,
  unfindableNotesSectionLabel,
  unfindableSubjectKindLabel,
  unfindableSubjectName,
};
