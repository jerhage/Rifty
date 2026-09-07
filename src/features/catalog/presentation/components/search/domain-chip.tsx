import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";

/** The dot keeps its domain color when unselected, so the chip itself stays neutral. */
function DomainChip({
  dotColor,
  label,
  onPress,
  selected,
}: {
  readonly dotColor: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  return (
    <Chip
      adornment={<ColorDot color={dotColor} />}
      label={label}
      labelType="body"
      onPress={onPress}
      selected={selected}
      tone="neutral"
    />
  );
}

export { DomainChip };
