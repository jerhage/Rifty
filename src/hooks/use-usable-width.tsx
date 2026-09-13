import { createContext, useContext, type PropsWithChildren } from "react";

const UsableWidthContext = createContext<number | null>(null);

/** Narrows the width everything below may draw in, for a subtree that sits beside a rail or a pane. */
function UsableWidthProvider({ children, width }: PropsWithChildren<{ readonly width: number }>) {
  return <UsableWidthContext.Provider value={width}>{children}</UsableWidthContext.Provider>;
}

function useUsableWidth(windowWidth: number): number {
  return useContext(UsableWidthContext) ?? windowWidth;
}

export { UsableWidthProvider, useUsableWidth };
