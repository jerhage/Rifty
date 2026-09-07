import { BottomSheet, RNHostView } from "@expo/ui";
import type { ReactNode } from "react";
import { ScrollView, Pressable, StyleSheet, TextInput, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Spacing } from "@/constants/theme";
import type {
  CardListCriteria,
  CardNumericFilter,
  CardSort,
} from "@/features/catalog/card/card-list-criteria";
import { cardDomainSchema, type CardDomain } from "@/features/catalog/value-objects/card-domain";
import { cardTypeSchema, type CardType } from "@/features/catalog/value-objects/card-type";
import { useTheme } from "@/hooks/use-theme";

type CatalogQueryCriteria = Omit<CardListCriteria, "limit" | "offset">;
type NumericAttribute = "energy" | "might" | "power";

const typeOptions = cardTypeSchema.options;
const domainOptions = cardDomainSchema.options;
const sortOptions: readonly { readonly label: string; readonly sort: CardSort | undefined }[] = [
  { label: "Catalog order", sort: undefined },
  { label: "Name: A–Z", sort: { type: "name", direction: "ascending" } },
  { label: "Name: Z–A", sort: { type: "name", direction: "descending" } },
  { label: "Energy: high to low", sort: { type: "energy", direction: "descending" } },
  { label: "Energy: low to high", sort: { type: "energy", direction: "ascending" } },
  { label: "Might: high to low", sort: { type: "might", direction: "descending" } },
  { label: "Might: low to high", sort: { type: "might", direction: "ascending" } },
  { label: "Power: high to low", sort: { type: "power", direction: "descending" } },
  { label: "Power: low to high", sort: { type: "power", direction: "ascending" } },
];

interface CardCatalogFilterSheetProps {
  readonly criteria: CatalogQueryCriteria;
  readonly isPresented: boolean;
  readonly onApply: () => void;
  readonly onChangeCriteria: (criteria: CatalogQueryCriteria) => void;
  readonly onClear: () => void;
  readonly onDismiss: () => void;
}

function CardCatalogFilterSheet({
  criteria,
  isPresented,
  onApply,
  onChangeCriteria,
  onClear,
  onDismiss,
}: CardCatalogFilterSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet
      containerColor={theme.background}
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={["half", "full"]}
    >
      <RNHostView>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Filter & Sort</ThemedText>

          <FilterSection title="Card type">
            <View style={styles.choiceList}>
              {typeOptions.map((typeId) => (
                <ChoiceButton
                  key={typeId}
                  label={typeId}
                  onPress={() => onChangeCriteria(toggleType(criteria, typeId))}
                  selected={criteria.typeIds?.includes(typeId) ?? false}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Domains">
            <View style={styles.choiceList}>
              {domainOptions.map((domainId) => (
                <ChoiceButton
                  key={domainId}
                  label={domainId}
                  onPress={() => onChangeCriteria(toggleDomain(criteria, domainId))}
                  selected={criteria.domainIds?.includes(domainId) ?? false}
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Minimum attributes">
            <MinimumAttributeInput
              criteria={criteria}
              label="Energy"
              onChangeCriteria={onChangeCriteria}
              property="energy"
            />
            <MinimumAttributeInput
              criteria={criteria}
              label="Might"
              onChangeCriteria={onChangeCriteria}
              property="might"
            />
            <MinimumAttributeInput
              criteria={criteria}
              label="Power"
              onChangeCriteria={onChangeCriteria}
              property="power"
            />
          </FilterSection>

          <FilterSection title="Sort">
            <View style={styles.choiceList}>
              {sortOptions.map(({ label, sort }) => (
                <ChoiceButton
                  key={label}
                  label={label}
                  onPress={() => onChangeCriteria({ ...criteria, sort })}
                  selected={sameSort(criteria.sort, sort)}
                />
              ))}
            </View>
          </FilterSection>

          <View style={styles.actions}>
            <ActionButton label="Clear" onPress={onClear} secondary />
            <ActionButton label="Apply" onPress={onApply} />
          </View>
        </ScrollView>
      </RNHostView>
    </BottomSheet>
  );
}

function FilterSection({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

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
    <View style={styles.attributeInput}>
      <ThemedText>{label}</ThemedText>
      <TextInput
        accessibilityLabel={`Minimum ${label}`}
        inputMode="numeric"
        keyboardType="number-pad"
        onChangeText={(value) => onChangeCriteria(setMinimum(criteria, property, value))}
        placeholder="Any"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        value={minimumValue(criteria[property])}
      />
    </View>
  );
}

function ChoiceButton({
  label,
  onPress,
  selected,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? "backgroundSelected" : "backgroundElement"}
        style={styles.choice}
      >
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  secondary = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly secondary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={secondary ? "backgroundElement" : "backgroundSelected"}
        style={styles.action}
      >
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function toggleType(criteria: CatalogQueryCriteria, typeId: CardType): CatalogQueryCriteria {
  return { ...criteria, typeIds: toggleId(criteria.typeIds, typeId) };
}

function toggleDomain(criteria: CatalogQueryCriteria, domainId: CardDomain): CatalogQueryCriteria {
  return { ...criteria, domainIds: toggleId(criteria.domainIds, domainId) };
}

function toggleId<Id extends string>(
  selectedIds: readonly Id[] | undefined,
  id: Id,
): Id[] | undefined {
  const currentIds = selectedIds ?? [];
  const nextIds = currentIds.includes(id)
    ? currentIds.filter((selectedId) => selectedId !== id)
    : [...currentIds, id];

  return nextIds.length === 0 ? undefined : nextIds;
}

function setMinimum(
  criteria: CatalogQueryCriteria,
  property: NumericAttribute,
  value: string,
): CatalogQueryCriteria {
  const parsedValue = parseNonnegativeInteger(value);
  return {
    ...criteria,
    [property]: parsedValue === undefined ? undefined : { type: "atLeast", value: parsedValue },
  };
}

function parseNonnegativeInteger(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;

  return Number(value);
}

function minimumValue(filter: CardNumericFilter | undefined): string {
  return match(filter)
    .with({ type: "atLeast" }, ({ value }) => String(value))
    .otherwise(() => "");
}

function sameSort(left: CardSort | undefined, right: CardSort | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.type !== right.type) return false;
  if (left.type === "catalogOrder") return true;
  if (right.type === "catalogOrder") return false;

  return left.direction === right.direction;
}

export { CardCatalogFilterSheet };
export type { CatalogQueryCriteria };

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  choiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  choice: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  attributeInput: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "space-between",
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    minWidth: 96,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "flex-end",
  },
  action: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
