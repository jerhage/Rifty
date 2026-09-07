import { StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import {
  minimumValue,
  setMinimum,
  type CatalogQueryCriteria,
  type NumericAttribute,
} from "../../catalog-query-criteria";

function MinimumAttributeInput({
  criteria,
  label,
  onChangeCriteria,
  property,
}: {
  readonly criteria: CatalogQueryCriteria;
  readonly label: string;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
  readonly property: NumericAttribute;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="small">{label}</ThemedText>
      <TextInput
        accessibilityLabel={`Minimum ${label}`}
        inputMode="numeric"
        keyboardType="number-pad"
        onChangeText={(value) => onChangeCriteria(setMinimum(criteria, property, value))}
        placeholder="Any"
        placeholderTextColor={theme.textTertiary}
        style={[
          styles.input,
          { backgroundColor: theme.fill, borderColor: theme.border, color: theme.text },
        ]}
        value={minimumValue(criteria[property])}
      />
    </View>
  );
}

export { MinimumAttributeInput };

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "space-between",
    minHeight: 44,
  },
  input: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    minWidth: 96,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 1,
    textAlign: "right",
  },
});
