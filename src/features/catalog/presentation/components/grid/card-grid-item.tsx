import { useImage } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Radius, Spacing } from "@/constants/theme";
import type { CardSummary } from "@/features/catalog/card/card-summary";
import { useTheme } from "@/hooks/use-theme";

import { CARD_ASPECT_RATIO, CardArt } from "./card-art";
import { DomainBar } from "@/components/ui/atoms/domain-bar";

/** One card in the catalog grid: its face in a fixed frame, with the name beneath. */
function CardGridItem({
  card,
  onPress,
  width,
}: {
  readonly card: CardSummary;
  readonly onPress: (id: string) => void;
  readonly width: number | null;
}) {
  const theme = useTheme();
  const image = useImage(card.imageUrl, { maxHeight: 720, maxWidth: 512 });

  return (
    <Pressable
      accessibilityLabel={`Open ${card.name}`}
      accessibilityRole="button"
      onPress={() => onPress(card.id)}
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
        {image ? (
          <CardArt image={image} isLandscape={card.orientation === "landscape"} width={width} />
        ) : (
          <Skeleton style={StyleSheet.absoluteFill} />
        )}
        <DomainBar domainIds={card.domainIds} />
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
