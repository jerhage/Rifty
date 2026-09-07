import { Chip } from "@/components/ui/atoms/chip";

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
