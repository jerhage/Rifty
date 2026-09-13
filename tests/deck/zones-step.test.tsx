import { render, screen } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { Card } from "@/features/card/card";
import { buildCardLabel } from "@/features/deck/presentation/build-card-format";
import { RIFTBOUND_STANDARD, verifyDeck } from "@/features/deck/deck/deck-legality";
import {
  POOL_ROW_COLUMNS,
  POOL_TILE_COLUMNS,
} from "@/features/deck/presentation/components/build/zone-pool-list";
import {
  panelWidthFor,
  poolWidthFor,
} from "@/features/deck/presentation/components/build/steps/zones-step-columns";
import { ZonesStep } from "@/features/deck/presentation/components/build/steps/zones-step";
import {
  draftComposition,
  EMPTY_DRAFT,
  withZoneCard,
} from "@/features/deck/presentation/deck-build-steps";
import { EMPTY_POOL_FILTERS } from "@/features/deck/presentation/deck-zone-pool";
import type {
  ZoneDraftViewState,
  ZonePoolViewState,
} from "@/features/deck/presentation/hooks/use-deck-build";
import { fitColumns } from "@/hooks/use-layout-size";

import { card } from "../card/fixtures";

const ZED: Card = card("ogn-001", "OGN", { name: "Zed" });
const HELD = withZoneCard(EMPTY_DRAFT, "mainDeck", ZED.printingId, { card: ZED, quantity: 2 });

function draftState(): ZoneDraftViewState {
  return {
    draft: HELD,
    setQuantity: () => undefined,
    verification: verifyDeck(draftComposition(HELD), RIFTBOUND_STANDARD),
  };
}

function poolState(view: ZonePoolViewState["view"]): ZonePoolViewState {
  return {
    filters: EMPTY_POOL_FILTERS,
    layout: "list",
    openFilters: () => undefined,
    query: "",
    setLayout: () => undefined,
    setQuery: () => undefined,
    setView: () => undefined,
    setZone: () => undefined,
    view,
    zone: "mainDeck",
  };
}

function frameOf(width: number, height: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);

  return function FrameWrapper({ children }: PropsWithChildren) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width, height },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        {children}
      </SafeAreaProvider>
    );
  };
}

async function stepAt(
  width: number,
  height: number,
  view: ZonePoolViewState["view"],
  zonePool: readonly Card[] = [],
) {
  return await render(
    <ZonesStep
      draft={draftState()}
      onChangeName={() => undefined}
      onEditStep={() => undefined}
      onLoadMorePool={() => undefined}
      onOpenCard={() => undefined}
      pool={poolState(view)}
      zonePool={zonePool}
    />,
    { wrapper: frameOf(width, height) },
  );
}

describe("ZonesStep on a phone", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should offer the deck's contents as a tab, because nothing else shows them", async () => {
    await stepAt(402, 874, "pool");

    expect(screen.getByRole("tab", { name: "In deck, 2" })).toBeTruthy();
    expect(screen.queryByRole("header", { name: "In deck, 2" })).toBeNull();
  });

  it("should show the stored view rather than one chosen for it", async () => {
    await stepAt(402, 874, "inDeck");

    expect(screen.getByRole("tab", { name: "In deck, 2" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });
});

describe("ZonesStep on a tablet", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should stand the deck's contents beside the pool under a heading of their own", async () => {
    await stepAt(1376, 1032, "pool");

    expect(screen.getByRole("header", { name: "In deck, 2" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "In deck, 2" })).toBeNull();
  });

  it("should keep the two views it still offers selectable", async () => {
    await stepAt(1376, 1032, "roles");

    expect(screen.getAllByRole("tab").map((tab) => tab.props.accessibilityLabel)).toEqual([
      "Main deck, 2 of 40",
      "Rune deck, 0 of 12",
      "Battlefields, 0 of 3",
      "Sideboard, 0 of 10",
      "Pool",
      "Roles",
    ]);
    expect(screen.getByRole("tab", { name: "Roles" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it("should show the pool when the stored view is one the columns no longer offer", async () => {
    await stepAt(1376, 1032, "inDeck");

    expect(screen.getByRole("tab", { name: "Pool" }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it("should narrow each column to the width its own children may draw in", async () => {
    const lux = card("ogn-002", "OGN", { name: "Lux" });
    await stepAt(1376, 1032, "pool", [lux]);

    expect(screen.getByRole("button", { name: buildCardLabel(lux, 0) }).parent).toHaveStyle({
      width: fitColumns(poolWidthFor(1376), POOL_ROW_COLUMNS).columnWidth,
    });
    expect(screen.getByRole("button", { name: buildCardLabel(ZED, 2) }).parent).toHaveStyle({
      width: fitColumns(panelWidthFor(1376), POOL_ROW_COLUMNS).columnWidth,
    });
  });

  it("should reach the pool before the panel beside it", async () => {
    await stepAt(1376, 1032, "pool");

    const spoken = screen
      .getAllByText(/No cards available for this zone yet\.|In deck/)
      .map((node) => node.props.children);

    expect(spoken).toEqual(["No cards available for this zone yet.", "In deck · 2"]);
  });
});

describe("the widths the two columns take", () => {
  it("should hold the panel at its cap once the frame is wide enough to reach it", () => {
    expect([1376, 1280].map(panelWidthFor)).toEqual([420, 420]);
    expect(panelWidthFor(1032)).toBeCloseTo(396.92);
    expect(panelWidthFor(800)).toBeCloseTo(307.69);
  });

  it.each([
    [1376, 5, 3],
    [1280, 4, 2],
    [1032, 3, 1],
    [800, 2, 1],
  ])(
    "should give the pool at %i the design's %i card columns and %i row columns",
    (frame, tiles, rows) => {
      expect(fitColumns(poolWidthFor(frame), POOL_TILE_COLUMNS).columns).toBe(tiles);
      expect(fitColumns(poolWidthFor(frame), POOL_ROW_COLUMNS).columns).toBe(rows);
    },
  );

  it("should keep the deck's own rows in a single column at every frame", () => {
    const panels = [1376, 1280, 1032, 800].map(panelWidthFor);

    expect(panels.map((width) => fitColumns(width, POOL_ROW_COLUMNS).columns)).toEqual([
      1, 1, 1, 1,
    ]);
  });
});
