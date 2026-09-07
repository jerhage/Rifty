import { Chip } from "@/components/ui/atoms/chip";

/** A card-type filter chip: uppercase monospace, filled with the accent color when active. */
function TypeChip({
  label,
  onPress,
  selected,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  return (
    <Chip label={label} labelType="mono" onPress={onPress} selected={selected} tone="accent" />
  );
}

export { TypeChip };
