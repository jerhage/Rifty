import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { coreRuleHighlightWash } from "@/features/rules/presentation/core-rule-highlight";
import { CORE_RULE_SCROLL_OFFSET } from "@/features/rules/presentation/hooks/use-core-rules-document-scroll";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { coreRuleDocument, seededCoreRules } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };

/**
 * Both of the list's movements are taken on the real `FlatList`, so what the screen asks for is
 * what is asserted. They are stood in for because nothing lays out under Jest: every row would
 * otherwise be unmeasured, and every step would recover through `onScrollToIndexFailed`.
 */
let scrollToIndex: jest.SpyInstance;
let scrollToOffset: jest.SpyInstance;

beforeEach(() => {
  scrollToIndex = jest
    .spyOn(FlatList.prototype, "scrollToIndex")
    .mockImplementation(() => undefined);
  scrollToOffset = jest
    .spyOn(FlatList.prototype, "scrollToOffset")
    .mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function SafeArea({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { bottom: 0, left: 0, right: 0, top: 0 },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe("CoreRulesScreen", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should head the document with its edition, its date and what it holds", async () => {
    const coreRules = await seededCoreRules(store);

    await render(<CoreRulesScreen coreRules={coreRules} edition={EDITION} />, {
      wrapper: SafeArea,
    });

    expect(screen.getByRole("header", { name: "Riftbound Core Rules" })).toBeTruthy();
    expect(screen.getByText("Published 2025-06-02")).toBeTruthy();
    expect(screen.getByText("5 chapters · 1168 numbered rules")).toBeTruthy();
  });

  it("should open the document at its first entry", async () => {
    const coreRules = await seededCoreRules(store);

    await render(<CoreRulesScreen coreRules={coreRules} edition={EDITION} />, {
      wrapper: SafeArea,
    });

    expect(screen.getByText("Golden and Silver Rules")).toBeTruthy();
  });
});

/**
 * Five entries, so the whole document renders: two headings, a rule with no occurrence, and two
 * rules holding four occurrences between them — one of which is printed inside a detail.
 */
const SEARCH_DOCUMENT = coreRuleDocument([
  { number: "101", kind: "heading", body: "Game Concepts" },
  { number: "101.1", body: "Recycle a card to draw a card." },
  { number: "101.2", body: "Runes pay for costs." },
  { number: "201", kind: "heading", body: "Playing the Game" },
  { number: "201.1", body: "Recycle, then recycle again.", details: ["RECYCLE the top card."] },
]);

async function renderSearchableDocument() {
  await render(<CoreRulesScreen coreRules={SEARCH_DOCUMENT} edition={EDITION} />, {
    wrapper: SafeArea,
  });

  return screen.getByLabelText("Search the core rules");
}

function markStyles(text: string) {
  return screen.getAllByText(text).map((mark) => StyleSheet.flatten(mark.props.style));
}

describe("CoreRulesScreen search", () => {
  it("should mark every occurrence and set the active hit apart from the rest", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");

    expect(markStyles("Recycle").map((style) => style.backgroundColor)).toEqual([
      Colors.light.highlight,
      coreRuleHighlightWash(Colors.light, "occurrence"),
    ]);
    expect(markStyles("Recycle").map((style) => style.color)).toEqual([
      Colors.light.onHighlight,
      undefined,
    ]);
    expect(markStyles("Recycle").map((style) => style.fontWeight)).toEqual([700, undefined]);
  });

  it("should set the bar of the row holding the active hit to the highlight", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");

    const active = StyleSheet.flatten(screen.getByText("101.1").parent?.props.style);
    const holder = StyleSheet.flatten(screen.getByText("201.1").parent?.props.style);

    expect(active.borderLeftColor).toBe(Colors.light.highlight);
    expect(holder.borderLeftColor).toBe(coreRuleHighlightWash(Colors.light, "bar"));
  });

  it("should move the active hit and the count with next and previous", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");
    expect(screen.getByText("1 / 4")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Next hit"));

    expect(screen.getByText("2 / 4")).toBeTruthy();
    expect(markStyles("Recycle").map((style) => style.fontWeight)).toEqual([undefined, 700]);

    await fireEvent.press(screen.getByLabelText("Previous hit"));

    expect(screen.getByText("1 / 4")).toBeTruthy();
    expect(markStyles("Recycle").map((style) => style.fontWeight)).toEqual([700, undefined]);
  });

  it("should put the reader back on the first hit when the query changes", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByLabelText("Next hit"));
    expect(screen.getByText("2 / 4")).toBeTruthy();

    await fireEvent.changeText(field, "recycl");

    expect(screen.getByText("1 / 4")).toBeTruthy();
  });

  it("should wrap from the first hit back to the last", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByLabelText("Previous hit"));

    expect(screen.getByText("4 / 4")).toBeTruthy();
  });

  it("should mark a hit printed inside a detail, and step onto it like any other", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");

    expect(StyleSheet.flatten(screen.getByText("RECYCLE").props.style).backgroundColor).toBe(
      coreRuleHighlightWash(Colors.light, "occurrence"),
    );

    await fireEvent.press(screen.getByLabelText("Previous hit"));

    expect(StyleSheet.flatten(screen.getByText("RECYCLE").props.style).backgroundColor).toBe(
      Colors.light.highlight,
    );
  });

  it("should drop a rule with no hit while keeping a match's headings", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Matches only" }));

    expect(screen.queryByText("Runes pay for costs.")).toBeNull();
    expect(screen.getByText("Game Concepts")).toBeTruthy();
    expect(screen.getByText("Playing the Game")).toBeTruthy();
  });

  it("should restore the document and drop the filter when the query is cleared", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Matches only" }));
    await fireEvent.press(screen.getByLabelText("Clear search"));

    expect(screen.getByText("Runes pay for costs.")).toBeTruthy();
    expect(screen.queryByText("Matches only")).toBeNull();

    await fireEvent.changeText(field, "recycle");

    expect(screen.getByText("Runes pay for costs.")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Matches only" }).props.accessibilityState).toEqual(
      { checked: false },
    );
  });

  it("should say so where the document was when a query matches nothing", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "planeswalker");

    expect(
      screen.getByText("Nothing in the rules text matches that. Try a shorter term."),
    ).toBeTruthy();
    expect(screen.queryByText("Runes pay for costs.")).toBeNull();
    expect(screen.getByText("0 / 0")).toBeTruthy();
  });

  it("should count one match in the singular and several in the plural", async () => {
    const field = await renderSearchableDocument();

    await fireEvent.changeText(field, "runes");
    expect(screen.getByText("1 hit in 1 rule")).toBeTruthy();

    await fireEvent.changeText(field, "recycle");
    expect(screen.getByText("4 hits in 2 rules")).toBeTruthy();
  });
});

/**
 * Nine entries, so a hit's row in the whole document and its row once matches-only has narrowed the
 * list disagree. Three occurrences of the query: one in a rule body near the top, one further down,
 * and one printed inside a detail.
 */
const SCROLL_DOCUMENT = coreRuleDocument([
  { number: "100", kind: "heading", body: "Game Concepts" },
  { number: "101", kind: "heading", body: "Deck Construction" },
  { number: "101.1", body: "Runes pay for costs." },
  { number: "101.2", body: "Recycle a card to draw a card." },
  { number: "500", kind: "heading", body: "Playing the Game" },
  { number: "501", kind: "heading", body: "Turn Structure" },
  { number: "501.1", body: "Chip damage is dealt." },
  { number: "501.2", body: "Recycle again." },
  { number: "501.3", body: "A card may be spent.", details: ["Recycle the top card."] },
]);

async function renderScrollableDocument() {
  await render(<CoreRulesScreen coreRules={SCROLL_DOCUMENT} edition={EDITION} />, {
    wrapper: SafeArea,
  });

  return screen.getByLabelText("Search the core rules");
}

function scrolledToRow(row: number) {
  return { animated: true, index: row, viewOffset: CORE_RULE_SCROLL_OFFSET };
}

describe("CoreRulesScreen stepping", () => {
  it("should move the document to the rule holding the hit next steps onto", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.changeText(field, "recycle");
    expect(scrollToIndex).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText("Next hit"));

    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(scrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(7));
  });

  it("should move to the rule of a hit printed inside a detail", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByLabelText("Next hit"));
    await fireEvent.press(screen.getByLabelText("Next hit"));

    expect(screen.getByText("3 / 3")).toBeTruthy();
    expect(scrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(8));
  });

  it("should move to the rule holding the last hit when previous wraps from the first", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByLabelText("Previous hit"));

    expect(screen.getByText("3 / 3")).toBeTruthy();
    expect(scrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(8));
  });

  it("should count the row in the filtered list rather than in the whole document", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Matches only" }));
    await fireEvent.press(screen.getByLabelText("Next hit"));

    expect(scrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(3));
    expect(scrollToIndex).not.toHaveBeenCalledWith(scrolledToRow(7));
  });

  it("should jump to the estimated offset and ask again for a row the list cannot reach", async () => {
    const field = await renderScrollableDocument();

    // Row heights vary, so the list refuses a row it has never measured. Refuse the first ask the
    // way the real list does, through the handler it was handed.
    scrollToIndex.mockImplementationOnce(function (this: FlatList, asked: { index: number }) {
      this.props.onScrollToIndexFailed?.({
        averageItemLength: 40,
        highestMeasuredFrameIndex: 2,
        index: asked.index,
      });
    });

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByLabelText("Next hit"));

    expect(scrollToOffset).toHaveBeenCalledWith({ animated: true, offset: 40 * 7 });

    await waitFor(() => expect(scrollToIndex).toHaveBeenCalledTimes(2));
    expect(scrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(7));
  });
});

function rowSurface(number: string) {
  return StyleSheet.flatten(screen.getByText(number).parent?.parent?.props.style);
}

function ruleBarColor(number: string) {
  return StyleSheet.flatten(screen.getByText(number).parent?.props.style).borderLeftColor;
}

describe("CoreRulesScreen selection", () => {
  it("should take a numbered rule on a press and give it up on a second", async () => {
    await renderScrollableDocument();

    expect(rowSurface("101.2").backgroundColor).toBe("transparent");

    await fireEvent.press(screen.getByText("101.2"));

    expect(rowSurface("101.2").backgroundColor).toBe(Colors.light.backgroundSelected);
    expect(rowSurface("101.2").borderColor).toBe(Colors.light.borderStrong);
    expect(ruleBarColor("101.2")).toBe(Colors.light.accent);

    await fireEvent.press(screen.getByText("101.2"));

    expect(rowSurface("101.2").backgroundColor).toBe("transparent");
    expect(rowSurface("101.2").borderColor).toBe("transparent");
    expect(ruleBarColor("101.2")).toBe(Colors.light.border);
  });

  it("should hold one rule at a time", async () => {
    await renderScrollableDocument();

    await fireEvent.press(screen.getByText("101.2"));
    await fireEvent.press(screen.getByText("501.2"));

    expect(rowSurface("501.2").backgroundColor).toBe(Colors.light.backgroundSelected);
    expect(rowSurface("101.2").backgroundColor).toBe("transparent");
  });

  it("should leave a heading and a chapter unpressable", async () => {
    await renderScrollableDocument();

    expect(screen.getByRole("button", { name: /Recycle a card to draw a card\./ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Game Concepts/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Deck Construction/ })).toBeNull();
  });

  it("should draw a chosen rule as chosen even while it holds the active hit", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByText("101.2"));

    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(rowSurface("101.2").backgroundColor).toBe(Colors.light.backgroundSelected);
    expect(rowSurface("101.2").borderColor).toBe(Colors.light.borderStrong);
    expect(ruleBarColor("101.2")).toBe(Colors.light.accent);
  });

  it("should keep the chosen rule when the query changes", async () => {
    const field = await renderScrollableDocument();

    await fireEvent.press(screen.getByText("101.2"));
    await fireEvent.changeText(field, "runes");

    expect(rowSurface("101.2").backgroundColor).toBe(Colors.light.backgroundSelected);
    expect(ruleBarColor("101.2")).toBe(Colors.light.accent);
  });
});
