import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { CardImage } from "@/components/ui/atoms/card-image";
import { Radius } from "@/constants/theme";
import type { Card } from "@/features/card/card";
import { useTheme } from "@/hooks/use-theme";

const MaxCardWidth = 420;

/**
 * The card face, shown plain — its own printing already carries the energy, might and domain.
 *
 * The shape sits on the image, not on the frame around it. A percentage width resolves against the
 * width the frame was actually given, while an aspect ratio beside a capped width resolves against
 * the cap — so in a pane narrower than the cap the frame grew taller than the art and showed its own
 * background above and below it.
 */
function CardHero({ card }: { readonly card: Card }) {
  const theme = useTheme();
  const aspectRatio = match(card.orientation)
    .with("portrait", () => 5 / 7)
    .with("landscape", () => 7 / 5)
    .exhaustive();

  return (
    <View
      style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <CardImage
        alternative={{ type: "described", label: `${card.name} card art` }}
        contentFit="contain"
        source={card.imageUrl}
        style={[styles.image, { aspectRatio }]}
      />
    </View>
  );
}

export { CardHero };

const styles = StyleSheet.create({
  hero: {
    alignSelf: "center",
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "100%",
    overflow: "hidden",
    width: MaxCardWidth,
  },
  image: {
    width: "100%",
  },
});
