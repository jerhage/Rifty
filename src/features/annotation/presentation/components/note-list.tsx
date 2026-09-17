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
import { useNoteDrafting } from "@/features/annotation/presentation/hooks/use-note-drafting";
import {
  noteAddLabel,
  noteCountLabel,
  noteCountOnLabel,
  noteSaveLabel,
} from "@/features/annotation/presentation/note-format";
import type { NoteWriting } from "@/features/annotation/presentation/saved-subjects-format";
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
  const { beginDraft, changeDraftBody, discardDraft, draft, saveDraft } =
    useNoteDrafting(onWriteNote);

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
          .with({ type: "offered" }, ({ subject }) =>
            match(draft)
              .with({ type: "idle" }, () => (
                <NoteDraftButton
                  caption="+ Note"
                  label={noteAddLabel(notesName)}
                  onPress={beginDraft}
                />
              ))
              .with({ type: "composing" }, ({ body }) => (
                <NoteDraftButton
                  caption="Save note"
                  label={noteSaveLabel(notesName)}
                  onPress={() => saveDraft(subject, body)}
                />
              ))
              .exhaustive(),
          )
          .exhaustive()}
      </View>
      {notes.length === 0 &&
        match(draft)
          .with({ type: "idle" }, () => (
            <ThemedText themeColor="textSecondary" type="body">
              {emptyMessage}
            </ThemedText>
          ))
          .with({ type: "composing" }, () => null)
          .exhaustive()}
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
      {match(draft)
        .with({ type: "idle" }, () => null)
        .with({ type: "composing" }, ({ body }) => (
          <DraftNote
            body={body}
            fieldHeight={NOTE_FIELD_HEIGHT}
            notesName={notesName}
            onChangeBody={changeDraftBody}
            onDiscard={discardDraft}
            placeholder={placeholder}
          />
        ))
        .exhaustive()}
    </View>
  );
}

function NoteDraftButton({
  caption,
  label,
  onPress,
}: {
  readonly caption: string;
  readonly label: string;
  readonly onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.add,
        { backgroundColor: theme.fill, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="accent" type="mono">
        {caption}
      </ThemedText>
    </Pressable>
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
