import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import {
  BookmarkedSubjectsData,
  type BookmarkedSubjectsDataProps,
} from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { Colors } from "@/constants/theme";
import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { createTestWrapper } from "../test-wrapper";
import { coreRuleAnnotations, coreRuleDocument } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };
const MARKED_AT = "2026-09-16T10:00:00.000Z";

/**
 * Two headings and three rules, so the whole document renders and a query narrows it to two of the
 * three: `recycle` misses `101.2`, which is the rule the marks-outlive-the-view case marks.
 */
const DOCUMENT = coreRuleDocument([
  { number: "101", kind: "heading", body: "Game Concepts" },
  { number: "101.1", body: "Recycle a card to draw a card." },
  { number: "101.2", body: "Runes pay for costs." },
  { number: "201", kind: "heading", body: "Playing the Game" },
  { number: "201.1", body: "Recycle, then recycle again." },
]);

function sameSubject(one: AnnotationSubject, other: AnnotationSubject): boolean {
  return one.kind === other.kind && one.id === other.id;
}

interface BookmarkStore {
  readonly capabilities: Omit<BookmarkedSubjectsDataProps, "children" | "kind">;
  listReads(): number;
  scopes(): readonly BookmarkListScope[];
  subjectReads(): number;
  writes(): number;
}

/**
 * The store as the screen meets it, counting what it was asked rather than what it answered: a
 * screen that asked once per row would read the same marks back and only the count would say so.
 */
function createBookmarkStore(markedRuleNumbers: readonly string[] = []): BookmarkStore {
  const bookmarks: Bookmark[] = markedRuleNumbers.map((number) => ({
    subject: { kind: "coreRule", id: number },
    createdAt: MARKED_AT,
  }));
  const scopes: BookmarkListScope[] = [];
  let listReads = 0;
  let subjectReads = 0;
  let writes = 0;

  return {
    capabilities: {
      bookmarkManager: {
        get: (subject) => {
          subjectReads += 1;

          return Promise.resolve(
            bookmarks.find((held) => sameSubject(held.subject, subject)) ?? null,
          );
        },
        getAll: (scope) => {
          listReads += 1;
          scopes.push(scope);

          return Promise.resolve(
            scope.type === "all"
              ? [...bookmarks]
              : bookmarks.filter((held) => held.subject.kind === scope.kind),
          );
        },
        remove: (subject) => {
          writes += 1;
          const held = bookmarks.findIndex((mark) => sameSubject(mark.subject, subject));

          if (held >= 0) bookmarks.splice(held, 1);

          return Promise.resolve();
        },
        save: (bookmark) => {
          writes += 1;

          if (!bookmarks.some((held) => sameSubject(held.subject, bookmark.subject))) {
            bookmarks.push(bookmark);
          }

          return Promise.resolve();
        },
      },
      clock: { now: () => MARKED_AT },
    },
    listReads: () => listReads,
    scopes: () => scopes,
    subjectReads: () => subjectReads,
    writes: () => writes,
  };
}

function createWrapper() {
  const QueryWrapper = createTestWrapper();

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryWrapper>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 390, height: 844 },
            insets: { bottom: 0, left: 0, right: 0, top: 0 },
          }}
        >
          {children}
        </SafeAreaProvider>
      </QueryWrapper>
    );
  };
}

async function renderBookmarkableDocument(
  store: BookmarkStore,
  coreRules: readonly CoreRule[] = DOCUMENT,
) {
  await render(
    <BookmarkedSubjectsData {...store.capabilities} kind="coreRule">
      {({ bookmarkedIds, toggleBookmark }) => (
        <CoreRulesScreen
          bookmarkedNumbers={bookmarkedIds}
          coreRules={coreRules}
          edition={EDITION}
          {...coreRuleAnnotations()}
          onToggleBookmark={toggleBookmark}
        />
      )}
    </BookmarkedSubjectsData>,
    { wrapper: createWrapper() },
  );

  return await screen.findByLabelText("Search the core rules");
}

function markOn(number: string) {
  return screen.getByLabelText(`Bookmark ${number}`);
}

function markedState(number: string) {
  return markOn(number).props.accessibilityState;
}

function rowSurface(number: string) {
  return StyleSheet.flatten(screen.getByText(number).parent?.parent?.props.style);
}

describe("a core rule's bookmark", () => {
  it("should read as marked where a mark is stored and unmarked where none is", async () => {
    await renderBookmarkableDocument(createBookmarkStore(["101.1"]));

    expect(screen.getByRole("checkbox", { name: "Bookmark 101.1" })).toBeTruthy();
    expect(markedState("101.1")).toEqual({ checked: true });
    expect(markedState("101.2")).toEqual({ checked: false });
  });

  it("should offer no mark on a heading or a chapter", async () => {
    await renderBookmarkableDocument(createBookmarkStore());

    expect(screen.queryByLabelText("Bookmark 101")).toBeNull();
    expect(screen.queryByLabelText("Bookmark 201")).toBeNull();
  });

  it("should take a mark on a press and give it up on a second", async () => {
    const store = createBookmarkStore();
    await renderBookmarkableDocument(store);

    await fireEvent.press(markOn("101.1"));

    await waitFor(() => expect(markedState("101.1")).toEqual({ checked: true }));

    await fireEvent.press(markOn("101.1"));

    await waitFor(() => expect(markedState("101.1")).toEqual({ checked: false }));
    expect(store.writes()).toBe(2);
  });

  it("should leave the row unchosen when the mark is pressed", async () => {
    const store = createBookmarkStore();
    await renderBookmarkableDocument(store);

    await fireEvent.press(markOn("101.1"));

    await waitFor(() => expect(markedState("101.1")).toEqual({ checked: true }));
    expect(rowSurface("101.1").backgroundColor).toBe("transparent");
    expect(rowSurface("101.1").borderColor).toBe("transparent");
  });

  it("should leave the rule unmarked when the row it stands on is pressed", async () => {
    const store = createBookmarkStore();
    await renderBookmarkableDocument(store);

    await fireEvent.press(screen.getByText("101.1"));

    expect(rowSurface("101.1").backgroundColor).toBe(Colors.light.backgroundSelected);
    expect(markedState("101.1")).toEqual({ checked: false });
    expect(store.writes()).toBe(0);
  });
});

describe("the core rules header's bookmark count", () => {
  it("should count what is marked and follow a mark down to none", async () => {
    await renderBookmarkableDocument(createBookmarkStore(["101.1", "201.1"]));

    expect(screen.getByRole("button", { name: "2 bookmarked rules" })).toBeTruthy();

    await fireEvent.press(markOn("101.1"));

    expect(await screen.findByRole("button", { name: "1 bookmarked rule" })).toBeTruthy();

    await fireEvent.press(markOn("201.1"));

    expect(await screen.findByRole("button", { name: "0 bookmarked rules" })).toBeTruthy();
  });

  it("should hold a mark the shown list no longer holds, and keep showing the rest", async () => {
    const field = await renderBookmarkableDocument(createBookmarkStore(["101.1", "101.2"]));

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Matches only" }));

    expect(screen.queryByLabelText("Bookmark 101.2")).toBeNull();
    expect(screen.getByRole("button", { name: "2 bookmarked rules" })).toBeTruthy();
    expect(markedState("101.1")).toEqual({ checked: true });
    expect(screen.getByText("3 hits in 2 rules")).toBeTruthy();
  });
});

describe("reading the marks a document carries", () => {
  it("should ask the store once for the whole document rather than once per rule", async () => {
    const store = createBookmarkStore(["101.1"]);
    await renderBookmarkableDocument(store);

    expect(store.listReads()).toBe(1);
    expect(store.scopes()).toEqual([{ type: "ofKind", kind: "coreRule" }]);
    expect(store.subjectReads()).toBe(0);
  });
});
