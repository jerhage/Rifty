import type { AccessibilityActionInfo } from "react-native";

/** The action that opens a card where the tap itself already picks it. */
const SHOW_FULL_CARD = "showFullCard";

const SHOW_FULL_CARD_ACTIONS: readonly Readonly<AccessibilityActionInfo>[] = [
  { name: SHOW_FULL_CARD, label: "See full card" },
];

export { SHOW_FULL_CARD, SHOW_FULL_CARD_ACTIONS };
