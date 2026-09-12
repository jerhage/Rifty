import { render, screen } from "@testing-library/react-native";

import { PoolFilterSheet } from "@/features/deck/presentation/components/build/pool-filter-sheet";
import { EMPTY_POOL_FILTERS } from "@/features/deck/presentation/deck-zone-pool";

async function renderSheet(isPresented: boolean) {
  await render(
    <PoolFilterSheet
      filters={EMPTY_POOL_FILTERS}
      isPresented={isPresented}
      keywords={[]}
      onApply={() => undefined}
      onDismiss={() => undefined}
      onReset={() => undefined}
      onToggleDomain={() => undefined}
      onToggleKeyword={() => undefined}
      onToggleType={() => undefined}
      zone="mainDeck"
    />,
  );
}

describe("PoolFilterSheet", () => {
  it("should keep its face out of the tree while it is hidden", async () => {
    await renderSheet(false);

    expect(screen.queryByText("Narrow the pool")).toBeNull();
  });

  it("should render its face once it is presented", async () => {
    await renderSheet(true);

    expect(screen.getByText("Narrow the pool")).toBeTruthy();
  });
});
