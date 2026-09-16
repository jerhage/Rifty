import { fireEvent, render, screen, within } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { CardSummary } from "@/features/card/card-summary";
import type { CatalogQueryCriteria } from "@/features/catalog/presentation/catalog-query-criteria";
import { CatalogFilterFace } from "@/features/catalog/presentation/components/sheet/catalog-filter-face";
import { CatalogSearchScreen } from "@/features/catalog/presentation/screens/catalog-search-screen";

const NO_CARDS: readonly CardSummary[] = [];

function createWrapper() {
  return function Wrapper({ children }: PropsWithChildren) {
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
  };
}

async function renderCatalog({
  bookmarkedCount = 0,
  cards = NO_CARDS,
  criteria = {},
  onToggleOnlyBookmarked = () => {},
}: {
  bookmarkedCount?: number;
  cards?: readonly CardSummary[];
  criteria?: CatalogQueryCriteria;
  onToggleOnlyBookmarked?: () => void;
} = {}) {
  await render(
    <CatalogSearchScreen
      bookmarkedCount={bookmarkedCount}
      cards={cards}
      criteria={criteria}
      hasMore={false}
      isRefreshing={false}
      loadMore={() => {}}
      onChangeQuery={() => {}}
      onClearDomains={() => {}}
      onClearTypes={() => {}}
      onOpenCard={() => {}}
      onOpenFilters={() => {}}
      onOpenSort={() => {}}
      onToggleDomain={() => {}}
      onToggleOnlyBookmarked={onToggleOnlyBookmarked}
      onToggleSortDirection={() => {}}
      onToggleType={() => {}}
      paging={{ type: "idle" }}
      query=""
      refresh={() => {}}
      retryLoadMore={() => {}}
      total={cards.length}
    />,
    { wrapper: createWrapper() },
  );
}

function chip(count: number) {
  return screen.getByLabelText(`Only bookmarked cards, ${count} bookmarked`);
}

describe("the catalog's bookmarked filter", () => {
  it("should say how many cards are bookmarked and report itself as off", async () => {
    await renderCatalog({ bookmarkedCount: 3 });

    expect(chip(3).props.accessibilityState).toEqual({ checked: false });
    expect(within(chip(3)).getByText("3")).toBeTruthy();
  });

  it("should report itself as on while the criterion narrows the grid", async () => {
    await renderCatalog({ bookmarkedCount: 3, criteria: { onlyBookmarked: true } });

    expect(chip(3).props.accessibilityState).toEqual({ checked: true });
  });

  it("should delegate the press rather than filter anything itself", async () => {
    let presses = 0;
    await renderCatalog({ bookmarkedCount: 1, onToggleOnlyBookmarked: () => (presses += 1) });

    await fireEvent.press(chip(1));

    expect(presses).toBe(1);
  });

  it("should show the catalog's empty state when nothing is bookmarked", async () => {
    await renderCatalog({ criteria: { onlyBookmarked: true } });

    expect(
      screen.getByText("No bookmarked cards match. Bookmark one from its detail?"),
    ).toBeTruthy();
    expect(screen.getByText("no cards")).toBeTruthy();
  });

  it("should turn the criterion on from the sheet's switch", async () => {
    const changes: CatalogQueryCriteria[] = [];
    await render(
      <CatalogFilterFace
        bookmarkedCount={2}
        cardSets={[]}
        criteria={{}}
        keywords={[]}
        onApply={() => {}}
        onChangeCriteria={(criteria) => changes.push(criteria)}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );

    await fireEvent.press(screen.getByRole("switch"));

    expect(changes).toEqual([{ onlyBookmarked: true }]);
    expect(screen.getByText("Only bookmarked cards")).toBeTruthy();
    expect(screen.getByText("2 cards bookmarked")).toBeTruthy();
  });

  it("should turn the criterion off again from the sheet's switch", async () => {
    const changes: CatalogQueryCriteria[] = [];
    await render(
      <CatalogFilterFace
        bookmarkedCount={1}
        cardSets={[]}
        criteria={{ onlyBookmarked: true }}
        keywords={[]}
        onApply={() => {}}
        onChangeCriteria={(criteria) => changes.push(criteria)}
        onClear={() => {}}
      />,
      { wrapper: createWrapper() },
    );
    const control = screen.getByRole("switch");
    expect(control.props.accessibilityState).toEqual({ checked: true });

    await fireEvent.press(control);

    expect(changes).toEqual([{ onlyBookmarked: undefined }]);
    expect(screen.getByText("1 card bookmarked")).toBeTruthy();
  });
});
