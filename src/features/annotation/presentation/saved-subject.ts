import type { Note } from "@/features/annotation/note";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";

type SubjectKeeping = "bookmarked" | "both" | "noted";

type SavedSubject =
  | { readonly type: "standalone" }
  | { readonly type: "card"; readonly card: CardSummary; readonly keeping: SubjectKeeping }
  | { readonly type: "coreRule"; readonly saved: SavedCoreRule; readonly keeping: SubjectKeeping }
  | { readonly type: "unfindable"; readonly subject: AnnotationSubject };

interface SavedSubjectGroup {
  readonly key: string;
  readonly notes: readonly Note[];
  readonly subject: SavedSubject;
}

export type { SavedSubject, SavedSubjectGroup, SubjectKeeping };
