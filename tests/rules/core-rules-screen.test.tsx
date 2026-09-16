import { fireEvent, render, screen } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { coreRuleHighlightWash } from "@/features/rules/presentation/core-rule-highlight";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { coreRuleDocument, seededCoreRules } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };

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
