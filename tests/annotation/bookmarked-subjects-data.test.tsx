import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkListScope } from "@/features/annotation/bookmark-list-scope";
import type { BookmarkLister } from "@/features/annotation/bookmark-lister";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import { listBookmarksQuery } from "@/features/annotation/queries/annotation-queries";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useReadState } from "@/hooks/use-read-state";

import { createTestWrapper } from "../test-wrapper";
import { fixedClock, subject } from "./fixtures";

const STORE_FAILURE = new Error("The store is unavailable.");
const MARKED_AT = "2026-09-16T10:00:00.000Z";
const RULE = subject("coreRule", "101.1");
const CARD = subject("card", "Ember Adept");

function sameSubject(one: AnnotationSubject, other: AnnotationSubject): boolean {
  return one.kind === other.kind && one.id === other.id;
}

interface MarkStore {
  readonly manager: BookmarkManager;
  scopes(): readonly BookmarkListScope[];
}

function createMarkStore(marked: readonly AnnotationSubject[] = []): MarkStore {
  const bookmarks: Bookmark[] = marked.map((held) => ({ subject: held, createdAt: MARKED_AT }));
  const scopes: BookmarkListScope[] = [];

  return {
    manager: {
      get: (held) =>
        Promise.resolve(bookmarks.find((mark) => sameSubject(mark.subject, held)) ?? null),
      getAll: (scope) => {
        scopes.push(scope);

        return Promise.resolve(
          scope.type === "all"
            ? [...bookmarks]
            : bookmarks.filter((mark) => mark.subject.kind === scope.kind),
        );
      },
      remove: (held) => {
        const at = bookmarks.findIndex((mark) => sameSubject(mark.subject, held));

        if (at >= 0) bookmarks.splice(at, 1);

        return Promise.resolve();
      },
      save: (bookmark) => {
        bookmarks.push(bookmark);

        return Promise.resolve();
      },
    },
    scopes: () => scopes,
  };
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
        {({ bookmarkedIds, toggleBookmark }) => (
          <>
            <Text>{`marked: ${[...bookmarkedIds].join(", ")}`}</Text>
            <Pressable accessibilityRole="button" onPress={() => toggleBookmark("101.2")}>
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

describe("BookmarkedSubjectsData", () => {
  it("should hand down the ids of the kind it was asked for, narrowed by the store", async () => {
    const store = createMarkStore([RULE, CARD]);

    await renderMarks(store.manager);

    expect(await screen.findByText("marked: 101.1")).toBeTruthy();
    expect(store.scopes()).toEqual([{ type: "ofKind", kind: "coreRule" }]);
  });

  it("should render nothing but the loading state before the read settles", async () => {
    const store = createMarkStore();

    await renderMarks({
      ...store.manager,
      getAll: () => new Promise<readonly Bookmark[]>(() => {}),
    });

    expect(screen.queryByText(/marked:/)).toBeNull();
    expect(screen.queryByText("Could not load your bookmarks.")).toBeNull();
  });

  it("should report a failed read and read again when the retry is pressed", async () => {
    const store = createMarkStore([RULE]);
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
    const store = createMarkStore([RULE]);

    await renderMarks(store.manager, true);
    expect(await screen.findByText("every kind: 1")).toBeTruthy();

    await fireEvent.press(screen.getByText("Mark 101.2"));

    expect(await screen.findByText("every kind: 2")).toBeTruthy();
    expect(await screen.findByText("marked: 101.1, 101.2")).toBeTruthy();
  });
});
