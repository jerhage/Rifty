import { match } from "ts-pattern";

import {
  NOTES_EMPTY_MESSAGE,
  NOTE_PLACEHOLDER,
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";
import type {
  SavedSubject,
  SubjectKeeping,
} from "@/features/annotation/presentation/saved-subject";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import {
  CORE_RULES_NOTHING_SAVED_MESSAGE,
  coreRuleSavedContextLabel,
} from "@/features/rules/presentation/core-rules-format";

type NoteWriting =
  | { readonly type: "offered"; readonly subject: AnnotationSubject | null }
  | { readonly type: "withheld" };

type BookmarkDropping =
  | { readonly type: "offered"; readonly subject: AnnotationSubject }
  | { readonly type: "withheld" };

type SavedSectionPresence =
  | { readonly type: "always"; readonly emptyMessage: string | null }
  | { readonly type: "whenPopulated"; readonly message: string };

interface SavedSectionSpec {
  readonly type: SavedSubject["type"];
  readonly label: (count: number) => string;
  readonly presence: SavedSectionPresence;
}

interface SavedGroupView {
  readonly body?: string;
  readonly detail: string | null;
  readonly dropping: BookmarkDropping;
  readonly emptyMessage: string;
  readonly keepingLabel: string | null;
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

const NOTHING_SAVED_ON_CARDS_MESSAGE =
  "Bookmark a card with the flag or write a note on it. Either one files it here.";

const SUBJECT_KEEPING_LABELS: Readonly<Record<SubjectKeeping, string>> = {
  bookmarked: "Bookmarked",
  both: "Bookmarked and noted",
  noted: "Noted",
};

function bookmarkOnLabel(notesName: string): string {
  return `Bookmark on ${notesName}`;
}

function savedCardsSectionLabel(count: number): string {
  return `Bookmarked and noted cards ${count}`;
}

function savedCoreRulesSectionLabel(count: number): string {
  return `Bookmarked and noted rules ${count}`;
}

function unfindableNotesSectionLabel(count: number): string {
  return `Notes with a missing subject ${count}`;
}

function unfindableSubjectName(subject: AnnotationSubject): string {
  return `${UNFINDABLE_SUBJECT_KIND_LABELS[subject.kind]} ${subject.id}`;
}

const SAVED_SECTION_SPECS_BY_SUBJECT_TYPE: Readonly<
  Record<SavedSubject["type"], SavedSectionSpec>
> = {
  standalone: {
    type: "standalone",
    label: () => SCRATCHPAD_TITLE,
    presence: { type: "always", emptyMessage: null },
  },
  card: {
    type: "card",
    label: savedCardsSectionLabel,
    presence: { type: "always", emptyMessage: NOTHING_SAVED_ON_CARDS_MESSAGE },
  },
  coreRule: {
    type: "coreRule",
    label: savedCoreRulesSectionLabel,
    presence: { type: "always", emptyMessage: CORE_RULES_NOTHING_SAVED_MESSAGE },
  },
  unfindable: {
    type: "unfindable",
    label: unfindableNotesSectionLabel,
    presence: { type: "whenPopulated", message: UNFINDABLE_NOTES_MESSAGE },
  },
};

const ORDERED_SAVED_SECTION_SPECS: readonly SavedSectionSpec[] = [
  SAVED_SECTION_SPECS_BY_SUBJECT_TYPE.standalone,
  SAVED_SECTION_SPECS_BY_SUBJECT_TYPE.card,
  SAVED_SECTION_SPECS_BY_SUBJECT_TYPE.coreRule,
  SAVED_SECTION_SPECS_BY_SUBJECT_TYPE.unfindable,
];

function bookmarkDroppingOf(keeping: SubjectKeeping, subject: AnnotationSubject): BookmarkDropping {
  return match(keeping)
    .with("noted", (): BookmarkDropping => ({ type: "withheld" }))
    .with("bookmarked", "both", (): BookmarkDropping => ({ type: "offered", subject }))
    .exhaustive();
}

function savedGroupView(subject: SavedSubject): SavedGroupView {
  return match(subject)
    .with({ type: "standalone" }, (): SavedGroupView => ({
      detail: null,
      dropping: { type: "withheld" },
      emptyMessage: SCRATCHPAD_EMPTY_MESSAGE,
      keepingLabel: null,
      name: null,
      notesName: SCRATCHPAD_NOTES_NAME,
      placeholder: SCRATCHPAD_PLACEHOLDER,
      writing: { type: "offered", subject: null },
    }))
    .with({ type: "card" }, ({ card, keeping }): SavedGroupView => {
      const keptCard: AnnotationSubject = { kind: "card", id: card.printingId };

      return {
        detail: card.printingId,
        dropping: bookmarkDroppingOf(keeping, keptCard),
        emptyMessage: NOTES_EMPTY_MESSAGE,
        keepingLabel: SUBJECT_KEEPING_LABELS[keeping],
        name: card.name,
        notesName: card.name,
        placeholder: NOTE_PLACEHOLDER,
        writing: { type: "offered", subject: keptCard },
      };
    })
    .with({ type: "coreRule" }, ({ keeping, saved }): SavedGroupView => {
      const keptCoreRule: AnnotationSubject = { kind: "coreRule", id: saved.coreRule.number };

      return {
        body: saved.coreRule.body,
        detail: saved.coreRule.number,
        dropping: bookmarkDroppingOf(keeping, keptCoreRule),
        emptyMessage: NOTES_EMPTY_MESSAGE,
        keepingLabel: SUBJECT_KEEPING_LABELS[keeping],
        name: coreRuleSavedContextLabel(saved.coreRule, saved.heading),
        notesName: `rule ${saved.coreRule.number}`,
        placeholder: NOTE_PLACEHOLDER,
        writing: { type: "offered", subject: keptCoreRule },
      };
    })
    .with({ type: "unfindable" }, ({ subject: missing }): SavedGroupView => ({
      detail: missing.id,
      dropping: { type: "withheld" },
      emptyMessage: NOTES_EMPTY_MESSAGE,
      keepingLabel: null,
      name: UNFINDABLE_SUBJECT_KIND_LABELS[missing.kind],
      notesName: unfindableSubjectName(missing),
      placeholder: NOTE_PLACEHOLDER,
      writing: { type: "withheld" },
    }))
    .exhaustive();
}

export {
  NOTHING_SAVED_ON_CARDS_MESSAGE,
  ORDERED_SAVED_SECTION_SPECS,
  bookmarkOnLabel,
  savedCardsSectionLabel,
  savedCoreRulesSectionLabel,
  savedGroupView,
  unfindableNotesSectionLabel,
  unfindableSubjectName,
};
export type { BookmarkDropping, NoteWriting, SavedGroupView, SavedSectionSpec };
