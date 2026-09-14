import { useImage } from "expo-image";
import { StyleSheet } from "react-native";

import { Skeleton } from "@/components/ui/atoms/skeleton";
import type { CardOrientation } from "@/features/card/card";
import type { CardDomain } from "@/features/card/value-objects/card-domain";

import { CardArt } from "./card-art";
import { DomainBar } from "./domain-bar";

/**
 * Note to future self: these are for specifying how large of an image we allow the image library to
 * shrink before putting into memory. Actual size of the card happens in card-hero.tsx for example.
 */
function CardFace({
  domainIds,
  imageUrl,
  orientation,
  width,
}: {
  readonly domainIds: readonly CardDomain[];
  readonly imageUrl: string;
  readonly orientation: CardOrientation;
  readonly width: number | null;
}) {
  const image = useImage(imageUrl, {
    maxHeight: 720,
    maxWidth: 512,
    // TODO: send this to Sentry once error reporting is wired up.
    onError: () => undefined,
  });

  return (
    <>
      {image ? (
        <CardArt image={image} isLandscape={orientation === "landscape"} width={width} />
      ) : (
        <Skeleton style={StyleSheet.absoluteFill} />
      )}
      <DomainBar domainIds={domainIds} />
    </>
  );
}

export { CardFace };
