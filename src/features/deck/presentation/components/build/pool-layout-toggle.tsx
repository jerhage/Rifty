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
    <SegmentedControl>
      <SegmentedOption
        glyph="☰"
        label="List"
        onPress={() => onSelect("list")}
        selected={layout === "list"}
      />
      <SegmentedOption
        glyph="▦"
        label="Cards"
        onPress={() => onSelect("grid")}
        selected={layout === "grid"}
      />
    </SegmentedControl>
  );
}

export { PoolLayoutToggle };
