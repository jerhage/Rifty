import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing, TouchTarget } from "@/constants/theme";
import type { ZoneSection } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

import { zoneCounts, type DeckBuildStepId } from "../../../deck-build-steps";
import { completenessLabel, legalityColor } from "../../../deck-legality-format";
import type { ZoneDraftViewState } from "../../../hooks/use-deck-build";
import { BuildPickChip } from "../build-pick-chip";
import { ZoneSelector } from "../zone-selector";

function DeckDraftControls({
  draft: { draft, verification },
  onChangeName,
  onEditStep,
  onSelectZone,
  zone,
}: {
  readonly draft: ZoneDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onSelectZone: (section: ZoneSection) => void;
  readonly zone: ZoneSection;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={{
        paddingLeft: insets.left + Spacing.three,
        paddingRight: insets.right + Spacing.three,
      }}
    >
      <View style={styles.nameRow}>
        <TextInput
          accessibilityLabel="Deck name"
          autoCapitalize="words"
          onChangeText={onChangeName}
          placeholder="Deck name"
          placeholderTextColor={theme.textTertiary}
          style={[styles.nameInput, { color: theme.text }]}
          value={draft.name}
        />
        <ThemedText
          style={[styles.completeness, { color: legalityColor(verification, theme) }]}
          type="mono"
        >
          {completenessLabel(verification)}
        </ThemedText>
      </View>

      <View style={styles.chips}>
        <BuildPickChip card={draft.legend} label="Legend" onEdit={() => onEditStep("legend")} />
        <BuildPickChip
          card={draft.chosenChampion}
          label="Champion"
          onEdit={() => onEditStep("chosenChampion")}
        />
      </View>

      <View style={styles.zones}>
        <ZoneSelector counts={zoneCounts(draft)} onSelect={onSelectZone} selected={zone} />
      </View>
    </View>
  );
}

export { DeckDraftControls };

const styles = StyleSheet.create({
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two + 2,
  },
  nameInput: {
    flexBasis: 160,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 21,
    fontWeight: 700,
    letterSpacing: -0.4,
    minHeight: TouchTarget.minimum,
    minWidth: 0,
    padding: 0,
    textAlignVertical: "center",
  },
  completeness: {
    flexShrink: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  zones: {
    marginTop: Spacing.three - 5,
  },
});
