import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { Note, NoteId } from "@/features/annotation/note";
import {
  noteDiscardLabel,
  noteDraftFieldLabel,
  noteEntryLabel,
  noteFieldLabel,
  noteRemoveLabel,
} from "@/features/annotation/presentation/note-format";
import type { NoteWriting } from "@/features/annotation/presentation/saved-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useTheme } from "@/hooks/use-theme";

type WriteNote = (subject: AnnotationSubject | null, id: NoteId | null, body: string) => void;

const DRAFT_LABEL = "New note";

function WrittenNote({
  fieldHeight,
  note,
  notesName,
  onRemove,
  onWrite,
  placeholder,
  position,
  writing,
}: {
  readonly fieldHeight: number;
  readonly note: Note;
  readonly notesName: string;
  readonly onRemove: () => void;
  readonly onWrite: WriteNote;
  readonly placeholder: string;
  readonly position: number;
  readonly writing: NoteWriting;
}) {
  const theme = useTheme();

  return (
    <NoteBlock
      label={noteEntryLabel(position, note)}
      onDiscard={onRemove}
      removeLabel={noteRemoveLabel(notesName, position)}
    >
      {match(writing)
        .with({ type: "withheld" }, () => (
          <ThemedText style={[styles.field, { minHeight: fieldHeight }]} type="body">
            {note.body}
          </ThemedText>
        ))
        .with({ type: "offered" }, ({ subject }) => (
          <TextInput
            accessibilityLabel={noteFieldLabel(notesName, position)}
            defaultValue={note.body}
            multiline
            onEndEditing={(event) => onWrite(subject, note.id, event.nativeEvent.text)}
            placeholder={placeholder}
            placeholderTextColor={theme.textTertiary}
            style={[styles.field, { color: theme.text, minHeight: fieldHeight }]}
          />
        ))
        .exhaustive()}
    </NoteBlock>
  );
}

function DraftNote({
  body,
  fieldHeight,
  notesName,
  onChangeBody,
  onDiscard,
  placeholder,
}: {
  readonly body: string;
  readonly fieldHeight: number;
  readonly notesName: string;
  readonly onChangeBody: (body: string) => void;
  readonly onDiscard: () => void;
  readonly placeholder: string;
}) {
  const theme = useTheme();

  return (
    <NoteBlock label={DRAFT_LABEL} onDiscard={onDiscard} removeLabel={noteDiscardLabel(notesName)}>
      <TextInput
        accessibilityLabel={noteDraftFieldLabel(notesName)}
        multiline
        onChangeText={onChangeBody}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.field, { color: theme.text, minHeight: fieldHeight }]}
        value={body}
      />
    </NoteBlock>
  );
}

function NoteBlock({
  children,
  label,
  onDiscard,
  removeLabel,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly onDiscard: () => void;
  readonly removeLabel: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.block, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <View style={styles.blockHead}>
        <ThemedText style={styles.label} themeColor="textTertiary" type="mono">
          {label}
        </ThemedText>
        <Pressable
          accessibilityLabel={removeLabel}
          accessibilityRole="button"
          onPress={onDiscard}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <ThemedText themeColor="textTertiary" type="monoValue">
            ×
          </ThemedText>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

export { DraftNote, WrittenNote };
export type { WriteNote };

const styles = StyleSheet.create({
  block: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    paddingBottom: Spacing.two,
    paddingLeft: Spacing.two + 1,
    paddingRight: Spacing.one,
    paddingTop: Spacing.one,
  },
  blockHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
  field: {
    fontSize: 13,
    lineHeight: 19,
    marginRight: Spacing.two,
    padding: 0,
    textAlignVertical: "top",
  },
  remove: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
  },
  pressed: {
    opacity: 0.7,
  },
});
