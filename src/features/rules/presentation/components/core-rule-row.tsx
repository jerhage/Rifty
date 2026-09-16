import type { ColorValue } from "react-native";
import { match } from "ts-pattern";

import type { CoreRule } from "@/features/rules/core-rule";
import { coreRuleRowKindOf } from "@/features/rules/presentation/core-rules-format";

import { CoreRuleChapterRow } from "./core-rule-chapter-row";
import { CoreRuleHeadingRow } from "./core-rule-heading-row";
import { CoreRuleNumberedRow } from "./core-rule-numbered-row";

interface CoreRuleRowProps {
  readonly barColor: ColorValue;
  readonly coreRule: CoreRule;
}

function CoreRuleRow({ barColor, coreRule }: CoreRuleRowProps) {
  return match(coreRuleRowKindOf(coreRule))
    .with("chapter", () => <CoreRuleChapterRow coreRule={coreRule} />)
    .with("heading", () => <CoreRuleHeadingRow coreRule={coreRule} />)
    .with("rule", () => <CoreRuleNumberedRow barColor={barColor} coreRule={coreRule} />)
    .exhaustive();
}

export { CoreRuleRow };
export type { CoreRuleRowProps };
