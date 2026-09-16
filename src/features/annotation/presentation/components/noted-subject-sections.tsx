import { Pressable, StyleSheet, View } from "react-native";

import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing, TouchTarget } from "@/constants/theme";
import type { Note, NoteId } from "@/features/annotation/note";
import type { NotedSubjects } from "@/features/annotation/presentation/data/noted-subjects-data";
import {
  noteCountLabel,
  noteCountOnLabel,
  noteEntryLabel,
  noteRemoveLabel,
} from "@/features/annotation/presentation/note-format";
import {
  UNFINDABLE_NOTES_MESSAGE,
  notedCardsSectionLabel,
  notedCoreRuleName,
  notedCoreRulesSectionLabel,
  unfindableNotesSectionLabel,
  unfindableSubjectKindLabel,
  unfindableSubjectName,
} from "@/features/annotation/presentation/noted-subjects-format";
import { coreRuleSavedContextLabel } from "@/features/rules/presentation/core-rules-format";
import { useTheme } from "@/hooks/use-theme";

interface NotedSubjectSectionsProps {
  readonly noted: NotedSubjects;
}

function NotedSubjectSections({ noted }: NotedSubjectSectionsProps) {
  const { cards, coreRules, unfindable } = noted.groups;

  return (
    <View style={styles.sections}>
      {cards.length === 0 ? null : (
        <LabelledSection label={notedCardsSectionLabel(cards.length)}>
          {cards.map(({ notes, subject }) => (
            <NotedSubjectNotes
              detail={subject.card.printingId}
              key={subject.card.printingId}
              name={subject.card.name}
              notes={notes}
              notesName={subject.card.name}
              onRemoveNote={noted.removeNote}
            />
          ))}
        </LabelledSection>
      )}
      {coreRules.length === 0 ? null : (
        <LabelledSection label={notedCoreRulesSectionLabel(coreRules.length)}>
          {coreRules.map(({ notes, subject }) => (
            <NotedSubjectNotes
              detail={subject.saved.coreRule.number}
              key={subject.saved.coreRule.number}
              name={coreRuleSavedContextLabel(subject.saved)}
              notes={notes}
              notesName={notedCoreRuleName(subject.saved)}
              onRemoveNote={noted.removeNote}
            />
          ))}
        </LabelledSection>
      )}
      {unfindable.length === 0 ? null : (
        <LabelledSection label={unfindableNotesSectionLabel(unfindable.length)}>
          <ThemedText themeColor="textSecondary" type="body">
            {UNFINDABLE_NOTES_MESSAGE}
          </ThemedText>
          {unfindable.map(({ notes, subject: unfound }) => (
            <NotedSubjectNotes
              detail={unfound.subject.id}
              key={unfindableSubjectName(unfound.subject)}
              name={unfindableSubjectKindLabel(unfound.subject)}
              notes={notes}
              notesName={unfindableSubjectName(unfound.subject)}
              onRemoveNote={noted.removeNote}
            />
          ))}
        </LabelledSection>
      )}
    </View>
  );
}

function NotedSubjectNotes({
  detail,
  name,
  notes,
  notesName,
  onRemoveNote,
}: {
  readonly detail: string;
  readonly name: string;
  readonly notes: readonly Note[];
  readonly notesName: string;
  readonly onRemoveNote: (id: NoteId) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.group, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      <View style={styles.head}>
        <ThemedText accessibilityRole="header" style={styles.name} type="heading">
          {name}
        </ThemedText>
        <ThemedText themeColor="accent" type="code">
          {detail}
        </ThemedText>
      </View>
      <ThemedText
        accessibilityLabel={noteCountOnLabel(notesName, notes.length)}
        themeColor="textTertiary"
        type="mono"
      >
        {noteCountLabel(notes.length)}
      </ThemedText>
      {notes.map((note, at) => (
        <NotedNote
          key={note.id}
          note={note}
          notesName={notesName}
          onRemove={() => onRemoveNote(note.id)}
          position={at + 1}
        />
      ))}
    </View>
  );
}

function NotedNote({
  note,
  notesName,
  onRemove,
  position,
}: {
  readonly note: Note;
  readonly notesName: string;
  readonly onRemove: () => void;
  readonly position: number;
}) {
  return (
    <View style={styles.note}>
      <View style={styles.noteHead}>
        <ThemedText style={styles.written} themeColor="textTertiary" type="mono">
          {noteEntryLabel(position, note)}
        </ThemedText>
        <Pressable
          accessibilityLabel={noteRemoveLabel(notesName, position)}
          accessibilityRole="button"
          onPress={onRemove}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <ThemedText themeColor="textTertiary" type="monoValue">
            ×
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="body">{note.body}</ThemedText>
    </View>
  );
}

export { NotedSubjectSections };
export type { NotedSubjectSectionsProps };

const styles = StyleSheet.create({
  sections: {
    gap: Spacing.four,
    minWidth: 0,
  },
  group: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    minWidth: 0,
    padding: Spacing.two + 1,
  },
  head: {
    alignItems: "baseline",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    minWidth: 0,
  },
  note: {
    gap: Spacing.one,
    minWidth: 0,
  },
  noteHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    minWidth: 0,
  },
  written: {
    flex: 1,
    minWidth: 0,
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
