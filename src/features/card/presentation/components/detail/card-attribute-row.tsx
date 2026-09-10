import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useTheme } from "@/hooks/use-theme";

/** A Spell has no might and a Battlefield no energy, so absent attributes are dropped. */
function CardAttributeRow({ accent, card }: { readonly accent: string; readonly card: Card }) {
  const theme = useTheme();
  const attributes = [
    { color: accent, label: "Energy", value: card.attributes.energy },
    { color: theme.text, label: "Might", value: card.attributes.might },
    { color: theme.text, label: "Power", value: card.attributes.power },
  ].filter((attribute) => attribute.value !== null);

  if (attributes.length === 0) return null;

  return (
    <View style={styles.row}>
      {attributes.map(({ color, label, value }) => (
        <View
          key={label}
          style={[
            styles.tile,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <ThemedText themeColor="textTertiary" type="mono">
            {label}
          </ThemedText>
          <ThemedText style={[styles.value, { color }]} type="monoValue">
            {value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export { CardAttributeRow };

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.two + 2,
    marginTop: Spacing.three - 3,
  },
  tile: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
  },
  value: {
    fontSize: 20,
    lineHeight: 24,
  },
});
