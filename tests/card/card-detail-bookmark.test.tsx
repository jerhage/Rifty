import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { AccessibilityInfo, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TouchTarget } from "@/constants/theme";
import type { Bookmark } from "@/features/annotation/bookmark";
import type { BookmarkManager } from "@/features/annotation/bookmark-manager";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import { BookmarkedSubjectsData } from "@/features/annotation/presentation/data/bookmarked-subjects-data";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { CardDetailScreen } from "@/features/card/presentation/screens/card-detail-screen";

import { card, cardSet } from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const MARKED_AT = "2026-09-16T10:00:00.000Z";
const UNLEASHED = cardSet("UNL", "2026-05-08T00:00:00");
const VI = card("vi", UNLEASHED.code, { name: "Vi - Piltover Enforcer" });

function sameSubject(one: AnnotationSubject, other: AnnotationSubject): boolean {
  return one.kind === other.kind && one.id === other.id;
}

interface MarkStore {
  readonly manager: BookmarkManager;
  marks(): readonly Bookmark[];
}

function createMarkStore(marked: readonly AnnotationSubject[] = []): MarkStore {
  const bookmarks: Bookmark[] = marked.map((held) => ({ subject: held, createdAt: MARKED_AT }));

  return {
    manager: {
      get: (held) =>
        Promise.resolve(bookmarks.find((mark) => sameSubject(mark.subject, held)) ?? null),
      getAll: (scope) =>
        Promise.resolve(
          scope.type === "all"
            ? [...bookmarks]
            : bookmarks.filter((mark) => mark.subject.kind === scope.kind),
        ),
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
    marks: () => bookmarks,
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

async function renderCardDetail(store: MarkStore) {
  const view = await render(
    <BookmarkedSubjectsData
      bookmarkManager={store.manager}
      clock={{ now: () => MARKED_AT }}
      kind="card"
    >
      {({ bookmarkedIds, toggleBookmark }) => (
        <CardDetailScreen
          bookmarkControl={
            <BookmarkToggle
              bookmarked={bookmarkedIds.has(VI.printingId)}
              label="Bookmark"
              onPress={() => toggleBookmark(VI.printingId)}
            />
          }
          card={VI}
          notes={null}
        />
      )}
    </BookmarkedSubjectsData>,
    { wrapper: createWrapper() },
  );
  await screen.findByLabelText("Bookmark");

  return view;
}

function markState() {
  return screen.getByLabelText("Bookmark").props.accessibilityState;
}

describe("a card's bookmark on card detail", () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should centre the mark in its target, beside the card's name", async () => {
    await renderCardDetail(createMarkStore());

    const control = StyleSheet.flatten(screen.getByLabelText("Bookmark").props.style);
    expect(control.justifyContent).toBe("center");
    expect(control.alignSelf).toBe("center");
    expect(control.minHeight).toBe(TouchTarget.minimum);
    expect(control.minWidth).toBe(TouchTarget.minimum);
  });

  it("should store a mark on the card subject when the control is pressed", async () => {
    const store = createMarkStore();
    await renderCardDetail(store);

    await fireEvent.press(screen.getByLabelText("Bookmark"));

    await waitFor(() => expect(markState()).toEqual({ checked: true }));
    expect(screen.getByRole("checkbox", { name: "Bookmark" })).toBeTruthy();
    expect(store.marks()).toEqual([
      { subject: { kind: "card", id: VI.printingId }, createdAt: MARKED_AT },
    ]);
  });

  it("should take the mark off again on a second press", async () => {
    const store = createMarkStore([{ kind: "card", id: VI.printingId }]);
    await renderCardDetail(store);
    expect(markState()).toEqual({ checked: true });

    await fireEvent.press(screen.getByLabelText("Bookmark"));

    await waitFor(() => expect(markState()).toEqual({ checked: false }));
    expect(store.marks()).toEqual([]);
  });

  it("should read as marked when the same card is opened again", async () => {
    const store = createMarkStore();
    const first = await renderCardDetail(store);

    await fireEvent.press(screen.getByLabelText("Bookmark"));
    await waitFor(() => expect(markState()).toEqual({ checked: true }));
    first.unmount();

    await renderCardDetail(store);

    expect(markState()).toEqual({ checked: true });
  });
});
