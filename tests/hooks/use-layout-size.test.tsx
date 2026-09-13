import { renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Dimensions } from "react-native";
import { SafeAreaProvider, type EdgeInsets } from "react-native-safe-area-context";

import { CATALOG_COLUMNS } from "@/features/catalog/presentation/components/grid/card-summary-grid";
import {
  POOL_ROW_COLUMNS,
  POOL_TILE_COLUMNS,
} from "@/features/deck/presentation/components/build/zone-pool-list";
import { CHAMPION_COLUMNS } from "@/features/deck/presentation/components/build/steps/champion-step";
import { LEGEND_COLUMNS } from "@/features/deck/presentation/components/build/steps/legend-step";
import {
  fitColumns,
  useColumnFit,
  useLayoutSize,
  type ColumnFit,
  type ColumnSpec,
} from "@/hooks/use-layout-size";

const TILES: ColumnSpec = { gap: 16, minimum: 150, sidePadding: 0 };

const NO_INSETS: EdgeInsets = { bottom: 0, left: 0, right: 0, top: 0 };

const LANDSCAPE_CUTOUT: EdgeInsets = { bottom: 21, left: 59, right: 59, top: 0 };

function windowOf(width: number, height: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);
}

function insetWrapper(width: number, height: number, insets: EdgeInsets) {
  return function InsetWrapper({ children }: PropsWithChildren) {
    return (
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height }, insets }}>
        {children}
      </SafeAreaProvider>
    );
  };
}

async function layoutSizeOf(width: number, height: number, insets: EdgeInsets = NO_INSETS) {
  windowOf(width, height);
  const { result } = await renderHook(() => useLayoutSize(), {
    wrapper: insetWrapper(width, height, insets),
  });

  return result.current;
}

async function columnFitOf(spec: ColumnSpec, width: number, height: number, insets: EdgeInsets) {
  windowOf(width, height);
  const { result } = await renderHook(() => useColumnFit(spec), {
    wrapper: insetWrapper(width, height, insets),
  });

  return result.current;
}

function columnsAt(spec: ColumnSpec, usableWidths: readonly number[]) {
  return usableWidths.map((usableWidth) => fitColumns(usableWidth, spec).columns);
}

function spanOf({ columns, columnWidth }: ColumnFit, { gap }: ColumnSpec) {
  return columnWidth * columns + gap * (columns - 1);
}

describe("fitColumns", () => {
  it("should take one more column each time another minimum and its gap fit", () => {
    expect(columnsAt(TILES, [150, 315, 316, 481, 482, 647, 648])).toEqual([1, 1, 2, 2, 3, 3, 4]);
  });

  it("should never fall below one column, however little room is left", () => {
    expect(columnsAt(TILES, [0, 40, 149])).toEqual([1, 1, 1]);
  });

  it("should hand back a negative width as one empty column rather than a negative one", () => {
    expect(fitColumns(-80, TILES)).toEqual({ columns: 1, columnWidth: 0 });
  });

  it("should share the whole width between the columns and the gaps between them", () => {
    const usableWidth = 1043;
    const fit = fitColumns(usableWidth, TILES);

    expect(fit.columns).toBe(6);
    expect(spanOf(fit, TILES)).toBeCloseTo(usableWidth);
  });

  it("should keep every column at or above the minimum it was given", () => {
    for (let usableWidth = 150; usableWidth <= 1400; usableWidth += 1) {
      expect(fitColumns(usableWidth, TILES).columnWidth).toBeGreaterThanOrEqual(TILES.minimum);
    }
  });

  it("should take the spec's side padding off both edges before fitting anything", () => {
    const padded: ColumnSpec = { ...TILES, sidePadding: 20 };

    expect(fitColumns(482 + 40, padded)).toEqual(fitColumns(482, TILES));
  });
});

describe("the grids each site derives", () => {
  const USABLE_WIDTHS = [402, 734, 800, 1032, 1280, 1376];

  it("should widen the catalog to the frame rather than stopping at a reading column", () => {
    expect(columnsAt(CATALOG_COLUMNS, USABLE_WIDTHS)).toEqual([2, 4, 4, 6, 7, 8]);
  });

  it("should give the legend step two columns on a phone and seven on the widest tablet", () => {
    expect(columnsAt(LEGEND_COLUMNS, USABLE_WIDTHS)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it("should keep the champion step single column on a phone and widen it on a tablet", () => {
    expect(columnsAt(CHAMPION_COLUMNS, USABLE_WIDTHS)).toEqual([1, 2, 2, 3, 4, 4]);
  });

  it("should widen the unclamped pool grid all the way to the frame", () => {
    expect(columnsAt(POOL_TILE_COLUMNS, USABLE_WIDTHS)).toEqual([2, 4, 4, 5, 7, 7]);
  });

  it("should let pool rows go multi-column once two of them fit side by side", () => {
    expect(columnsAt(POOL_ROW_COLUMNS, USABLE_WIDTHS)).toEqual([1, 2, 2, 3, 4, 4]);
  });
});

describe("useLayoutSize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should report the whole window when nothing is cut out of it", async () => {
    expect(await layoutSizeOf(1032, 1376)).toEqual({ layoutClass: "tablet", usableWidth: 1032 });
  });

  it("should call every design tablet frame a tablet in both orientations", async () => {
    for (const [width, height] of [
      [1032, 1376],
      [1376, 1032],
      [800, 1280],
      [1280, 800],
    ]) {
      expect((await layoutSizeOf(width, height)).layoutClass).toBe("tablet");
    }
  });

  it("should keep a phone a phone when it is turned on its side", async () => {
    expect(await layoutSizeOf(874, 402)).toEqual({ layoutClass: "phone", usableWidth: 874 });
  });

  it("should hand a window too narrow to split the phone layout", async () => {
    expect((await layoutSizeOf(507, 1024)).layoutClass).toBe("phone");
  });

  it("should take both horizontal insets off the width a component may draw in", async () => {
    expect((await layoutSizeOf(852, 393, LANDSCAPE_CUTOUT)).usableWidth).toBe(734);
  });

  it("should leave the width alone when only the top and bottom are cut out", async () => {
    const { usableWidth } = await layoutSizeOf(402, 874, {
      bottom: 34,
      left: 0,
      right: 0,
      top: 59,
    });

    expect(usableWidth).toBe(402);
  });

  it("should classify by the frame, so an inset never drops a tablet below the threshold", async () => {
    const { layoutClass, usableWidth } = await layoutSizeOf(800, 1280, {
      bottom: 0,
      left: 24,
      right: 24,
      top: 0,
    });

    expect(layoutClass).toBe("tablet");
    expect(usableWidth).toBe(752);
  });

  it("should classify by the frame, so two frames sharing a usable width differ in class", async () => {
    const cutOut = await layoutSizeOf(800, 1280, { bottom: 0, left: 24, right: 24, top: 0 });
    const narrow = await layoutSizeOf(752, 1280);

    expect(cutOut.usableWidth).toBe(narrow.usableWidth);
    expect([cutOut.layoutClass, narrow.layoutClass]).toEqual(["tablet", "phone"]);
  });
});

describe("useColumnFit at phone landscape with a notch cutout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should lay every grid out inside the cutout rather than under it", async () => {
    for (const spec of [CATALOG_COLUMNS, LEGEND_COLUMNS, CHAMPION_COLUMNS, POOL_TILE_COLUMNS]) {
      const fit = await columnFitOf(spec, 852, 393, LANDSCAPE_CUTOUT);

      expect(spanOf(fit, spec) + spec.sidePadding * 2).toBeCloseTo(734);
    }
  });

  it("should give the catalog four columns and the legend step its own three", async () => {
    expect((await columnFitOf(CATALOG_COLUMNS, 852, 393, LANDSCAPE_CUTOUT)).columns).toBe(4);
    expect((await columnFitOf(LEGEND_COLUMNS, 852, 393, LANDSCAPE_CUTOUT)).columns).toBe(3);
  });
});
