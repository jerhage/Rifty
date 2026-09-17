import { GridIcon } from "@/components/ui/atoms/grid-icon";
import { RowsIcon } from "@/components/ui/atoms/rows-icon";
import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";

import type { SectionPoolLayout } from "../../deck-section-pool";

function PoolLayoutToggle({
  onSelect,
  poolLayout,
}: {
  readonly onSelect: (poolLayout: SectionPoolLayout) => void;
  readonly poolLayout: SectionPoolLayout;
}) {
  return (
    <SegmentedControl size="compact">
      <SegmentedOption
        content={{ icon: (color) => <RowsIcon color={color} />, label: "List", type: "icon" }}
        onPress={() => onSelect("list")}
        role="radio"
        selected={poolLayout === "list"}
        size="compact"
      />
      <SegmentedOption
        content={{ icon: (color) => <GridIcon color={color} />, label: "Cards", type: "icon" }}
        onPress={() => onSelect("grid")}
        role="radio"
        selected={poolLayout === "grid"}
        size="compact"
      />
    </SegmentedControl>
  );
}

export { PoolLayoutToggle };
