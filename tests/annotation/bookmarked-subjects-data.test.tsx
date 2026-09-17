import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkLister } from "@/features/annotation/bookmark-lister";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import {
  listBookmarksQuery,
  listNotedSubjectsQuery,
} from "@/features/annotation/queries/annotation-queries";
import type { ListNotedSubjectsCapabilities } from "@/features/annotation/use-cases/list-noted-subjects";
import { coreRuleNumberSchema } from "@/features/rules/value-objects/core-rule-number";
import { useReadState } from "@/hooks/use-read-state";

import { createTestWrapper } from "../test-wrapper";
import {
  createBookmarkStore,
  createNoteStore,
  createSubjectStore,
  fixedClock,
  subject,
  writtenNote,
} from "./fixtures";

const STORE_FAILURE = new Error("The store is unavailable.");
const MARKED_AT = "2026-09-16T10:00:00.000Z";
const READ_NUMBERS = ["101.1", "101.2"].map((value) => coreRuleNumberSchema.parse(value));
const RULE = subject("coreRule", "101.1");
const CARD = subject("card", "Ember Adept");

function SavedSubjectsProbe({
  capabilities,
}: {
  readonly capabilities: ListNotedSubjectsCapabilities;
}) {
  const { state } = useReadState(listNotedSubjectsQuery(capabilities));

  return <Text>{`saved: ${state.type === "success" ? state.notes.length : "…"}`}</Text>;
}

/** A second reader of the same rows, under a scope the press never names. */
function EveryMarkProbe({ bookmarkLister }: { readonly bookmarkLister: BookmarkLister }) {
  const { state } = useReadState(listBookmarksQuery({ type: "all" }, { bookmarkLister }));

  return <Text>{`every kind: ${state.type === "success" ? state.bookmarks.length : "…"}`}</Text>;
}

async function renderMarks(manager: BookmarkManager, probe = false) {
  return await render(
    <>
      <BookmarkedSubjectsData
        bookmarkManager={manager}
        clock={fixedClock(MARKED_AT)}
        kind="coreRule"
      >
        {({ isBookmarked, toggleBookmark }) => (
          <>
            <Text>{`marked: ${READ_NUMBERS.filter(isBookmarked).join(", ")}`}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => toggleBookmark(coreRuleNumberSchema.parse("101.2"))}
            >
              <Text>Mark 101.2</Text>
            </Pressable>
          </>
        )}
      </BookmarkedSubjectsData>
      {probe ? <EveryMarkProbe bookmarkLister={manager} /> : null}
    </>,
    { wrapper: createTestWrapper() },
  );
}

async function renderMarksBesideSaved(
  manager: BookmarkManager,
  capabilities: ListNotedSubjectsCapabilities,
) {
  return await render(
    <>
      <BookmarkedSubjectsData
        bookmarkManager={manager}
        clock={fixedClock(MARKED_AT)}
        kind="coreRule"
      >
        {({ toggleBookmark }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => toggleBookmark(coreRuleNumberSchema.parse("101.2"))}
          >
            <Text>Mark 101.2</Text>
          </Pressable>
        )}
      </BookmarkedSubjectsData>
      <SavedSubjectsProbe capabilities={capabilities} />
    </>,
    { wrapper: createTestWrapper() },
  );
}

describe("BookmarkedSubjectsData", () => {
  it("should hand down the ids of the kind it was asked for, narrowed by the store", async () => {
    const store = createBookmarkStore([RULE, CARD]);

    await renderMarks(store.manager);

    expect(await screen.findByText("marked: 101.1")).toBeTruthy();
    expect(store.scopes()).toEqual([{ type: "ofKind", kind: "coreRule" }]);
  });

  it("should render nothing but the loading state before the read settles", async () => {
    const store = createBookmarkStore();

    await renderMarks({
      ...store.manager,
      getAll: () => new Promise<readonly Bookmark[]>(() => {}),
    });

    expect(screen.queryByText(/marked:/)).toBeNull();
    expect(screen.queryByText("Could not load your bookmarks.")).toBeNull();
  });

  it("should report a failed read and read again when the retry is pressed", async () => {
    const store = createBookmarkStore([RULE]);
    let attempts = 0;

    await renderMarks({
      ...store.manager,
      getAll: (scope) => {
        attempts += 1;

        return attempts === 1 ? Promise.reject(STORE_FAILURE) : store.manager.getAll(scope);
      },
    });
    await screen.findByText("Could not load your bookmarks.");

    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("marked: 101.1")).toBeTruthy();
  });

  it("should leave every scope of the marks stale, not only the one it read", async () => {
    const store = createBookmarkStore([RULE]);

    await renderMarks(store.manager, true);
    expect(await screen.findByText("every kind: 1")).toBeTruthy();

    await fireEvent.press(screen.getByText("Mark 101.2"));

    expect(await screen.findByText("every kind: 2")).toBeTruthy();
    expect(await screen.findByText("marked: 101.1, 101.2")).toBeTruthy();
  });

  it("should leave the saved read stale too, since it stands over marks and notes alike", async () => {
    const store = createBookmarkStore([RULE]);
    const notes = createNoteStore([
      writtenNote("note-1", RULE, "Came up in round three.", MARKED_AT),
    ]);
    const subjects = createSubjectStore();

    await renderMarksBesideSaved(store.manager, {
      bookmarkLister: store.manager,
      cardSummariesFinder: subjects.cardSummariesFinder,
      coreRulesFinder: subjects.coreRulesFinder,
      noteLister: notes.manager,
    });
    expect(await screen.findByText("saved: 1")).toBeTruthy();

    await fireEvent.press(screen.getByText("Mark 101.2"));

    await waitFor(() => expect(notes.scopes()).toHaveLength(2));
  });
});
