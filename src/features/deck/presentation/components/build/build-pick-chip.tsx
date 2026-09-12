import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { domainAccent } from "@/features/card/presentation/card-taxonomy-format";
import { DomainMarks } from "@/features/card/presentation/components/domain-mark";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

function BuildPickChip({
  card,
  label,
  onEdit,
}: {
  readonly card: Card | null;
  readonly label: string;
  readonly onEdit: () => void;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const domains = card?.domainIds ?? [];
  const accent = card === null ? theme.borderStrong : domainAccent(card, domainColors);

  return (
    <Pressable
      accessibilityLabel={card ? `${label}: ${card.name}. Change` : `Pick a ${label}`}
      accessibilityRole="button"
      onPress={onEdit}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: card ? theme.backgroundElement : theme.fill,
          borderColor: card ? accent : theme.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <View style={styles.labelRow}>
          <ThemedText themeColor="textTertiary" type="mono">
            {label}
          </ThemedText>
          <DomainMarks domainIds={domains} />
        </View>
        <ThemedText themeColor={card ? "text" : "textSecondary"} style={styles.name}>
          {card?.name ?? "Not picked"}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export { BuildPickChip };

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 132,
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one + 1,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 11.5,
    fontWeight: 500,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
