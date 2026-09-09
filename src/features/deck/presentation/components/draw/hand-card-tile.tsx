import { Pressable, StyleSheet, View } from "react-native";

import { CardImage } from "@/components/ui/atoms/card-image";
import { DomainBar } from "@/components/ui/atoms/domain-bar";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { Card } from "@/features/catalog/card/card";
import { useTheme } from "@/hooks/use-theme";

function HandCardTile({
  card,
  onOpenCard,
}: {
  readonly card: Card;
  readonly onOpenCard: (card: Card) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={card.name}
      accessibilityRole="button"
      onPress={() => onOpenCard(card)}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.art, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <CardImage contentFit="cover" source={card.imageUrl} style={styles.image} />
        {card.attributes.energy === null ? null : (
          <View style={[styles.cost, { backgroundColor: theme.backgroundSheet }]}>
            <ThemedText type="mono">{`${card.attributes.energy}E`}</ThemedText>
          </View>
        )}
        <DomainBar domainIds={card.domainIds} height={2} />
      </View>
      <ThemedText numberOfLines={2} style={styles.name} themeColor="textSecondary" type="body">
        {card.name}
      </ThemedText>
    </Pressable>
  );
}

export { HandCardTile };

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
  },
  art: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    height: 104,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  cost: {
    borderBottomRightRadius: Radius.small - 2,
    borderTopLeftRadius: Radius.small - 2,
    left: 0,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    position: "absolute",
    top: 0,
  },
  name: {
    marginTop: Spacing.one + 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
