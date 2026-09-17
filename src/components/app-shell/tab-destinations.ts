import type { ViewStyle } from "react-native";

import type { TabIdentity } from "@/components/ui/icons/tab-glyph";

interface TabDestination {
  readonly identity: TabIdentity;
  readonly name: string;
  readonly title: string;
}

const TAB_DESTINATIONS: readonly TabDestination[] = [
  { identity: "cards", name: "index", title: "Cards" },
  { identity: "decks", name: "decks", title: "Decks" },
  { identity: "rules", name: "rules", title: "Rules" },
  { identity: "saved", name: "saved", title: "Saved" },
];

function railCenteringStyle(at: number): ViewStyle | undefined {
  if (at === 0) return { marginTop: "auto" };

  if (at === TAB_DESTINATIONS.length - 1) return { marginBottom: "auto" };

  return undefined;
}

export { TAB_DESTINATIONS, railCenteringStyle };
export type { TabDestination };
