import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { cardSpeedName, type CardSpeed } from "@/features/catalog/value-objects/card-speed";
import { useSpeedColors } from "@/hooks/use-theme";

import { DetailPill } from "./detail-pill";

function CardSpeedRow({ speeds }: { readonly speeds: readonly CardSpeed[] }) {
  const speedColors = useSpeedColors();

  if (speeds.length === 0) return null;

  return (
    <View style={styles.row}>
      {speeds.map((speed) => (
        <DetailPill
          key={speed}
          color={speedColors[speed]}
          label={cardSpeedName(speed)}
          markerShape="diamond"
        />
      ))}
    </View>
  );
}

export { CardSpeedRow };

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two - 1,
    marginTop: Spacing.three - 5,
  },
});
