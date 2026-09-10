import { StyleSheet, View } from "react-native";

import { Chip } from "@/components/ui/atoms/chip";
import { ColorDot } from "@/components/ui/atoms/color-dot";
import { Spacing } from "@/constants/theme";

interface SelectableChip {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

function SelectableChipRow({
  items,
  onToggle,
  selectedIds,
}: {
  readonly items: readonly SelectableChip[];
  readonly onToggle: (id: string) => void;
  readonly selectedIds: readonly string[];
}) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <Chip
          adornment={<ColorDot color={item.color} />}
          key={item.id}
          label={item.name}
          onPress={() => onToggle(item.id)}
          selected={selectedIds.includes(item.id)}
          tone="neutral"
        />
      ))}
    </View>
  );
}

export { SelectableChipRow };
export type { SelectableChip };

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
  },
});
