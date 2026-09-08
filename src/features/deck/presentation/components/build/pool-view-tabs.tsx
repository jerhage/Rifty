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
        selected={view === "pool"}
        size="compact"
      />
      <SegmentedOption
        label={`In deck · ${deckCount}`}
        onPress={() => onSelect("inDeck")}
        selected={view === "inDeck"}
        size="compact"
      />
      <SegmentedOption
        label="Roles"
        onPress={() => onSelect("roles")}
        selected={view === "roles"}
        size="compact"
      />
    </SegmentedControl>
  );
}

export { PoolViewTabs };
