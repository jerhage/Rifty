import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { AttributeCurve } from "@/features/analysis/presentation/components/attribute-curve";
import { KeywordTally } from "@/features/analysis/presentation/components/keyword-tally";
import { SpeedMix } from "@/features/analysis/presentation/components/speed-mix";
import type { ResolvedDeckEntry } from "@/features/deck/deck/resolved-deck";

import { deckAnalysis } from "../../deck-analysis-format";

function DeckAnalysisPanels({ entries }: { readonly entries: readonly ResolvedDeckEntry[] }) {
  const { abilityCards, energyBuckets, keywords, speeds } = deckAnalysis(entries);

  return (
    <View style={styles.panels}>
      <AttributeCurve buckets={energyBuckets} title="Energy curve" />
      <SpeedMix cardCount={abilityCards} speeds={speeds} />
      <KeywordTally cardCount={abilityCards} mix={keywords} />
    </View>
  );
}

export { DeckAnalysisPanels };

const styles = StyleSheet.create({
  panels: {
    gap: Spacing.two + 2,
    marginTop: Spacing.three,
  },
});
