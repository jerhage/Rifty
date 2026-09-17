import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { Note, NoteId } from "@/features/annotation/note";
import {
  DraftNote,
  WrittenNote,
  type WriteNote,
} from "@/features/annotation/presentation/components/note-card";
import {
  noteAddLabel,
  noteCountLabel,
  noteCountOnLabel,
  noteSaveLabel,
} from "@/features/annotation/presentation/note-format";
import type { NoteWriting } from "@/features/annotation/presentation/saved-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useTheme } from "@/hooks/use-theme";

const NOTE_FIELD_HEIGHT = 46;

interface NoteListProps {
  readonly emptyMessage: string;
  readonly notes: readonly Note[];
  readonly notesName: string;
  readonly onRemoveNote: (id: NoteId) => void;
  readonly onWriteNote: WriteNote;
  readonly placeholder: string;
  readonly writing: NoteWriting;
}

function NoteList({
  emptyMessage,
  notes,
  notesName,
  onRemoveNote,
  onWriteNote,
  placeholder,
  writing,
}: NoteListProps) {
  const theme = useTheme();
  const [draftBody, setDraftBody] = useState<string | null>(null);

  const commitDraft = useCallback(
    (subject: AnnotationSubject | null) => {
      if (draftBody !== null) onWriteNote(subject, null, draftBody);

      setDraftBody(null);
    },
    [draftBody, onWriteNote],
  );

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
        {match(writing)
          .with({ type: "withheld" }, () => null)
          .with({ type: "offered" }, ({ subject }) => (
            <Pressable
              accessibilityLabel={
                draftBody === null ? noteAddLabel(notesName) : noteSaveLabel(notesName)
              }
              accessibilityRole="button"
              onPress={draftBody === null ? () => setDraftBody("") : () => commitDraft(subject)}
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
          ))
          .exhaustive()}
      </View>
      {notes.length === 0 && draftBody === null ? (
        <ThemedText themeColor="textSecondary" type="body">
          {emptyMessage}
        </ThemedText>
      ) : null}
      {notes.map((note, at) => (
        <WrittenNote
          fieldHeight={NOTE_FIELD_HEIGHT}
          key={note.id}
          note={note}
          notesName={notesName}
          onRemove={() => onRemoveNote(note.id)}
          onWrite={onWriteNote}
          placeholder={placeholder}
          position={at + 1}
          writing={writing}
        />
      ))}
      {draftBody === null ? null : (
        <DraftNote
          body={draftBody}
          fieldHeight={NOTE_FIELD_HEIGHT}
          notesName={notesName}
          onChangeBody={setDraftBody}
          onDiscard={() => setDraftBody(null)}
          placeholder={placeholder}
        />
      )}
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
  pressed: {
    opacity: 0.7,
  },
});
