import { GridIcon } from "@/components/ui/atoms/grid-icon";
import { RowsIcon } from "@/components/ui/atoms/rows-icon";
import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";

import type { ZonePoolLayout } from "../../deck-zone-pool";

function PoolLayoutToggle({
  layout,
  onSelect,
}: {
  readonly layout: ZonePoolLayout;
  readonly onSelect: (layout: ZonePoolLayout) => void;
}) {
  return (
    <SegmentedControl size="compact">
      <SegmentedOption
        icon={(color) => <RowsIcon color={color} />}
        label="List"
        onPress={() => onSelect("list")}
        role="radio"
        selected={layout === "list"}
        size="compact"
      />
      <SegmentedOption
        icon={(color) => <GridIcon color={color} />}
        label="Cards"
        onPress={() => onSelect("grid")}
        role="radio"
        selected={layout === "grid"}
        size="compact"
      />
    </SegmentedControl>
  );
}

export { PoolLayoutToggle };
