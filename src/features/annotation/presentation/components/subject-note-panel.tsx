import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import type { Clock } from "@/application/ports/clock";
import type { IdGenerator } from "@/application/ports/id-generator";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget, type Theme } from "@/constants/theme";
import type { Note, NoteId } from "@/features/annotation/note";
import type { NoteManager } from "@/features/annotation/note-manager";
import {
  DraftNote,
  WrittenNote,
  type WriteNote,
} from "@/features/annotation/presentation/components/note-card";
import { NotesData } from "@/features/annotation/presentation/data/notes-data";
import { useNoteDrafting } from "@/features/annotation/presentation/hooks/use-note-drafting";
import {
  NOTES_EMPTY_MESSAGE,
  NOTE_PLACEHOLDER,
  noteAddLabel,
  noteSaveLabel,
} from "@/features/annotation/presentation/note-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useTheme } from "@/hooks/use-theme";

const PANEL_FIELD_HEIGHT = 76;

const ADD_LABEL = "+ Add note";
const SAVE_LABEL = "Save note";

const AddBarAlpha = {
  surface: "29",
  edge: "66",
} as const;

function addBarWash(theme: Theme, weight: keyof typeof AddBarAlpha): string {
  return `${theme.highlight}${AddBarAlpha[weight]}`;
}

interface SubjectNotePanelProps {
  readonly bookmarkControl: ReactNode;
  readonly clock: Clock;
  readonly idGenerator: IdGenerator;
  readonly noteManager: NoteManager;
  readonly notesName: string;
  readonly subject: AnnotationSubject;
}

function SubjectNotePanel({
  bookmarkControl,
  clock,
  idGenerator,
  noteManager,
  notesName,
  subject,
}: SubjectNotePanelProps) {
  return (
    <NotesData clock={clock} idGenerator={idGenerator} noteManager={noteManager} subject={subject}>
      {({ notes, removeNote, writeNote }) => (
        <WrittenNotePanel
          bookmarkControl={bookmarkControl}
          notes={notes}
          notesName={notesName}
          onRemoveNote={removeNote}
          onWriteNote={writeNote}
          subject={subject}
        />
      )}
    </NotesData>
  );
}

function WrittenNotePanel({
  bookmarkControl,
  notes,
  notesName,
  onRemoveNote,
  onWriteNote,
  subject,
}: {
  readonly bookmarkControl: ReactNode;
  readonly notes: readonly Note[];
  readonly notesName: string;
  readonly onRemoveNote: (id: NoteId) => void;
  readonly onWriteNote: WriteNote;
  readonly subject: AnnotationSubject;
}) {
  const theme = useTheme();
  const { beginDraft, changeDraftBody, discardDraft, draft, saveDraft } =
    useNoteDrafting(onWriteNote);

  return (
    <View style={styles.panel}>
      <View style={[styles.row, { borderBottomColor: theme.border }]}>
        {match(draft)
          .with({ type: "idle" }, () => (
            <NoteDraftBar
              caption={ADD_LABEL}
              label={noteAddLabel(notesName)}
              onPress={beginDraft}
            />
          ))
          .with({ type: "composing" }, ({ body }) => (
            <NoteDraftBar
              caption={SAVE_LABEL}
              label={noteSaveLabel(notesName)}
              onPress={() => saveDraft(subject, body)}
            />
          ))
          .exhaustive()}
        {bookmarkControl}
      </View>
      <ScrollView contentContainerStyle={styles.cards} style={styles.scroll}>
        {notes.length === 0
          ? match(draft)
              .with({ type: "idle" }, () => (
                <ThemedText themeColor="textSecondary" type="body">
                  {NOTES_EMPTY_MESSAGE}
                </ThemedText>
              ))
              .with({ type: "composing" }, () => null)
              .exhaustive()
          : null}
        {notes.map((note, at) => (
          <WrittenNote
            fieldHeight={PANEL_FIELD_HEIGHT}
            key={note.id}
            note={note}
            notesName={notesName}
            onRemove={() => onRemoveNote(note.id)}
            onWrite={onWriteNote}
            placeholder={NOTE_PLACEHOLDER}
            position={at + 1}
            writing={{ type: "offered", subject }}
          />
        ))}
        {match(draft)
          .with({ type: "idle" }, () => null)
          .with({ type: "composing" }, ({ body }) => (
            <DraftNote
              body={body}
              fieldHeight={PANEL_FIELD_HEIGHT}
              notesName={notesName}
              onChangeBody={changeDraftBody}
              onDiscard={discardDraft}
              placeholder={NOTE_PLACEHOLDER}
            />
          ))
          .exhaustive()}
      </ScrollView>
    </View>
  );
}

function NoteDraftBar({
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
        {
          backgroundColor: addBarWash(theme, "surface"),
          borderColor: addBarWash(theme, "edge"),
        },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText themeColor="highlight" type="mono">
        {caption}
      </ThemedText>
    </Pressable>
  );
}

export { SubjectNotePanel };
export type { SubjectNotePanelProps };

const styles = StyleSheet.create({
  panel: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  row: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.two + 1,
    paddingBottom: Spacing.two + 3,
    paddingHorizontal: Spacing.three + 2,
  },
  add: {
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: TouchTarget.minimum,
    minWidth: 0,
    paddingHorizontal: Spacing.two + 2,
  },
  scroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  cards: {
    gap: Spacing.two + 1,
    paddingBottom: Spacing.four + 2,
    paddingHorizontal: Spacing.three + 2,
    paddingTop: Spacing.two + 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
