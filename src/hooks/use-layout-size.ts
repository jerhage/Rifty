import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MinTabletWidth } from "@/constants/theme";

type LayoutClass = "phone" | "tablet";

interface LayoutSize {
  readonly layoutClass: LayoutClass;
  readonly usableWidth: number;
}

interface ColumnSpec {
  readonly gap: number;
  readonly minimum: number;
  readonly sidePadding: number;
}

interface ColumnFit {
  readonly columns: number;
  readonly columnWidth: number;
}

function layoutClassFor(width: number, height: number): LayoutClass {
  return Math.min(width, height) >= MinTabletWidth ? "tablet" : "phone";
}

function useLayoutSize(): LayoutSize {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return {
    layoutClass: layoutClassFor(width, height),
    usableWidth: width - insets.left - insets.right,
  };
}

function fitColumns(usableWidth: number, { gap, minimum, sidePadding }: ColumnSpec): ColumnFit {
  const available = usableWidth - sidePadding * 2;
  const columns = Math.max(1, Math.floor((available + gap) / (minimum + gap)));

  return {
    columns,
    columnWidth: Math.max(0, (available - gap * (columns - 1)) / columns),
  };
}

function useColumnFit(spec: ColumnSpec): ColumnFit {
  return fitColumns(useLayoutSize().usableWidth, spec);
}

export { fitColumns, useColumnFit, useLayoutSize };
export type { ColumnFit, ColumnSpec, LayoutClass, LayoutSize };
