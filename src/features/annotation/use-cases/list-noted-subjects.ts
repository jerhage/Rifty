import type { CardSummariesByPrintingIdsFinder } from "@/features/card/card-summaries-by-printing-ids-finder";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesByNumbersFinder } from "@/features/rules/core-rules-by-numbers-finder";
import {
  coreRuleAncestorNumbersOf,
  type CoreRuleNumber,
} from "@/features/rules/value-objects/core-rule-number";
import type { ReadOptions } from "@/shared/read-options";

import type { Bookmark } from "../bookmark";
import type { BookmarkLister } from "../bookmark-lister";
import type { Note } from "../note";
import type { NoteLister } from "../note-lister";
import type { AnnotationSubject } from "../value-objects/annotation-subject";

type ListNotedSubjectsResult = {
  readonly type: "success";
  readonly bookmarks: readonly Bookmark[];
  readonly cards: readonly CardSummary[];
  readonly coreRules: readonly CoreRule[];
  readonly notes: readonly Note[];
};

interface ListNotedSubjectsCapabilities {
  readonly bookmarkLister: BookmarkLister;
  readonly cardSummariesFinder: CardSummariesByPrintingIdsFinder;
  readonly coreRulesFinder: CoreRulesByNumbersFinder;
  readonly noteLister: NoteLister;
}

async function listNotedSubjects(
  {
    bookmarkLister,
    cardSummariesFinder,
    coreRulesFinder,
    noteLister,
  }: ListNotedSubjectsCapabilities,
  options?: ReadOptions,
): Promise<ListNotedSubjectsResult> {
  const [bookmarks, notes] = await Promise.all([
    bookmarkLister.getAll({ type: "all" }, options),
    noteLister.getAll({ type: "all" }, options),
  ]);
  const subjects = keptSubjectsOf(bookmarks, notes);
  const [cards, coreRules] = await Promise.all([
    cardSummariesFinder.getSummariesByPrintingIds(printingIdsOf(subjects), options),
    coreRulesFinder.getAllByNumbers(coreRuleNumbersOf(subjects), options),
  ]);

  return { type: "success", bookmarks, cards, coreRules, notes };
}

function keptSubjectsOf(
  bookmarks: readonly Bookmark[],
  notes: readonly Note[],
): readonly AnnotationSubject[] {
  return [
    ...bookmarks.map(({ subject }) => subject),
    ...notes.flatMap(({ subject }) => (subject === null ? [] : [subject])),
  ];
}

function printingIdsOf(subjects: readonly AnnotationSubject[]): readonly PrintingId[] {
  return subjects.flatMap((subject) => (subject.kind === "card" ? [subject.id] : []));
}

function coreRuleNumbersOf(subjects: readonly AnnotationSubject[]): readonly CoreRuleNumber[] {
  return subjects.flatMap((subject) =>
    subject.kind === "coreRule" ? [subject.id, ...coreRuleAncestorNumbersOf(subject.id)] : [],
  );
}

export { listNotedSubjects };
export type { ListNotedSubjectsCapabilities, ListNotedSubjectsResult };
