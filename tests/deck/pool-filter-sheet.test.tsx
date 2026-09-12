import { render, screen } from "@testing-library/react-native";

import { PoolFilterSheet } from "@/features/deck/presentation/components/build/pool-filter-sheet";
import type { ZonePoolFilters } from "@/features/deck/presentation/deck-zone-pool";

const noFilters: ZonePoolFilters = { domainIds: [], keywordIds: [], typeIds: [] };

async function renderSheet(isPresented: boolean) {
  await render(
    <PoolFilterSheet
      filters={noFilters}
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
