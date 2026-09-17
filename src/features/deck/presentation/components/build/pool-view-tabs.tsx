import { match } from "ts-pattern";

import { SegmentedControl, SegmentedOption } from "@/components/ui/atoms/segmented-control";

import type { SectionPoolView } from "../../deck-section-pool";

function PoolViewTabs({
  deckCount,
  onSelect,
  options,
  view,
}: {
  readonly deckCount: number;
  readonly onSelect: (view: SectionPoolView) => void;
  readonly options: readonly SectionPoolView[];
  readonly view: SectionPoolView;
}) {
  return (
    <SegmentedControl size="compact">
      {options.map((option) => (
        <PoolViewTab
          deckCount={deckCount}
          key={option}
          onSelect={onSelect}
          option={option}
          selected={option === view}
        />
      ))}
    </SegmentedControl>
  );
}

function PoolViewTab({
  deckCount,
  onSelect,
  option,
  selected,
}: {
  readonly deckCount: number;
  readonly onSelect: (view: SectionPoolView) => void;
  readonly option: SectionPoolView;
  readonly selected: boolean;
}) {
  const { accessibilityLabel, label } = match<
    SectionPoolView,
    { readonly accessibilityLabel: string; readonly label: string }
  >(option)
    .with("pool", () => ({ accessibilityLabel: "Pool", label: "Pool" }))
    .with("inDeck", () => ({
      accessibilityLabel: `In deck, ${deckCount}`,
      label: `In deck · ${deckCount}`,
    }))
    .with("roles", () => ({ accessibilityLabel: "Roles", label: "Roles" }))
    .exhaustive();

  return (
    <SegmentedOption
      accessibilityLabel={accessibilityLabel}
      content={{ label, type: "label" }}
      onPress={() => onSelect(option)}
      role="tab"
      selected={selected}
      size="compact"
    />
  );
}

export { PoolViewTabs };
