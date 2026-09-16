import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { MaxReadingWidth, Spacing } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useDomainColors } from "@/hooks/use-theme";

import { domainAccent } from "../card-taxonomy-format";
import { CardAttributeRow } from "../components/detail/card-attribute-row";
import { CardClassificationLine } from "../components/detail/card-classification-line";
import { CardHero } from "../components/detail/card-hero";
import { CardKeywordRow } from "../components/detail/card-keyword-row";
import { CardRulesPanel } from "../components/detail/card-rules-panel";
import { CardSpeedRow } from "../components/detail/card-speed-row";
import { CardTagLine } from "../components/detail/card-tag-line";

interface CardDetailScreenProps {
  readonly bookmarkControl: ReactNode;
  readonly card: Card;
}

function CardDetailScreen({ bookmarkControl, card }: CardDetailScreenProps) {
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

        <View style={styles.nameRow}>
          <ThemedText accessibilityRole="header" type="display" style={styles.name}>
            {card.name}
          </ThemedText>
          {bookmarkControl}
        </View>

        <CardClassificationLine accent={accent} card={card} />
        <CardTagLine tagIds={card.tagIds} />
        <CardAttributeRow accent={accent} card={card} />
        <CardSpeedRow speeds={card.speeds} />
        <CardKeywordRow keywords={card.keywords} />
        <CardRulesPanel rulesText={card.rulesText} />

        <ThemedText
          accessibilityLabel={`Set ${card.setCode}, card number ${card.collectorNumber}`}
          themeColor="textTertiary"
          type="mono"
          style={styles.print}
        >
          {card.setCode} · #{card.collectorNumber}
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

export { CardDetailScreen };
export type { CardDetailScreenProps };

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  page: {
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: MaxReadingWidth,
    paddingTop: Spacing.three,
    width: "100%",
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.three - 3,
  },
  name: {
    flex: 1,
  },
  print: {
    marginTop: Spacing.three,
  },
});
