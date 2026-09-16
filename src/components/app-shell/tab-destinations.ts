import type { ViewStyle } from "react-native";

import type { TabGlyphShape } from "@/components/ui/icons/tab-glyph";

interface TabDestination {
  readonly name: string;
  readonly shape: TabGlyphShape;
  readonly title: string;
}

const TAB_DESTINATIONS: readonly TabDestination[] = [
  { name: "index", shape: "square", title: "Cards" },
  { name: "decks", shape: "diamond", title: "Decks" },
  { name: "rules", shape: "circle", title: "Rules" },
  { name: "saved", shape: "pill", title: "Saved" },
];

function railCenteringStyle(at: number): ViewStyle | undefined {
  if (at === 0) return { marginTop: "auto" };

  if (at === TAB_DESTINATIONS.length - 1) return { marginBottom: "auto" };

  return undefined;
}

export { TAB_DESTINATIONS, railCenteringStyle };
export type { TabDestination };
