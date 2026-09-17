import { fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Dimensions, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import { SubjectNoteCountsData } from "@/features/annotation/presentation/data/subject-note-counts-data";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { createNoteStore, fixedClock, subject, type NoteStore } from "../annotation/fixtures";
import { createTestWrapper } from "../test-wrapper";
import { coreRuleAnnotations, coreRuleDocument } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };
const WRITTEN_AT = "2026-09-16T10:00:00.000Z";
const PHONE = { width: 402, height: 874 } as const;
const TABLET = { width: 1376, height: 1032 } as const;

/** Nothing lays out under Jest, so the handle the list hands its caller is what stands in. */
jest.mock("@shopify/flash-list", () => {
  const { createElement, forwardRef, useImperativeHandle } = require("react");
  const flashList = jest.requireActual("@shopify/flash-list");

  return {
    ...flashList,
    FlashList: forwardRef(function StillFlashList(props: object, ref: unknown) {
      useImperativeHandle(ref, () => ({ scrollToIndex: () => undefined }), []);

      return createElement(flashList.FlashList, props);
    }),
  };
});

afterEach(() => {
  jest.restoreAllMocks();
});

const DOCUMENT = coreRuleDocument([
  { number: "500", kind: "heading", body: "Playing the Game" },
  { number: "501", kind: "heading", body: "Turn Structure" },
  { number: "501.1", body: "Chip damage is dealt." },
  { number: "501.2", body: "Runes pay for costs." },
]);

function sameSubject(one: AnnotationSubject, other: AnnotationSubject): boolean {
  return one.kind === other.kind && one.id === other.id;
}

interface BookmarkStore {
  readonly manager: BookmarkManager;
  marks(): readonly Bookmark[];
}

function createBookmarkStore(markedNumbers: readonly string[] = []): BookmarkStore {
  const bookmarks: Bookmark[] = markedNumbers.map((number) => ({
    subject: subject("coreRule", number),
    createdAt: WRITTEN_AT,
  }));

  return {
    manager: {
      get: (asked) =>
        Promise.resolve(bookmarks.find((held) => sameSubject(held.subject, asked)) ?? null),
      getAll: (scope) =>
        Promise.resolve(
          scope.type === "all"
            ? [...bookmarks]
            : bookmarks.filter((held) => held.subject.kind === scope.kind),
        ),
      remove: (asked) => {
        const at = bookmarks.findIndex((held) => sameSubject(held.subject, asked));

        if (at >= 0) bookmarks.splice(at, 1);

        return Promise.resolve();
      },
      save: (bookmark) => {
        bookmarks.push(bookmark);

        return Promise.resolve();
      },
    },
    marks: () => bookmarks,
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

interface RenderedRules {
  readonly bookmarkStore: BookmarkStore;
  readonly noteStore: NoteStore;
}

async function renderRules(
  frame: { readonly width: number; readonly height: number },
  bookmarkStore: BookmarkStore = createBookmarkStore(),
  noteStore: NoteStore = createNoteStore(),
): Promise<RenderedRules> {
  await render(
    <BookmarkedSubjectsData
      bookmarkManager={bookmarkStore.manager}
      clock={fixedClock(WRITTEN_AT)}
      kind="coreRule"
    >
      {(bookmarked) => (
        <SubjectNoteCountsData kind="coreRule" noteLister={noteStore.manager}>
          {(noted) => (
            <CoreRulesScreen
              coreRules={DOCUMENT}
              edition={EDITION}
              {...coreRuleAnnotations(bookmarked, noteStore.manager, noted)}
              onRemoveBookmark={bookmarked.toggleBookmark}
            />
          )}
        </SubjectNoteCountsData>
      )}
    </BookmarkedSubjectsData>,
    { wrapper: wrapperFor(frame) },
  );

  await screen.findByLabelText("Search the core rules");

  return { bookmarkStore, noteStore };
}

/**
 * A presented sheet leaves a placeholder for content the platform hosts itself, and the placeholder
 * takes no pointer events, so the harness refuses a press inside it. Activating a control the way
 * an assistive technology does reaches the same handler a finger would.
 */
async function activate(name: string) {
  await fireEvent(screen.getByRole("button", { name }), "onClick");
}

function notesControlOn(number: string) {
  return screen.getByRole("button", { name: `Notes on ${number}` });
}

function markOn(number: string) {
  return screen.getByLabelText(`Bookmark ${number}`);
}

function popupMarkOn(number: string) {
  const mark = screen
    .getAllByRole("checkbox", { name: `Bookmark ${number}` })
    .find(
      (candidate) =>
        within(candidate).queryByText(/^Bookmark(ed)?$/, { includeHiddenElements: true }) !== null,
    );

  if (mark === undefined) throw new Error(`Nothing in the popup marks ${number}.`);

  return mark;
}

function rowBar(number: string) {
  return StyleSheet.flatten(screen.getByText(number).parent?.props.style).borderLeftColor;
}

async function addNote(number: string, body: string) {
  await activate(`Add a note to ${number}`);
  await fireEvent.changeText(screen.getByLabelText(`New note on ${number}`), body);
  await activate(`Save the new note on ${number}`);
}

describe("the notes control on a rule row", () => {
  it("should stand on every numbered rule and on no heading", async () => {
    await renderRules(PHONE);

    expect(notesControlOn("501.1")).toBeTruthy();
    expect(notesControlOn("501.2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Notes on 501" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Notes on 500" })).toBeNull();
  });

  it("should print the count on a rule that carries notes and print none on one that does not", async () => {
    const noteStore = createNoteStore([
      {
        id: "note-0",
        subject: subject("coreRule", "501.1"),
        title: "",
        body: "Came up in round three.",
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      },
    ]);
    await renderRules(PHONE, createBookmarkStore(), noteStore);

    expect(notesControlOn("501.1").props.accessibilityValue).toEqual({ text: "1 note" });
    expect(notesControlOn("501.2").props.accessibilityValue).toEqual({ text: "0 notes" });
    expect(within(notesControlOn("501.1")).getByText("1")).toBeTruthy();
    expect(within(notesControlOn("501.2")).queryByText("0")).toBeNull();
  });

  it("should leave the row's left bar alone whether or not the rule is noted", async () => {
    const noteStore = createNoteStore([
      {
        id: "note-0",
        subject: subject("coreRule", "501.1"),
        title: "",
        body: "Came up in round three.",
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      },
    ]);
    await renderRules(PHONE, createBookmarkStore(), noteStore);

    expect(rowBar("501.1")).toBe(Colors.light.border);
    expect(rowBar("501.1")).toBe(rowBar("501.2"));
  });

  it("should ask the store once for the whole document rather than once per row", async () => {
    const { noteStore } = await renderRules(PHONE);

    expect(noteStore.scopes()).toEqual([{ type: "ofKind", kind: "coreRule" }]);
  });
});

describe("the note popup on a phone", () => {
  it("should open from the row it stands on and give itself up again", async () => {
    await renderRules(PHONE);

    expect(screen.queryByRole("header", { name: "Notes on 501.1" })).toBeNull();

    await fireEvent.press(notesControlOn("501.1"));

    expect(screen.getByRole("header", { name: "Notes on 501.1" })).toBeTruthy();
    expect(screen.getAllByText("Turn Structure")).toHaveLength(2);
    expect(screen.getAllByText("Chip damage is dealt.")).toHaveLength(2);

    await activate("Done");

    expect(screen.queryByRole("header", { name: "Notes on 501.1" })).toBeNull();
  });

  it("should write a note on a rule nothing has bookmarked", async () => {
    const { bookmarkStore, noteStore } = await renderRules(PHONE);

    await fireEvent.press(notesControlOn("501.1"));
    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "Ask a judge about this.");

    await waitFor(() =>
      expect(noteStore.notes().map((note) => [note.subject?.id, note.body])).toEqual([
        ["501.1", "Ask a judge about this."],
      ]),
    );
    expect(bookmarkStore.marks()).toEqual([]);
  });

  it("should follow the count on the row once a note is written", async () => {
    await renderRules(PHONE);

    await fireEvent.press(notesControlOn("501.1"));
    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "Ask a judge about this.");

    await waitFor(() =>
      expect(notesControlOn("501.1").props.accessibilityValue).toEqual({ text: "1 note" }),
    );
    expect(notesControlOn("501.2").props.accessibilityValue).toEqual({ text: "0 notes" });
  });
});

describe("the note popup on a tablet", () => {
  it("should open from the row it stands on and give itself up again", async () => {
    await renderRules(TABLET);

    expect(screen.queryByRole("header", { name: "Notes on 501.1" })).toBeNull();

    await fireEvent.press(notesControlOn("501.1"));

    expect(screen.getByRole("header", { name: "Notes on 501.1" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("header", { name: "Notes on 501.1" })).toBeNull();
  });

  it("should close on the scrim as well, so the popup is never a gesture to escape", async () => {
    await renderRules(TABLET);

    await fireEvent.press(notesControlOn("501.1"));
    await fireEvent.press(screen.getByRole("button", { name: "Close the notes" }));

    expect(screen.queryByRole("header", { name: "Notes on 501.1" })).toBeNull();
  });
});

describe("the bookmark control in the note popup", () => {
  it("should stand beside the rule it is written about and report it unmarked", async () => {
    await renderRules(PHONE);

    await fireEvent.press(notesControlOn("501.1"));

    expect(popupMarkOn("501.1").props.accessibilityState.checked).toBe(false);
  });

  it("should report the rule marked where the mark already stands", async () => {
    await renderRules(PHONE, createBookmarkStore(["501.1"]));

    await fireEvent.press(notesControlOn("501.1"));

    expect(popupMarkOn("501.1").props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Bookmarked", { includeHiddenElements: true })).toBeTruthy();
  });

  it("should keep the caption from being read after the name it repeats", async () => {
    await renderRules(PHONE);

    await fireEvent.press(notesControlOn("501.1"));

    expect(popupMarkOn("501.1")).toBeTruthy();
    expect(screen.queryByText("Bookmark")).toBeNull();
  });

  it("should mark the rule from inside the popup, and follow the mark it made", async () => {
    const { bookmarkStore } = await renderRules(TABLET);

    await fireEvent.press(notesControlOn("501.1"));
    await fireEvent.press(popupMarkOn("501.1"));

    await waitFor(() => expect(popupMarkOn("501.1").props.accessibilityState.checked).toBe(true));
    expect(bookmarkStore.marks()).toHaveLength(1);
  });
});

describe("marking and noting as two acts", () => {
  it("should write no note when a rule is marked", async () => {
    const { bookmarkStore, noteStore } = await renderRules(PHONE);

    await fireEvent.press(markOn("501.1"));

    await waitFor(() => expect(bookmarkStore.marks()).toHaveLength(1));
    expect(noteStore.notes()).toEqual([]);
    expect(notesControlOn("501.1").props.accessibilityValue).toEqual({ text: "0 notes" });
  });

  it("should mark nothing when a rule is noted", async () => {
    const { bookmarkStore } = await renderRules(PHONE);

    await fireEvent.press(notesControlOn("501.1"));
    await screen.findByRole("button", { name: "Add a note to 501.1" });
    await addNote("501.1", "Ask a judge about this.");
    await activate("Done");

    await waitFor(() =>
      expect(notesControlOn("501.1").props.accessibilityValue).toEqual({ text: "1 note" }),
    );
    expect(bookmarkStore.marks()).toEqual([]);
    expect(markOn("501.1").props.accessibilityState).toEqual({ checked: false });
  });
});

describe("the saved surface as the union of both acts", () => {
  async function openSavedPane(
    bookmarkStore?: BookmarkStore,
    noteStore?: NoteStore,
  ): Promise<RenderedRules> {
    const rendered = await renderRules(TABLET, bookmarkStore, noteStore);

    await fireEvent.press(screen.getByRole("button", { name: "Saved rules" }));

    return rendered;
  }

  function notedStore(...numbers: readonly string[]): NoteStore {
    return createNoteStore(
      numbers.map((number, at) => ({
        id: `note-${at}`,
        subject: subject("coreRule", number),
        title: "",
        body: `Written on ${number}.`,
        createdAt: WRITTEN_AT,
        updatedAt: WRITTEN_AT,
      })),
    );
  }

  it("should hold a noted rule nothing has marked, and say it is there for the note", async () => {
    await openSavedPane(createBookmarkStore(), notedStore("501.1"));

    expect(screen.getByRole("button", { name: /^501\.1, Turn Structure\./ })).toBeTruthy();
    expect(screen.getByText("Noted")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Bookmarked and noted rules 1" })).toBeTruthy();
  });

  it("should say a marked rule is there for the mark, whether or not it is also noted", async () => {
    await openSavedPane(createBookmarkStore(["501.1"]), notedStore("501.1"));

    expect(screen.getAllByText("Bookmarked")).toHaveLength(1);
    expect(screen.queryByText("Noted")).toBeNull();
    expect(screen.getByRole("header", { name: "Bookmarked and noted rules 1" })).toBeTruthy();
  });

  it("should list both, in document order, where one is marked and the other noted", async () => {
    await openSavedPane(createBookmarkStore(["501.2"]), notedStore("501.1"));

    expect(
      screen
        .getAllByRole("button", { name: /^501\.\d, / })
        .map((entry) => entry.props.accessibilityLabel),
    ).toEqual([
      "501.1, Turn Structure. Chip damage is dealt.",
      "501.2, Turn Structure. Runes pay for costs.",
    ]);
    expect(screen.getByRole("header", { name: "Bookmarked and noted rules 2" })).toBeTruthy();
  });

  it("should offer no bookmark removal on a rule that is only noted", async () => {
    await openSavedPane(createBookmarkStore(), notedStore("501.1"));

    expect(screen.queryByRole("button", { name: "Remove bookmark 501.1" })).toBeNull();
  });

  it("should leave the notes standing when the bookmark is given up", async () => {
    const { noteStore } = await openSavedPane(createBookmarkStore(["501.1"]), notedStore("501.1"));

    expect(screen.getByText("Bookmarked")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Remove bookmark 501.1" }));

    await waitFor(() => expect(screen.getByText("Noted")).toBeTruthy());
    expect(noteStore.notes().map((note) => note.body)).toEqual(["Written on 501.1."]);
    expect(noteStore.removals()).toBe(0);
    expect(screen.getByRole("button", { name: /^501\.1, Turn Structure\./ })).toBeTruthy();
  });
});
