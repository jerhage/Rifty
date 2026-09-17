import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, type Theme, type ThemeColor } from "@/constants/theme";
import {
  domainAccent,
  type DomainPalette,
} from "@/features/card/presentation/card-taxonomy-format";
import { DomainMarks } from "@/features/card/presentation/components/domain-mark";
import type { CardDomain } from "@/features/card/value-objects/card-domain";
import { useDomainColors, useTheme } from "@/hooks/use-theme";

import type { DeckBuildPick } from "../../deck-build-steps";

interface PickAppearance {
  readonly accessibilityLabel: string;
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly domainIds: readonly CardDomain[];
  readonly name: string;
  readonly nameColor: ThemeColor;
}

function BuildPickChip({
  label,
  onEdit,
  pick,
}: {
  readonly label: string;
  readonly onEdit: () => void;
  readonly pick: DeckBuildPick;
}) {
  const theme = useTheme();
  const domainColors = useDomainColors();
  const { accessibilityLabel, backgroundColor, borderColor, domainIds, name, nameColor } =
    pickAppearance(pick, label, theme, domainColors);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onEdit}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <View style={styles.labelRow}>
          <ThemedText themeColor="textTertiary" type="mono">
            {label}
          </ThemedText>
          <DomainMarks domainIds={domainIds} />
        </View>
        <ThemedText numberOfLines={1} style={styles.name} themeColor={nameColor}>
          {name}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function pickAppearance(
  pick: DeckBuildPick,
  label: string,
  theme: Theme,
  domainColors: DomainPalette,
): PickAppearance {
  return match(pick)
    .with({ type: "notPicked" }, (): PickAppearance => ({
      accessibilityLabel: `Pick a ${label}`,
      backgroundColor: theme.fill,
      borderColor: theme.border,
      domainIds: [],
      name: "Not picked",
      nameColor: "textSecondary",
    }))
    .with({ type: "picked" }, ({ card }): PickAppearance => ({
      accessibilityLabel: `${label}: ${card.cardId}. Change`,
      backgroundColor: theme.backgroundElement,
      borderColor: domainAccent(card, domainColors),
      domainIds: card.domainIds,
      name: card.cardId,
      nameColor: "text",
    }))
    .exhaustive();
}

export { BuildPickChip };

const styles = StyleSheet.create({
  chip: {
    alignItems: "flex-start",
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
