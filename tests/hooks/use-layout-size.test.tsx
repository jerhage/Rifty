import { renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { CATALOG_COLUMNS } from "@/features/catalog/presentation/components/grid/card-summary-grid";
import {
  POOL_ROW_COLUMNS,
  POOL_TILE_COLUMNS,
} from "@/features/deck/presentation/components/build/zone-pool-list";
import { CHAMPION_COLUMNS } from "@/features/deck/presentation/components/build/steps/champion-step";
import { LEGEND_COLUMNS } from "@/features/deck/presentation/components/build/steps/legend-step";
import { fitColumns, useLayoutSize, type ColumnSpec } from "@/hooks/use-layout-size";

const TILES: ColumnSpec = { gap: 16, minimum: 150 };

function windowOf(width: number, height: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);
}

function columnsAt(spec: ColumnSpec, widths: readonly number[]) {
  return widths.map((available) => fitColumns(available, spec).columns);
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
    const available = 1043;
    const { columns, columnWidth } = fitColumns(available, TILES);

    expect(columns).toBe(6);
    expect(columnWidth * columns + TILES.gap * (columns - 1)).toBeCloseTo(available);
  });

  it("should keep every column at or above the minimum it was given", () => {
    for (let available = 150; available <= 1400; available += 1) {
      expect(fitColumns(available, TILES).columnWidth).toBeGreaterThanOrEqual(TILES.minimum);
    }
  });
});

describe("the grids each site derives", () => {
  it("should give the catalog two columns on a phone and four once the content clamp is reached", () => {
    expect(columnsAt(CATALOG_COLUMNS, [370, 650, 768])).toEqual([2, 4, 4]);
  });

  it("should give the legend step two columns on a phone rather than one wide tile", () => {
    expect(columnsAt(LEGEND_COLUMNS, [370, 768])).toEqual([2, 4]);
  });

  it("should keep the champion step single column on a phone and pair it up when clamped", () => {
    expect(columnsAt(CHAMPION_COLUMNS, [370, 768])).toEqual([1, 2]);
  });

  it("should widen the unclamped pool grid all the way to the frame", () => {
    expect(columnsAt(POOL_TILE_COLUMNS, [370, 768, 1000, 1248, 1344])).toEqual([2, 4, 5, 7, 7]);
  });

  it("should let pool rows go multi-column once two of them fit side by side", () => {
    expect(columnsAt(POOL_ROW_COLUMNS, [370, 768, 1000, 1248, 1344])).toEqual([1, 2, 3, 4, 4]);
  });
});

describe("useLayoutSize", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should report the window width the grids measure against", async () => {
    windowOf(1032, 1376);
    const { result } = await renderHook(() => useLayoutSize());

    expect(result.current.width).toBe(1032);
  });

  it("should call every design tablet frame a tablet in both orientations", async () => {
    for (const [width, height] of [
      [1032, 1376],
      [1376, 1032],
      [800, 1280],
      [1280, 800],
    ]) {
      windowOf(width, height);
      const { result } = await renderHook(() => useLayoutSize());

      expect(result.current.layoutClass).toBe("tablet");
    }
  });

  it("should keep a phone a phone when it is turned on its side", async () => {
    windowOf(874, 402);
    const { result } = await renderHook(() => useLayoutSize());

    expect(result.current).toEqual({ layoutClass: "phone", width: 874 });
  });

  it("should hand a window too narrow to split the phone layout", async () => {
    windowOf(507, 1024);
    const { result } = await renderHook(() => useLayoutSize());

    expect(result.current.layoutClass).toBe("phone");
  });
});
