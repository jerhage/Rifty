import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/card/card-summary";
import type { PrintingId } from "@/features/card/value-objects/printing-id";
import { cardDomainNames } from "@/features/card/presentation/card-taxonomy-format";
import { CARD_ASPECT_RATIO } from "@/features/card/presentation/components/card-art";
import { CardFace } from "@/features/card/presentation/components/card-face";
import { useTheme } from "@/hooks/use-theme";

/** One card in the catalog grid: its face in a fixed frame, with the name beneath. */
function CardGridItem({
  card,
  onPress,
  width,
}: {
  readonly card: CardSummary;
  readonly onPress: (id: PrintingId) => void;
  readonly width: number | null;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={[card.name, ...cardDomainNames(card.domainIds)].join(", ")}
      accessibilityRole="button"
      onPress={() => onPress(card.printingId)}
      style={({ pressed }) => [
        styles.card,
        width === null ? undefined : { flexBasis: width, flexShrink: 0, width },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.frame,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      >
        <CardFace
          domainIds={card.domainIds}
          imageUrl={card.imageUrl}
          orientation={card.orientation}
          width={width}
        />
      </View>
      <ThemedText numberOfLines={2} type="body" style={styles.name}>
        {card.name}
      </ThemedText>
    </Pressable>
  );
}

export { CardGridItem };

const styles = StyleSheet.create({
  card: {
    flexBasis: "50%",
    flexGrow: 0,
    flexShrink: 1,
  },
  frame: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    width: "100%",
  },
  name: {
    fontWeight: 500,
    marginTop: Spacing.two - 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
