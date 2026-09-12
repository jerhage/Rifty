import { Image, type ImageContentFit, type ImageProps } from "expo-image";
import { useState } from "react";
import { StyleSheet, type StyleProp, type ImageStyle } from "react-native";
import { match } from "ts-pattern";

import { Skeleton } from "@/components/ui/atoms/skeleton";

const TRANSITION_MS = 150;

/** The text alternative for an image: a name a screen reader announces, or nothing at all. */
type ImageAlternative =
  | { readonly type: "described"; readonly label: string }
  | { readonly type: "decorative" };

type ImageAccessibility = Pick<
  ImageProps,
  | "accessibilityElementsHidden"
  | "accessibilityLabel"
  | "accessibilityRole"
  | "accessible"
  | "importantForAccessibility"
>;

function CardImage({
  alternative,
  contentFit,
  source,
  style,
}: {
  readonly alternative: ImageAlternative;
  readonly contentFit: ImageContentFit;
  readonly source: string;
  readonly style: StyleProp<ImageStyle>;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const accessibility = match(alternative)
    .returnType<ImageAccessibility>()
    .with({ type: "described" }, ({ label }) => ({
      accessibilityLabel: label,
      accessibilityRole: "image",
      accessible: true,
    }))
    .with({ type: "decorative" }, () => ({
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    }))
    .exhaustive();

  return (
    <>
      <Image
        {...accessibility}
        contentFit={contentFit}
        onError={() => setIsLoaded(false)}
        onLoad={() => setIsLoaded(true)}
        source={source}
        style={style}
        transition={TRANSITION_MS}
      />
      {isLoaded ? null : <Skeleton style={StyleSheet.absoluteFill} />}
    </>
  );
}

export { CardImage };
export type { ImageAlternative };
