import type { Note } from "@/features/annotation/note";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CardSummary } from "@/features/card/card-summary";
import type { SavedCoreRule } from "@/features/rules/presentation/core-rules-saved";

type NotedSubject =
  | { readonly type: "standalone" }
  | { readonly type: "card"; readonly card: CardSummary }
  | { readonly type: "coreRule"; readonly saved: SavedCoreRule }
  | { readonly type: "unfindable"; readonly subject: AnnotationSubject };

interface NotedSubjectGroup {
  readonly key: string;
  readonly notes: readonly Note[];
  readonly subject: NotedSubject;
}

export type { NotedSubject, NotedSubjectGroup };
