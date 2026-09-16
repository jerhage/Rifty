import type { NoteManager } from "@/features/annotation/note-manager";
import type { CoreRule, CoreRuleDetail } from "@/features/rules/core-rule";
import { listCoreRules } from "@/features/rules/use-cases/list-core-rules";
import { coreRuleAncestorNumbersOf } from "@/features/rules/value-objects/core-rule-number";
import { coreRulesSeed } from "@/infrastructure/database/generated/core-rules-seed";

import { createNoteStore, fixedClock, sequentialIds } from "../annotation/fixtures";
import type { SqliteScenarioStore } from "../sqlite-scenario-store";

const ANNOTATED_AT = "2026-09-16T10:00:00.000Z";

interface CoreRuleDraft {
  readonly number: string;
  readonly body: string;
  readonly kind?: CoreRule["kind"];
  readonly details?: readonly string[];
}

function coreRuleDetails(bodies: readonly string[]): CoreRuleDetail[] {
  return bodies.map((body, position) => ({ position, kind: "bullet", body }));
}

/** A hand-written document in printed order. Positions are the given order, as the adapter reads. */
function coreRuleDocument(drafts: readonly CoreRuleDraft[]): readonly CoreRule[] {
  return drafts.map((draft, position) => {
    const ancestors = coreRuleAncestorNumbersOf(draft.number);

    return {
      number: draft.number,
      parentNumber: ancestors.at(-1) ?? null,
      position,
      kind: draft.kind ?? "rule",
      body: draft.body,
      details: coreRuleDetails(draft.details ?? []),
    };
  });
}

async function seededCoreRules(store: SqliteScenarioStore): Promise<readonly CoreRule[]> {
  await store.seedCoreRules(coreRulesSeed);
  const result = await listCoreRules({ coreRuleLister: store.coreRules });

  if (result.type !== "success") throw new Error("The seeded document did not read back.");

  return result.coreRules;
}

function coreRuleNumbered(coreRules: readonly CoreRule[], number: string): CoreRule {
  const found = coreRules.find((coreRule) => coreRule.number === number);

  if (found === undefined) throw new Error(`The document holds no core rule ${number}.`);

  return found;
}

/** The three seams the screen threads down to a saved entry's notes, over an empty store. */
function coreRuleAnnotations(noteManager: NoteManager = createNoteStore().manager) {
  return { clock: fixedClock(ANNOTATED_AT), idGenerator: sequentialIds(), noteManager };
}

export { ANNOTATED_AT, coreRuleAnnotations, coreRuleDocument, coreRuleNumbered, seededCoreRules };
