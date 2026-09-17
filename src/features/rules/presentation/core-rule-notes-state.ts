import type { CoreRule } from "@/features/rules/core-rule";

type CoreRuleNotesState =
  | { readonly type: "closed" }
  | { readonly type: "open"; readonly coreRule: CoreRule };

export type { CoreRuleNotesState };
