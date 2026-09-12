import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { ZONE_RULES, type ZoneSection } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

function ZoneSelector({
  counts,
  onSelect,
  selected,
}: {
  readonly counts: Readonly<Record<string, number>>;
  readonly onSelect: (section: ZoneSection) => void;
  readonly selected: ZoneSection;
}) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {ZONE_RULES.map((rule) => {
        const count = counts[rule.section] ?? 0;
        const isComplete = count === rule.requiredCount;
        const isSelected = rule.section === selected;

        return (
          <Pressable
            accessibilityLabel={`${rule.label}, ${count} of ${rule.requiredCount}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={rule.section}
            onPress={() => onSelect(rule.section)}
            style={({ pressed }) => [
              styles.zone,
              {
                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: isSelected ? theme.accent : theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText themeColor={isSelected ? "text" : "textTertiary"} type="mono">
              {rule.label}
            </ThemedText>
            <View style={styles.measures}>
              <View style={styles.countRow}>
                <ThemedText
                  style={[styles.count, { color: isComplete ? theme.positive : theme.text }]}
                  type="monoValue"
                >
                  {count}
                </ThemedText>
                <ThemedText themeColor="textTertiary" type="mono">
                  /{rule.requiredCount}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.fill }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: isComplete ? theme.positive : theme.accent,
                      width: `${Math.min(100, (count / rule.requiredCount) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export { ZoneSelector };

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.two - 2,
  },
  zone: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two - 1,
  },
  measures: {
    marginTop: "auto",
    paddingTop: Spacing.one + 1,
  },
  countRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 3,
  },
  count: {
    fontSize: 15,
  },
  track: {
    borderRadius: 2,
    height: 3,
    marginTop: Spacing.two - 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  pressed: {
    opacity: 0.7,
  },
});
