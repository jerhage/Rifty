import { Image, type useImage } from "expo-image";
import { StyleSheet, View } from "react-native";

/**
 * Most Riftbound printings are portrait, so every tile reserves that shape and rows stay aligned.
 * Battlefields print landscape: their face is laid out transposed and then turned a quarter turn,
 * so its painted footprint is exactly the portrait frame — the way they are read at the table.
 *
 * Before the grid has measured itself there is no width to transpose against, so the art renders
 * upright for that first pass.
 */
const CARD_ASPECT_RATIO = 5 / 7;

function CardArt({
  image,
  isLandscape,
  width,
}: {
  readonly image: NonNullable<ReturnType<typeof useImage>>;
  readonly isLandscape: boolean;
  readonly width: number | null;
}) {
  if (!isLandscape || width === null) {
    return (
      <Image
        accessibilityElementsHidden
        contentFit="contain"
        importantForAccessibility="no-hide-descendants"
        source={image}
        style={styles.upright}
        transition={150}
      />
    );
  }

  return (
    <View style={styles.rotatedFrame}>
      <Image
        accessibilityElementsHidden
        contentFit="contain"
        importantForAccessibility="no-hide-descendants"
        source={image}
        style={{
          height: width,
          transform: [{ rotate: "90deg" }],
          width: width / CARD_ASPECT_RATIO,
        }}
        transition={150}
      />
    </View>
  );
}

export { CARD_ASPECT_RATIO, CardArt };

const styles = StyleSheet.create({
  upright: {
    height: "100%",
    width: "100%",
  },
  rotatedFrame: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
