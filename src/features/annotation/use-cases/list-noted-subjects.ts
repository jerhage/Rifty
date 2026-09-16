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

import type { Note } from "../note";
import type { NoteLister } from "../note-lister";

type ListNotedSubjectsResult = {
  readonly type: "success";
  readonly cards: readonly CardSummary[];
  readonly coreRules: readonly CoreRule[];
  readonly notes: readonly Note[];
};

interface ListNotedSubjectsCapabilities {
  readonly cardSummariesFinder: CardSummariesByPrintingIdsFinder;
  readonly coreRulesFinder: CoreRulesByNumbersFinder;
  readonly noteLister: NoteLister;
}

async function listNotedSubjects(
  { cardSummariesFinder, coreRulesFinder, noteLister }: ListNotedSubjectsCapabilities,
  options?: ReadOptions,
): Promise<ListNotedSubjectsResult> {
  const notes = await noteLister.getAll({ type: "all" }, options);
  const [cards, coreRules] = await Promise.all([
    cardSummariesFinder.getSummariesByPrintingIds(printingIdsOf(notes), options),
    coreRulesFinder.getAllByNumbers(coreRuleNumbersOf(notes), options),
  ]);

  return { type: "success", cards, coreRules, notes };
}

function printingIdsOf(notes: readonly Note[]): readonly PrintingId[] {
  return notes.flatMap(({ subject }) => (subject?.kind === "card" ? [subject.id] : []));
}

function coreRuleNumbersOf(notes: readonly Note[]): readonly CoreRuleNumber[] {
  return notes.flatMap(({ subject }) =>
    subject?.kind === "coreRule" ? [subject.id, ...coreRuleAncestorNumbersOf(subject.id)] : [],
  );
}

export { listNotedSubjects };
export type { ListNotedSubjectsCapabilities, ListNotedSubjectsResult };
