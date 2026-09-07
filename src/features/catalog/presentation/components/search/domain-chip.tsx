import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";

/**
 * A domain filter chip. The dot keeps its domain color whether or not the chip is on, so the chip
 * itself stays neutral rather than fighting it.
 */
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
