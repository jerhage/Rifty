import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MaxReadingWidth } from "@/constants/theme";
import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import {
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_TITLE,
} from "@/features/annotation/presentation/note-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { CORE_RULES_NOTHING_SAVED_MESSAGE } from "@/features/rules/presentation/core-rules-format";
import { CORE_RULE_SCROLL_OFFSET } from "@/features/rules/presentation/hooks/use-core-rules-document-scroll";
import { SAVED_PANE_COLLAPSED_WIDTH } from "@/features/rules/presentation/components/saved/core-rules-saved-pane";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { recordAnnouncements } from "../announcements";
import { createNoteStore, fixedClock, sequentialIds, type NoteStore } from "../annotation/fixtures";
import { createTestWrapper } from "../test-wrapper";
import { coreRuleDocument } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };
const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const PHONE = { width: 402, height: 874 } as const;
const TABLET = { width: 1376, height: 1032 } as const;

/** A rule no test marks, so its text stands in the document and nowhere else. */
const UNMARKED_RULE = "A rune is spent when it pays.";

/**
 * The one movement the screen makes, watched where it asks for it. Nothing lays out under Jest, so
 * the handle the list hands its caller is what stands in and only the movement is recorded.
 */
const mockScrollToIndex = jest.fn();

jest.mock("@shopify/flash-list", () => {
  const { createElement, forwardRef, useImperativeHandle } = require("react");
  const flashList = jest.requireActual("@shopify/flash-list");

  return {
    ...flashList,
    FlashList: forwardRef(function WatchedFlashList(props: object, ref: unknown) {
      useImperativeHandle(ref, () => ({ scrollToIndex: mockScrollToIndex }), []);

      return createElement(flashList.FlashList, props);
    }),
  };
});

beforeEach(() => {
  mockScrollToIndex.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Nine entries over three branches, so the heading above a marked rule sits at a different depth in
 * each: `101.1.a` hangs under a rule, `501.1` under a depth-2 heading.
 */
const DOCUMENT = coreRuleDocument([
  { number: "100", kind: "heading", body: "Game Concepts" },
  { number: "101", kind: "heading", body: "Deck Construction" },
  { number: "101.1", body: "Runes pay for costs." },
  { number: "101.1.a", body: "A rune is spent when it pays." },
  { number: "500", kind: "heading", body: "Playing the Game" },
  { number: "501", kind: "heading", body: "Turn Structure" },
  { number: "501.1", body: "Chip damage is dealt." },
  { number: "700", kind: "heading", body: "Additional Rules" },
  { number: "700.1", body: "Recycle a card to draw a card." },
]);

function sameSubject(one: AnnotationSubject, other: AnnotationSubject): boolean {
  return one.kind === other.kind && one.id === other.id;
}

function createBookmarkManager(markedNumbers: readonly string[] = []): BookmarkManager {
  const bookmarks: Bookmark[] = markedNumbers.map((number) => ({
    subject: { kind: "coreRule", id: number },
    createdAt: WRITTEN_AT,
  }));

  return {
    get: (subject) =>
      Promise.resolve(bookmarks.find((held) => sameSubject(held.subject, subject)) ?? null),
    getAll: (scope) =>
      Promise.resolve(
        scope.type === "all"
          ? [...bookmarks]
          : bookmarks.filter((held) => held.subject.kind === scope.kind),
      ),
    remove: (subject) => {
      const at = bookmarks.findIndex((held) => sameSubject(held.subject, subject));

      if (at >= 0) bookmarks.splice(at, 1);

      return Promise.resolve();
    },
    save: (bookmark) => {
      bookmarks.push(bookmark);

      return Promise.resolve();
    },
  };
}

function wrapperFor({ width, height }: { readonly width: number; readonly height: number }) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);

  const QueryWrapper = createTestWrapper();

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryWrapper>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width, height },
            insets: { bottom: 0, left: 0, right: 0, top: 0 },
          }}
        >
          {children}
        </SafeAreaProvider>
      </QueryWrapper>
    );
  };
}

interface RenderedSurface {
  readonly noteStore: NoteStore;
}

async function renderRules(
  frame: { readonly width: number; readonly height: number },
  markedNumbers: readonly string[] = [],
  noteStore: NoteStore = createNoteStore(),
): Promise<RenderedSurface> {
  await render(
    <BookmarkedSubjectsData
      bookmarkManager={createBookmarkManager(markedNumbers)}
      clock={fixedClock(WRITTEN_AT)}
      kind="coreRule"
    >
      {({ bookmarkedIds, toggleBookmark }) => (
        <CoreRulesScreen
          bookmarkedNumbers={bookmarkedIds}
          clock={fixedClock(WRITTEN_AT)}
          coreRules={DOCUMENT}
          edition={EDITION}
          idGenerator={sequentialIds()}
          noteManager={noteStore.manager}
          onToggleBookmark={toggleBookmark}
        />
      )}
    </BookmarkedSubjectsData>,
    { wrapper: wrapperFor(frame) },
  );

  await screen.findByLabelText("Search the core rules");

  return { noteStore };
}

/**
 * A presented sheet leaves a placeholder for content the platform hosts itself, and the placeholder
 * takes no pointer events, so the harness refuses a press inside it. Activating a control the way
 * an assistive technology does reaches the same handler a finger would.
 */
async function activate(name: string) {
  await fireEvent(screen.getByRole("button", { name }), "onClick");
}

async function activateTab(name: string) {
  await fireEvent(screen.getByRole("tab", { name }), "onClick");
}

async function openSavedPane(markedNumbers: readonly string[] = [], noteStore?: NoteStore) {
  const rendered = await renderRules(TABLET, markedNumbers, noteStore);

  await fireEvent.press(screen.getByRole("button", { name: "Saved rules" }));

  return rendered;
}

/** Every style above a rendered node, so the arrangement its parents impose can be asserted. */
function stylesAbove(node: ReturnType<typeof screen.getByText>) {
  const styles = [];

  for (let above = node.parent; above !== null; above = above.parent) {
    styles.push(StyleSheet.flatten(above.props.style));
    styles.push(StyleSheet.flatten(above.props.contentContainerStyle));
  }

  return styles;
}

/** Anything inside the strip that takes the room the gap should be dividing evenly. */
function stretchedChildrenOfStrip() {
  const strip = screen.getByRole("button", { name: "Saved rules" });

  return strip.children
    .map((child) => (typeof child === "string" ? undefined : StyleSheet.flatten(child.props.style)))
    .filter((style) => style?.flex !== undefined || style?.flexGrow > 0);
}

function scrolledToRow(row: number) {
  return { animated: true, index: row, viewOffset: -CORE_RULE_SCROLL_OFFSET };
}

function savedEntry(number: string) {
  return screen.getByRole("button", { name: new RegExp(`^${number.replaceAll(".", "\\.")},`) });
}

/** The entries of the surface, in the order they stand: a number, a comma, then the rest. */
function savedEntryLabels() {
  return screen
    .getAllByRole("button", { name: /^[\w.]+, / })
    .map((entry) => entry.props.accessibilityLabel);
}

describe("the saved surface", () => {
  it("should list the marked rules in document order under the nearest heading above each", async () => {
    await openSavedPane(["700.1", "501.1", "101.1.a"]);

    expect(screen.getByRole("button", { name: /^101\.1\.a, Deck Construction\./ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^501\.1, Turn Structure\./ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^700\.1, Additional Rules\./ })).toBeTruthy();
    expect(savedEntryLabels()).toEqual([
      "101.1.a, Deck Construction. A rune is spent when it pays.",
      "501.1, Turn Structure. Chip damage is dealt.",
      "700.1, Additional Rules. Recycle a card to draw a card.",
    ]);
  });

  it("should list nothing that is not marked", async () => {
    await openSavedPane(["501.1"]);

    expect(screen.queryByRole("button", { name: /^101\.1,/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^700\.1,/ })).toBeNull();
  });

  it("should carry the whole entry in the control that jumps to it", async () => {
    await openSavedPane(["501.1"]);

    expect(
      screen.getByRole("button", { name: "501.1, Turn Structure. Chip damage is dealt." }),
    ).toBeTruthy();
  });

  it("should move the document through the same call the contents list makes", async () => {
    await openSavedPane(["501.1"]);

    await fireEvent.press(screen.getByRole("button", { name: "501 Turn Structure" }));

    expect(mockScrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(5));

    await fireEvent.press(savedEntry("501.1"));

    expect(mockScrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(6));
    expect(mockScrollToIndex.mock.calls.map(([move]) => move.animated)).toEqual([true, true]);
    expect(mockScrollToIndex.mock.calls.map(([move]) => move.viewOffset)).toEqual([
      -CORE_RULE_SCROLL_OFFSET,
      -CORE_RULE_SCROLL_OFFSET,
    ]);
  });

  it("should give up a mark from the surface, and the header count should follow", async () => {
    await openSavedPane(["501.1", "700.1"]);

    expect(screen.getByText("2 bookmarked rules")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Remove bookmark 501.1" }));

    await waitFor(() => expect(screen.getByText("1 bookmarked rule")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^501\.1,/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^700\.1,/ })).toBeTruthy();
  });
});

async function addNote(subjectName: string, body: string) {
  await fireEvent.press(screen.getByRole("button", { name: `Add a note to ${subjectName}` }));
  await fireEvent.changeText(screen.getByLabelText(`New note on ${subjectName}`), body);
  await fireEvent.press(
    screen.getByRole("button", { name: `Save the new note on ${subjectName}` }),
  );
}

describe("the notes on a saved rule", () => {
  it("should show what the subject already carries, numbered and dated", async () => {
    const store = createNoteStore([
      {
        id: "note-0",
        subject: { kind: "coreRule", id: "501.1" },
        title: "",
        body: "Came up in round three.",
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      },
    ]);
    await openSavedPane(["501.1"], store);

    expect(await screen.findByText("1 note")).toBeTruthy();
    expect(screen.getByText("Note 1 · 2026-09-16")).toBeTruthy();
    expect(screen.getByLabelText("Note 1 on 501.1").props.defaultValue).toBe(
      "Came up in round three.",
    );
  });

  it("should say so where a subject carries none", async () => {
    await openSavedPane(["501.1"]);

    expect(await screen.findByText("No notes on this one yet.")).toBeTruthy();
    expect(screen.getByLabelText("0 notes on 501.1")).toBeTruthy();
  });

  it("should add one when the field has something in it", async () => {
    const { noteStore } = await openSavedPane(["501.1"]);

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "Ask a judge about this.");

    expect(await screen.findByText("1 note")).toBeTruthy();
    expect(noteStore.notes().map((note) => note.body)).toEqual(["Ask a judge about this."]);
  });

  it("should write nothing when the body is blank, and say why", async () => {
    const announcements = recordAnnouncements();
    const { noteStore } = await openSavedPane(["501.1"]);

    await fireEvent.press(await screen.findByRole("button", { name: "Add a note to 501.1" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the new note on 501.1" }));

    await waitFor(() =>
      expect(announcements.at(-1)?.message).toBe("A note needs something written in it."),
    );
    expect(noteStore.notes()).toEqual([]);
  });

  it("should change a written one in place rather than add a second", async () => {
    const { noteStore } = await openSavedPane(["501.1"]);

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "A first draft.");
    await screen.findByLabelText("Note 1 on 501.1");

    await fireEvent(screen.getByLabelText("Note 1 on 501.1"), "endEditing", {
      nativeEvent: { text: "The settled wording." },
    });

    await waitFor(() =>
      expect(noteStore.notes().map((note) => note.body)).toEqual(["The settled wording."]),
    );
  });

  it("should remove one only through its own control, never by emptying its field", async () => {
    const { noteStore } = await openSavedPane(["501.1"]);

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "A note to drop.");
    await screen.findByLabelText("Note 1 on 501.1");

    await fireEvent(screen.getByLabelText("Note 1 on 501.1"), "endEditing", {
      nativeEvent: { text: "" },
    });

    await waitFor(() => expect(noteStore.notes()).toHaveLength(1));
    expect(noteStore.removals()).toBe(0);

    await fireEvent.press(screen.getByRole("button", { name: "Remove note 1 on 501.1" }));

    await waitFor(() => expect(noteStore.notes()).toEqual([]));
    expect(noteStore.removals()).toBe(1);
  });

  it("should name each subject's controls, so a surface of several does not read alike", async () => {
    await openSavedPane(["501.1", "700.1"]);

    expect(await screen.findByRole("button", { name: "Add a note to 501.1" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Add a note to 700.1" })).toBeTruthy();
  });
});

describe("the saved pane on a tablet", () => {
  it("should stand as a strip until it is opened, and put itself away again", async () => {
    await renderRules(TABLET, ["501.1"]);

    const collapsed = screen.getByRole("button", { name: "Saved rules" });

    expect(collapsed.props.accessibilityState).toEqual({ expanded: false });
    expect(screen.queryByRole("button", { name: /^501\.1,/ })).toBeNull();

    await fireEvent.press(collapsed);

    expect(screen.getByRole("header", { name: "Saved rules" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^501\.1,/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Saved rules" }).props.accessibilityState).toEqual({
      expanded: true,
    });

    await fireEvent.press(screen.getByRole("button", { name: "Saved rules" }));

    expect(screen.queryByRole("button", { name: /^501\.1,/ })).toBeNull();
  });

  it("should leave the document uncapped in either state", async () => {
    await renderRules(TABLET, ["501.1"]);

    expect(
      stylesAbove(screen.getByText(UNMARKED_RULE)).every((style) => style?.maxWidth === undefined),
    ).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Saved rules" }));

    expect(
      stylesAbove(screen.getByText(UNMARKED_RULE)).every((style) => style?.maxWidth === undefined),
    ).toBe(true);
    expect(
      stylesAbove(screen.getByText(UNMARKED_RULE)).some(
        (style) => style?.maxWidth === MaxReadingWidth,
      ),
    ).toBe(false);
  });

  it("should keep the strip to the 60 points the design leaves it", async () => {
    await renderRules(TABLET, ["501.1"]);

    const strip = screen.getByRole("button", { name: "Saved rules" });

    expect(StyleSheet.flatten(strip.props.style).width).toBe(SAVED_PANE_COLLAPSED_WIDTH);
  });

  it("should stack the strip evenly from the top rather than push the label down it", async () => {
    await renderRules(TABLET, ["501.1"]);

    const strip = StyleSheet.flatten(
      screen.getByRole("button", { name: "Saved rules" }).props.style,
    );

    expect(strip.gap).toBe(14);
    expect(strip.justifyContent).toBeUndefined();
    expect(stretchedChildrenOfStrip()).toEqual([]);
  });

  it("should name and count its own section, leaving room for the ones beside it", async () => {
    await openSavedPane(["501.1", "700.1"]);

    expect(screen.getByRole("header", { name: "Bookmarked rules 2" })).toBeTruthy();
  });

  it("should say so on the strip and in the pane when nothing is marked", async () => {
    await renderRules(TABLET);

    expect(screen.getByRole("button", { name: "Saved rules" }).props.accessibilityValue).toEqual({
      text: "0 bookmarked rules",
    });

    await fireEvent.press(screen.getByRole("button", { name: "Saved rules" }));

    expect(screen.getByText(CORE_RULES_NOTHING_SAVED_MESSAGE)).toBeTruthy();
  });
});

describe("the saved face on a phone", () => {
  it("should open from the header count and switch back to the contents", async () => {
    await renderRules(PHONE, ["501.1"]);

    expect(screen.queryByRole("tab", { name: /^Saved/ })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "1 bookmarked rule" }));

    expect(screen.getByRole("button", { name: /^501\.1,/ })).toBeTruthy();
    expect(
      screen.getByRole("tab", { name: "Saved, 1 bookmarked rule" }).props.accessibilityState,
    ).toEqual({ selected: true });

    await activateTab("Contents");

    expect(screen.getByRole("tab", { name: "Contents" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole("button", { name: "501 Turn Structure" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^501\.1,/ })).toBeNull();
  });

  it("should reach the saved face from the contents control as well", async () => {
    await renderRules(PHONE, ["501.1"]);

    await fireEvent.press(screen.getByRole("button", { name: "Contents" }));

    expect(screen.getByRole("tab", { name: "Contents" }).props.accessibilityState).toEqual({
      selected: true,
    });

    await activateTab("Saved, 1 bookmarked rule");

    expect(screen.getByRole("button", { name: /^501\.1,/ })).toBeTruthy();
  });

  it("should move the document and give the sheet away when an entry is chosen", async () => {
    await renderRules(PHONE, ["501.1"]);

    await fireEvent.press(screen.getByRole("button", { name: "1 bookmarked rule" }));
    await activate("501.1, Turn Structure. Chip damage is dealt.");

    expect(mockScrollToIndex).toHaveBeenLastCalledWith(scrolledToRow(6));
    expect(screen.queryByRole("tab", { name: /^Saved/ })).toBeNull();
  });

  it("should say so when nothing is marked", async () => {
    await renderRules(PHONE);

    await fireEvent.press(screen.getByRole("button", { name: "0 bookmarked rules" }));

    expect(screen.getByText(CORE_RULES_NOTHING_SAVED_MESSAGE)).toBeTruthy();
  });
});

describe("the saved surface and the document", () => {
  it("should hold a mark the query has filtered out of the document", async () => {
    await openSavedPane(["101.1"]);

    const field = screen.getByLabelText("Search the core rules");

    await fireEvent.changeText(field, "recycle");
    await fireEvent.press(screen.getByRole("checkbox", { name: "Matches only" }));

    expect(screen.queryByLabelText("Bookmark 101.1")).toBeNull();
    expect(screen.getByRole("button", { name: /^101\.1, Deck Construction\./ })).toBeTruthy();
    expect(screen.getByText("1 bookmarked rule")).toBeTruthy();
  });
});

describe("the scratchpad and the saved surface", () => {
  it("should no longer stand in the pane, which the Saved tab now holds", async () => {
    await openSavedPane(["501.1"]);

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    expect(screen.queryByRole("header", { name: SCRATCHPAD_TITLE })).toBeNull();
    expect(
      screen.queryByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` }),
    ).toBeNull();
    expect(screen.getByRole("header", { name: "Bookmarked rules 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^501\.1, Turn Structure\./ })).toBeTruthy();
  });

  it("should no longer stand on the saved face of the phone sheet either", async () => {
    await renderRules(PHONE, ["501.1"]);

    await fireEvent.press(screen.getByRole("button", { name: "1 bookmarked rule" }));

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    expect(screen.queryByRole("header", { name: SCRATCHPAD_TITLE })).toBeNull();
    expect(
      screen.queryByRole("button", { name: `Add a note to ${SCRATCHPAD_NOTES_NAME}` }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: /^501\.1, Turn Structure\./ })).toBeTruthy();
  });

  it("should leave the marked rules their own notes", async () => {
    const { noteStore } = await openSavedPane(["501.1"]);

    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "Chip damage, checked.");

    await waitFor(() => expect(noteStore.notes()).toHaveLength(1));
    expect(noteStore.notes()[0]?.subject).toEqual({ kind: "coreRule", id: "501.1" });
    expect(noteStore.scopes()).not.toContainEqual({ type: "standalone" });
  });
});
