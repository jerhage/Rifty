import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { SearchGlyph } from "@/components/ui/icons/search-glyph";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function SearchField({
  accessibilityLabel,
  hint,
  onChangeQuery,
  query,
  style,
}: {
  readonly accessibilityLabel?: string;
  readonly hint: string;
  readonly onChangeQuery: (query: string) => void;
  readonly query: string;
  readonly style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.field, { backgroundColor: theme.fill, borderColor: theme.border }, style]}>
      <SearchGlyph color={theme.textSecondary} />
      <TextInput
        accessibilityLabel={accessibilityLabel ?? hint}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeQuery}
        placeholder={hint}
        placeholderTextColor={theme.textTertiary}
        style={[styles.input, { color: theme.text }]}
        value={query}
      />
      {query.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={() => onChangeQuery("")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ThemedText themeColor="textSecondary" type="mono">
            Clr
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export { SearchField };

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 1,
    height: 38,
    minWidth: 0,
    paddingHorizontal: Spacing.three - 5,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    minWidth: 0,
    padding: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
