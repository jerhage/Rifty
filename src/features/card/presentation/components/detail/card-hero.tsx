import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { CardImage } from "@/components/ui/atoms/card-image";
import { Radius } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useTheme } from "@/hooks/use-theme";

/** The card face, shown plain — its own printing already carries the cost, might and domain. */
function CardHero({ card }: { readonly card: Card }) {
  const theme = useTheme();
  const aspectRatio = match(card.orientation)
    .with("portrait", () => 5 / 7)
    .with("landscape", () => 7 / 5)
    .exhaustive();

  return (
    <View
      style={[
        styles.hero,
        { aspectRatio, backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      <CardImage
        alternative={{ type: "described", label: `${card.name} card art` }}
        contentFit="contain"
        source={card.imageUrl}
        style={styles.image}
      />
    </View>
  );
}

export { CardHero };

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    width: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
});
