import { Image, useImage } from "expo-image";
import { StyleSheet } from "react-native";

import { CardSummaryCard } from "@/components/ui/card-summary-card";
import { FlippableCard } from "@/components/ui/flippable-card";
import type { Card } from "@/features/catalog/card/card";

function CardFlipCard({ card }: { readonly card: Card }) {
  const image = useImage(card.imageUrl, {
    maxHeight: 1_440,
    maxWidth: 1_024,
  });

  if (!image) return null;

  const aspectRatio = image.width / image.height;

  return (
    <FlippableCard
      back={<CardSummaryCard aspectRatio={aspectRatio} card={card} />}
      front={<CardImage aspectRatio={aspectRatio} card={card} image={image} />}
      showBackAccessibilityLabel="Show card summary"
      showFrontAccessibilityLabel="Show card image"
    />
  );
}

function CardImage({
  aspectRatio,
  card,
  image,
}: {
  readonly aspectRatio: number;
  readonly card: Card;
  readonly image: NonNullable<ReturnType<typeof useImage>>;
}) {
  return (
    <Image
      accessible
      accessibilityLabel={`${card.name} card image`}
      contentFit="contain"
      source={image}
      style={[styles.image, { aspectRatio }]}
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
  },
});

export { CardFlipCard };
