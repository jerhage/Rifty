import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { Fonts } from "@/constants/theme";
import type { CoreRule, CoreRuleDetail } from "@/features/rules/core-rule";
import { CoreRuleRow } from "@/features/rules/presentation/components/core-rule-row";
import { coreRuleRowKindOf } from "@/features/rules/presentation/core-rules-format";
import { CORE_RULE_NUMBER_GUTTER } from "@/features/rules/presentation/components/core-rule-numbered-row";
import { coreRuleAncestorNumbersOf } from "@/features/rules/value-objects/core-rule-number";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { seededCoreRules } from "./fixtures";

const BAR_COLOR = "#0B0D12";
const CHAPTER_NUMBERS = ["000", "100", "500", "600", "700"];

function entry(
  number: string,
  kind: CoreRule["kind"],
  body: string,
  details: CoreRuleDetail[] = [],
): CoreRule {
  return {
    number,
    parentNumber: coreRuleAncestorNumbersOf(number).at(-1) ?? null,
    position: 0,
    kind,
    body,
    details,
  };
}

async function renderRows(coreRules: readonly CoreRule[]) {
  return await render(
    <>
      {coreRules.map((coreRule) => (
        <CoreRuleRow
          barColor={BAR_COLOR}
          coreRule={coreRule}
          highlight={null}
          key={coreRule.number}
        />
      ))}
    </>,
  );
}

describe("CoreRuleRow", () => {
  it("should set a chapter title above the heading titles beneath it", async () => {
    await renderRows([
      entry("100", "heading", "Game Concepts"),
      entry("101", "heading", "Deck Construction"),
    ]);

    const chapter = StyleSheet.flatten(screen.getByText("Game Concepts").props.style);
    const heading = StyleSheet.flatten(screen.getByText("Deck Construction").props.style);

    expect(chapter.fontSize).toBeGreaterThan(heading.fontSize ?? 0);
    expect(chapter.fontWeight).toBe(700);
    expect(heading.fontWeight).toBe(600);
  });

  it("should set a rule's number in a fixed-width mono gutter beside its body", async () => {
    await renderRows([entry("103.2.a", "rule", "A deck holds forty cards.")]);

    expect(screen.getByText("A deck holds forty cards.")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText("103.2.a").props.style)).toMatchObject({
      fontFamily: Fonts.mono,
      width: CORE_RULE_NUMBER_GUTTER,
    });
  });

  it("should render a rule's bullet under its body", async () => {
    await renderRows([
      entry("103.2", "rule", "A deck holds these pieces.", [
        { position: 0, kind: "bullet", body: "1 Chosen Champion Unit" },
      ]),
    ]);

    expect(screen.getByText("1 Chosen Champion Unit")).toBeTruthy();
    expect(screen.queryByText("Example")).toBeNull();
  });

  it("should render a rule's example behind its own label", async () => {
    await renderRows([
      entry("103.2.a.2", "rule", "A rune deck holds twelve runes.", [
        { position: 0, kind: "example", body: "Twelve Fury runes is a legal rune deck." },
      ]),
    ]);

    expect(screen.getByText("Twelve Fury runes is a legal rune deck.")).toBeTruthy();
    expect(screen.getByText("Example")).toBeTruthy();
  });

  it("should render no detail region for a rule with no details", async () => {
    await renderRows([entry("000", "rule", "The golden rule wins.")]);

    expect(screen.getByText("The golden rule wins.")).toBeTruthy();
    expect(screen.queryByText("·")).toBeNull();
    expect(screen.queryByText("Example")).toBeNull();
  });
});

describe("CoreRuleRow against the real document", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should render exactly five chapters, on the century boundaries", async () => {
    const coreRules = await seededCoreRules(store);
    const chapters = coreRules.filter((coreRule) => coreRuleRowKindOf(coreRule) === "chapter");

    await renderRows(coreRules);

    expect(chapters.map((chapter) => chapter.number)).toEqual(CHAPTER_NUMBERS);
    expect(chapters.map((chapter) => screen.getByText(chapter.body))).toHaveLength(5);
  });
});
