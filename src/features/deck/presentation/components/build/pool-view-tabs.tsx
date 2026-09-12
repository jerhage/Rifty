import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";

import type { ZonePoolView } from "../../deck-zone-pool";

function PoolViewTabs({
  deckCount,
  onSelect,
  view,
}: {
  readonly deckCount: number;
  readonly onSelect: (view: ZonePoolView) => void;
  readonly view: ZonePoolView;
}) {
  return (
    <SegmentedControl size="compact">
      <SegmentedOption
        label="Pool"
        onPress={() => onSelect("pool")}
        role="tab"
        selected={view === "pool"}
        size="compact"
      />
      <SegmentedOption
        accessibilityLabel={`In deck, ${deckCount}`}
        label={`In deck · ${deckCount}`}
        onPress={() => onSelect("inDeck")}
        role="tab"
        selected={view === "inDeck"}
        size="compact"
      />
      <SegmentedOption
        label="Roles"
        onPress={() => onSelect("roles")}
        role="tab"
        selected={view === "roles"}
        size="compact"
      />
    </SegmentedControl>
  );
}

export { PoolViewTabs };
