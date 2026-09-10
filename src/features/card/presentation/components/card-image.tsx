import { Image, type ImageContentFit } from "expo-image";
import { useState } from "react";
import { StyleSheet, type StyleProp, type ImageStyle } from "react-native";

import { Skeleton } from "@/components/ui/atoms/skeleton";

const TRANSITION_MS = 150;

function CardImage({
  contentFit,
  source,
  style,
}: {
  readonly contentFit: ImageContentFit;
  readonly source: string;
  readonly style: StyleProp<ImageStyle>;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <Image
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
