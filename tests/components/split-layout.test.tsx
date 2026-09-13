import { render, type RenderResult } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Dimensions, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { secondaryWidthFor, SplitLayout } from "@/components/app-shell/split-layout";
import { RailWidth } from "@/constants/theme";
import { CATALOG_COLUMNS } from "@/features/catalog/presentation/components/grid/card-summary-grid";
import { useColumnFit, useLayoutSize } from "@/hooks/use-layout-size";
import { UsableWidthProvider } from "@/hooks/use-usable-width";

function WidthProbe({ slot }: { readonly slot: string }) {
  return <Text>{`${slot} width ${useLayoutSize().usableWidth}`}</Text>;
}

function ColumnProbe({ slot }: { readonly slot: string }) {
  return <Text>{`${slot} columns ${useColumnFit(CATALOG_COLUMNS).columns}`}</Text>;
}

function behindTheRail(width: number, height: number) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);

  return function RailWrapper({ children }: PropsWithChildren) {
    return (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width, height },
          insets: { bottom: 0, left: 0, right: 0, top: 0 },
        }}
      >
        <UsableWidthProvider width={width - RailWidth}>{children}</UsableWidthProvider>
      </SafeAreaProvider>
    );
  };
}

async function splitAt(width: number, height: number): Promise<RenderResult> {
  return await render(
    <SplitLayout
      primary={
        <>
          <WidthProbe slot="primary" />
          <ColumnProbe slot="primary" />
        </>
      }
      secondary={<WidthProbe slot="secondary" />}
    />,
    { wrapper: behindTheRail(width, height) },
  );
}

describe("secondaryWidthFor", () => {
  it("should take a third of the frame until the cap, and the cap after it", () => {
    const widths = [800, 1032, 1152, 1280, 1376].map(secondaryWidthFor);

    expect(widths[0]).toBeCloseTo(272);
    expect(widths[1]).toBeCloseTo(350.88);
    expect(widths[2]).toBeCloseTo(391.68);
    expect(widths.slice(3)).toEqual([392, 392]);
  });

  it("should measure the share against the whole frame, rail included", () => {
    expect(secondaryWidthFor(1032)).toBeCloseTo(
      secondaryWidthFor(1032 - RailWidth) + RailWidth * 0.34,
    );
  });
});

describe("SplitLayout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render both slots, the wide one first", async () => {
    const split = await splitAt(1376, 1032);
    const [first, second] = split.getAllByText(/ width /).map((node) => node.props.children);

    expect(first).toBe("primary width 866");
    expect(second).toBe("secondary width 392");
  });

  it("should narrow each slot to the width its own children may draw in", async () => {
    const split = await splitAt(800, 1280);

    expect(split.getByText("primary width 410")).toBeTruthy();
    expect(split.getByText("secondary width 272")).toBeTruthy();
  });

  it.each([
    [1376, 1032, 5],
    [1280, 800, 4],
    [1032, 1376, 3],
    [800, 1280, 2],
  ])(
    "should give the catalog inside the primary %i by %i the design's %i columns",
    async (width, height, columns) => {
      const split = await splitAt(width, height);

      expect(split.getByText(`primary columns ${columns}`)).toBeTruthy();
    },
  );
});
