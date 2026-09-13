import { useWindowDimensions } from "react-native";

import { MinTabletWidth } from "@/constants/theme";

type LayoutClass = "phone" | "tablet";

interface LayoutSize {
  readonly layoutClass: LayoutClass;
  readonly width: number;
}

interface ColumnSpec {
  readonly gap: number;
  readonly minimum: number;
}

interface ColumnFit {
  readonly columns: number;
  readonly columnWidth: number;
}

function useLayoutSize(): LayoutSize {
  const { height, width } = useWindowDimensions();

  return {
    layoutClass: Math.min(width, height) >= MinTabletWidth ? "tablet" : "phone",
    width,
  };
}

function fitColumns(available: number, { gap, minimum }: ColumnSpec): ColumnFit {
  const columns = Math.max(1, Math.floor((available + gap) / (minimum + gap)));

  return {
    columns,
    columnWidth: Math.max(0, (available - gap * (columns - 1)) / columns),
  };
}

export { fitColumns, useLayoutSize };
export type { ColumnFit, ColumnSpec, LayoutClass, LayoutSize };
