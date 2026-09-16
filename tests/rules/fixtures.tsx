import type { ReactNode } from "react";

import type { NoteManager } from "@/features/annotation/note-manager";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import { NotesControl } from "@/features/annotation/presentation/components/notes-control";
import { SubjectNotes } from "@/features/annotation/presentation/components/subject-notes";
import type { BookmarkedSubjects } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import type { SubjectNoteCounts } from "@/features/annotation/presentation/data/subject-note-counts-data";
import { notesOnLabel } from "@/features/annotation/presentation/note-format";
import type { CoreRule, CoreRuleDetail } from "@/features/rules/core-rule";
import { coreRuleBookmarkLabel } from "@/features/rules/presentation/core-rules-format";
import type { CoreRuleNumber } from "@/features/rules/value-objects/core-rule-number";
import { listCoreRules } from "@/features/rules/use-cases/list-core-rules";
import {
  coreRuleAncestorNumbersOf,
  coreRuleNumberSchema,
} from "@/features/rules/value-objects/core-rule-number";
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

function coreRuleNumber(value: string): CoreRuleNumber {
  return coreRuleNumberSchema.parse(value);
}

/** A hand-written document in printed order. Positions are the given order, as the adapter reads. */
function coreRuleDocument(drafts: readonly CoreRuleDraft[]): readonly CoreRule[] {
  return drafts.map((draft, position) => {
    const number = coreRuleNumber(draft.number);
    const ancestors = coreRuleAncestorNumbersOf(number);

    return {
      number,
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

const NOTHING_MARKED: BookmarkedSubjects<"coreRule"> = {
  bookmarkedCount: 0,
  isBookmarked: () => false,
  toggleBookmark: () => undefined,
};

const NOTHING_NOTED: SubjectNoteCounts<"coreRule"> = { noteCountOf: () => 0 };

/** What the screen's callers fill, holding the very controls and counts the route supplies. */
function coreRuleAnnotations(
  bookmarked: BookmarkedSubjects<"coreRule"> = NOTHING_MARKED,
  noteManager: NoteManager = createNoteStore().manager,
  noted: SubjectNoteCounts<"coreRule"> = NOTHING_NOTED,
) {
  const clock = fixedClock(ANNOTATED_AT);
  const idGenerator = sequentialIds();

  return {
    bookmarkedCount: bookmarked.bookmarkedCount,
    isBookmarked: bookmarked.isBookmarked,
    isNoted: (number: CoreRuleNumber): boolean => noted.noteCountOf(number) > 0,
    bookmarkFor: (number: CoreRuleNumber): ReactNode => (
      <BookmarkToggle
        alignment="start"
        bookmarked={bookmarked.isBookmarked(number)}
        label={coreRuleBookmarkLabel(number)}
        onPress={() => bookmarked.toggleBookmark(number)}
      />
    ),
    notesControlFor: (number: CoreRuleNumber, onOpen: () => void): ReactNode => (
      <NotesControl
        count={noted.noteCountOf(number)}
        label={notesOnLabel(number)}
        onPress={onOpen}
      />
    ),
    notesFor: (number: CoreRuleNumber): ReactNode => (
      <SubjectNotes
        clock={clock}
        idGenerator={idGenerator}
        noteManager={noteManager}
        notesName={number}
        subject={{ kind: "coreRule", id: number }}
      />
    ),
  };
}

export {
  ANNOTATED_AT,
  coreRuleAnnotations,
  coreRuleDocument,
  coreRuleNumber,
  coreRuleNumbered,
  seededCoreRules,
};
