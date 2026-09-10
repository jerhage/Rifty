import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useDomainColors } from "@/hooks/use-theme";

import { domainAccent } from "../card-taxonomy-format";
import { CardAttributeRow } from "../components/detail/card-attribute-row";
import { CardClassificationLine } from "../components/detail/card-classification-line";
import { CardHero } from "../components/detail/card-hero";
import { CardKeywordRow } from "../components/detail/card-keyword-row";
import { CardRulesPanel } from "../components/detail/card-rules-panel";
import { CardSpeedRow } from "../components/detail/card-speed-row";
import { CardTraitLine } from "../components/detail/card-trait-line";

function CardDetailScreen({ card }: { readonly card: Card }) {
  const insets = useSafeAreaInsets();
  const accent = domainAccent(card, useDomainColors());

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          {
            paddingBottom: insets.bottom + Spacing.five,
            paddingLeft: insets.left + Spacing.three,
            paddingRight: insets.right + Spacing.three,
          },
        ]}
      >
        <CardHero card={card} />

        <ThemedText type="display" style={styles.name}>
          {card.name}
        </ThemedText>

        <CardClassificationLine accent={accent} card={card} />
        <CardTraitLine tagIds={card.tagIds} />
        <CardAttributeRow accent={accent} card={card} />
        <CardSpeedRow speeds={card.speeds} />
        <CardKeywordRow keywords={card.keywords} />
        <CardRulesPanel rulesText={card.rulesText} />

        <ThemedText themeColor="textTertiary" type="mono" style={styles.print}>
          {card.setCode} · #{card.collectorNumber}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

export { CardDetailScreen };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.three,
    width: "100%",
  },
  name: {
    marginTop: Spacing.three - 3,
  },
  print: {
    marginTop: Spacing.three,
  },
});
