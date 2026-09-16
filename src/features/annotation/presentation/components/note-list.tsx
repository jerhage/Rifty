import { useCallback, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { Note, NoteId } from "@/features/annotation/note";
import {
  noteAddLabel,
  noteCountLabel,
  noteCountOnLabel,
  noteDiscardLabel,
  noteDraftFieldLabel,
  noteSaveLabel,
  noteEntryLabel,
  noteFieldLabel,
  noteRemoveLabel,
} from "@/features/annotation/presentation/note-format";
import { useTheme } from "@/hooks/use-theme";

const NOTE_FIELD_HEIGHT = 46;

interface NoteListProps {
  readonly emptyMessage: string;
  readonly notes: readonly Note[];
  /** What the notes hang off on screen, so a screen showing several sets does not read alike. */
  readonly notesName: string;
  readonly onRemoveNote: (id: NoteId) => void;
  readonly onWriteNote: (id: NoteId | null, body: string) => void;
  readonly placeholder: string;
}

/** Emptying a field never removes a note: a blank body is refused, and removal has its own control. */
function NoteList({
  emptyMessage,
  notes,
  notesName,
  onRemoveNote,
  onWriteNote,
  placeholder,
}: NoteListProps) {
  const theme = useTheme();
  const [draftBody, setDraftBody] = useState<string | null>(null);

  const commitDraft = useCallback(() => {
    if (draftBody !== null) onWriteNote(null, draftBody);

    setDraftBody(null);
  }, [draftBody, onWriteNote]);

  return (
    <View style={styles.notes}>
      <View style={styles.head}>
        <ThemedText
          accessibilityLabel={noteCountOnLabel(notesName, notes.length)}
          style={styles.count}
          themeColor="textTertiary"
          type="mono"
        >
          {noteCountLabel(notes.length)}
        </ThemedText>
        <Pressable
          accessibilityLabel={
            draftBody === null ? noteAddLabel(notesName) : noteSaveLabel(notesName)
          }
          accessibilityRole="button"
          onPress={draftBody === null ? () => setDraftBody("") : commitDraft}
          style={({ pressed }) => [
            styles.add,
            { backgroundColor: theme.fill, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText themeColor="accent" type="mono">
            {draftBody === null ? "+ Note" : "Save note"}
          </ThemedText>
        </Pressable>
      </View>
      {notes.length === 0 && draftBody === null ? (
        <ThemedText themeColor="textSecondary" type="body">
          {emptyMessage}
        </ThemedText>
      ) : null}
      {notes.map((note, at) => (
        <WrittenNote
          key={note.id}
          note={note}
          notesName={notesName}
          onRemove={() => onRemoveNote(note.id)}
          onWrite={(body) => onWriteNote(note.id, body)}
          placeholder={placeholder}
          position={at + 1}
        />
      ))}
      {draftBody === null ? null : (
        <NoteBlock
          label="New note"
          onDiscard={() => setDraftBody(null)}
          removeLabel={noteDiscardLabel(notesName)}
        >
          <TextInput
            accessibilityLabel={noteDraftFieldLabel(notesName)}
            multiline
            onChangeText={setDraftBody}
            placeholder={placeholder}
            placeholderTextColor={theme.textTertiary}
            style={[styles.field, { color: theme.text }]}
            value={draftBody}
          />
        </NoteBlock>
      )}
    </View>
  );
}

function WrittenNote({
  note,
  notesName,
  onRemove,
  onWrite,
  placeholder,
  position,
}: {
  readonly note: Note;
  readonly notesName: string;
  readonly onRemove: () => void;
  readonly onWrite: (body: string) => void;
  readonly placeholder: string;
  readonly position: number;
}) {
  const theme = useTheme();

  return (
    <NoteBlock
      label={noteEntryLabel(position, note)}
      onDiscard={onRemove}
      removeLabel={noteRemoveLabel(notesName, position)}
    >
      <TextInput
        accessibilityLabel={noteFieldLabel(notesName, position)}
        defaultValue={note.body}
        multiline
        onEndEditing={(event) => onWrite(event.nativeEvent.text)}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.field, { color: theme.text }]}
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
        <ThemedText style={styles.count} themeColor="textTertiary" type="mono">
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

export { NoteList };
export type { NoteListProps };

const styles = StyleSheet.create({
  notes: {
    gap: Spacing.two - 1,
  },
  head: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  count: {
    flex: 1,
    minWidth: 0,
  },
  add: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    paddingHorizontal: Spacing.two + 2,
  },
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
  field: {
    fontSize: 13,
    lineHeight: 19,
    marginRight: Spacing.two,
    minHeight: NOTE_FIELD_HEIGHT,
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
