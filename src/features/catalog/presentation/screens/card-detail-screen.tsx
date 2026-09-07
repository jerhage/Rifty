import { ScrollView, StyleSheet } from "react-native";

import type { Card } from "@/features/catalog/card/card";

import { CardFlipCard } from "../components/card-flip-card";

function CardDetailScreen({ card }: { readonly card: Card }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <CardFlipCard card={card} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 16 },
});

export { CardDetailScreen };
