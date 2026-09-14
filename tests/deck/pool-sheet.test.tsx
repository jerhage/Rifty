import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PoolSheet } from "@/features/deck/presentation/components/build/pool-sheet";
import {
  DEFAULT_POOL_SORT,
  EMPTY_POOL_FILTERS,
} from "@/features/deck/presentation/deck-section-pool";
import type { SectionPoolSheetState } from "@/features/deck/presentation/hooks/use-section-pool";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

async function renderSheet(sheet: SectionPoolSheetState) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PoolSheet
        filters={EMPTY_POOL_FILTERS}
        keywords={[]}
        onApplyFilters={() => undefined}
        onApplySort={() => undefined}
        onChangeSort={() => undefined}
        onDismiss={() => undefined}
        onReset={() => undefined}
        onToggleDomain={() => undefined}
        onToggleKeyword={() => undefined}
        onToggleType={() => undefined}
        sheet={sheet}
        sort={DEFAULT_POOL_SORT}
        section="mainDeck"
      />
    </SafeAreaProvider>,
  );
}

describe("PoolSheet", () => {
  it("should keep its face out of the tree while it is hidden", async () => {
    await renderSheet({ type: "hidden" });

    expect(screen.queryByText("Narrow the pool")).toBeNull();
    expect(screen.queryByText("Sort by")).toBeNull();
  });

  it("should render its face once it is presented", async () => {
    await renderSheet({ type: "filter" });

    expect(screen.getByText("Narrow the pool")).toBeTruthy();
  });

  it("should show the ordering face when that is the one asked for", async () => {
    await renderSheet({ type: "sort" });

    expect(screen.getByText("Sort by")).toBeTruthy();
    expect(screen.queryByText("Narrow the pool")).toBeNull();
  });
});
