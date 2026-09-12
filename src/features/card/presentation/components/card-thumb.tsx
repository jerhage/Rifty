import type { ImageContentFit } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { CardImage } from "@/components/ui/atoms/card-image";
import type { Card } from "@/features/card/card";
import { useTheme } from "@/hooks/use-theme";

function CardThumb({
  card,
  contentFit,
  style,
}: {
  readonly card: Card;
  readonly contentFit: ImageContentFit;
  readonly style: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.thumb, { backgroundColor: theme.background }, style]}>
      <CardImage
        alternative={{ type: "decorative" }}
        contentFit={contentFit}
        source={card.imageUrl}
        style={styles.image}
      />
    </View>
  );
}

export { CardThumb };

const styles = StyleSheet.create({
  thumb: {
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
});
