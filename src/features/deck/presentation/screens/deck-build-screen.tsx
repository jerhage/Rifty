import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { match } from "ts-pattern";

import { PrimaryButton } from "@/components/ui/atoms/primary-button";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Radius, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import type { DeckVerification } from "@/features/deck/deck/deck";
import { zoneRules } from "@/features/deck/deck/deck-legality";
import { useTheme } from "@/hooks/use-theme";

import { BuildProgressHeader } from "../components/build/build-progress-header";
import { CardPickGrid } from "../components/build/card-pick-grid";
import { DeckCheckList } from "../components/build/deck-check-list";
import { ZoneProgressRow } from "../components/build/zone-progress-row";
import type { DeckBuildDraft, DeckBuildStep } from "../deck-build-steps";

interface DeckBuildScreenProps {
  readonly champions: readonly CardSummary[];
  readonly draft: DeckBuildDraft;
  readonly error: string | null;
  readonly isLastStep: boolean;
  readonly isSaving: boolean;
  readonly legends: readonly CardSummary[];
  readonly onBack: () => void;
  readonly onChangeName: (name: string) => void;
  readonly onNext: () => void;
  readonly onPickChampion: (card: CardSummary) => void;
  readonly onPickLegend: (card: CardSummary) => void;
  readonly onSave: () => void;
  readonly step: DeckBuildStep;
  readonly stepIndex: number;
  readonly verification: DeckVerification;
}

function DeckBuildScreen({
  champions,
  draft,
  error,
  isLastStep,
  isSaving,
  legends,
  onBack,
  onChangeName,
  onNext,
  onPickChampion,
  onPickLegend,
  onSave,
  step,
  stepIndex,
  verification,
}: DeckBuildScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <BuildProgressHeader onBack={onBack} stepIndex={stepIndex} />

      <View style={styles.intro}>
        <ThemedText type="display" style={styles.title}>
          {step.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" type="body" style={styles.blurb}>
          {step.blurb}
        </ThemedText>
      </View>

      {match(step.id)
        .with("legend", () => (
          <CardPickGrid
            cards={legends}
            onPick={onPickLegend}
            selectedId={draft.legend?.id ?? null}
          />
        ))
        .with("chosenChampion", () => (
          <CardPickGrid
            cards={champions}
            onPick={onPickChampion}
            selectedId={draft.chosenChampion?.id ?? null}
          />
        ))
        .with("zones", () => (
          <ScrollView contentContainerStyle={styles.zones}>
            <TextInput
              accessibilityLabel="Deck name"
              autoCapitalize="words"
              onChangeText={onChangeName}
              placeholder="Deck name"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.nameInput,
                { backgroundColor: theme.fill, borderColor: theme.border, color: theme.text },
              ]}
              value={draft.name}
            />
            <PickSummary draft={draft} />
            {zoneRules.map((rule) => (
              <ZoneProgressRow count={0} key={rule.section} rule={rule} />
            ))}
            <ThemedText themeColor="textTertiary" type="mono" style={styles.checkHeading}>
              Deck check
            </ThemedText>
            <DeckCheckList verification={verification} />
          </ScrollView>
        ))
        .exhaustive()}

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        {error === null ? null : (
          <ThemedText themeColor="negative" type="body">
            {error}
          </ThemedText>
        )}
        {isLastStep ? (
          <PrimaryButton label={isSaving ? "Saving…" : "Save deck"} onPress={onSave} />
        ) : (
          <PrimaryButton label="Continue" onPress={onNext} />
        )}
      </View>
    </ThemedView>
  );
}

function PickSummary({ draft }: { readonly draft: DeckBuildDraft }) {
  const theme = useTheme();
  const picks = [
    { label: "Legend", value: draft.legend?.name ?? "Not picked" },
    { label: "Chosen Champion", value: draft.chosenChampion?.name ?? "Not picked" },
  ];

  return (
    <View style={styles.picks}>
      {picks.map((pick) => (
        <View
          key={pick.label}
          style={[styles.pick, { backgroundColor: theme.fill, borderColor: theme.border }]}
        >
          <ThemedText themeColor="textTertiary" type="mono">
            {pick.label}
          </ThemedText>
          <ThemedText numberOfLines={1} type="small" style={styles.pickValue}>
            {pick.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export { DeckBuildScreen };
export type { DeckBuildScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  intro: {
    alignSelf: "center",
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  title: {
    fontSize: 23,
    lineHeight: 27,
  },
  blurb: {
    marginTop: Spacing.one + 1,
  },
  zones: {
    gap: Spacing.two + 2,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  nameInput: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.three - 4,
  },
  picks: {
    flexDirection: "row",
    gap: Spacing.two + 2,
  },
  pick: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    padding: Spacing.three - 4,
  },
  pickValue: {
    marginTop: Spacing.one,
  },
  checkHeading: {
    marginTop: Spacing.two,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two + 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
});
