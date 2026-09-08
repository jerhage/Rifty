import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Spacing } from "@/constants/theme";

import type { DeckBuildStep } from "../../../deck-build-steps";

function StepIntro({ step }: { readonly step: DeckBuildStep }) {
  return (
    <View style={styles.intro}>
      <ThemedText type="display" style={styles.title}>
        {step.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="body" style={styles.blurb}>
        {step.blurb}
      </ThemedText>
    </View>
  );
}

export { StepIntro };

const styles = StyleSheet.create({
  intro: {
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 23,
    lineHeight: 27,
  },
  blurb: {
    marginTop: Spacing.one + 1,
  },
});
