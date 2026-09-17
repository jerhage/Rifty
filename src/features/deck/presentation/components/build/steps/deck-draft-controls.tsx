import { StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing, TouchTarget } from "@/constants/theme";
import type { DeckSection } from "@/features/deck/deck/deck";
import { useTheme } from "@/hooks/use-theme";

import { sectionCounts, type DeckBuildStepId } from "../../../deck-build-steps";
import { legalityColor, legalityLabel } from "../../../deck-legality-format";
import type { SectionDraftViewState } from "../../../hooks/use-deck-build";
import { BuildPickChip } from "../build-pick-chip";
import { SectionSelector } from "../section-selector";

function DeckDraftControls({
  draft: { draft, verification },
  onChangeName,
  onEditStep,
  onSelectSection,
  section,
}: {
  readonly draft: SectionDraftViewState;
  readonly onChangeName: (name: string) => void;
  readonly onEditStep: (id: DeckBuildStepId) => void;
  readonly onSelectSection: (section: DeckSection) => void;
  readonly section: DeckSection;
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
          style={[styles.legality, { color: legalityColor(verification, theme) }]}
          type="mono"
        >
          {legalityLabel(verification)}
        </ThemedText>
      </View>

      <View style={styles.chips}>
        <BuildPickChip label="Legend" onEdit={() => onEditStep("legend")} pick={draft.legend} />
        <BuildPickChip
          label="Chosen Champion"
          onEdit={() => onEditStep("chosenChampion")}
          pick={draft.chosenChampion}
        />
      </View>

      <View style={styles.sections}>
        <SectionSelector
          counts={sectionCounts(draft)}
          onSelect={onSelectSection}
          selected={section}
        />
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
  legality: {
    flexShrink: 1,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
    marginTop: Spacing.two + 1,
  },
  sections: {
    marginTop: Spacing.three - 5,
  },
});
