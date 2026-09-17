import { StyleSheet, View } from "react-native";

import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { NoteId } from "@/features/annotation/note";
import type { WriteNote } from "@/features/annotation/presentation/components/note-card";
import { NoteList } from "@/features/annotation/presentation/components/note-list";
import type { SectionedNotes } from "@/features/annotation/presentation/data/note-sections-data";
import type { NotedSubjectGroup } from "@/features/annotation/presentation/noted-subject";
import { notedGroupView } from "@/features/annotation/presentation/noted-subjects-format";
import { useTheme } from "@/hooks/use-theme";

interface NoteSectionsProps {
  readonly written: SectionedNotes;
}

function NoteSections({ written }: NoteSectionsProps) {
  return (
    <View style={styles.sections}>
      {written.sections.map((section) => (
        <LabelledSection key={section.label} label={section.label}>
          {section.message === null ? null : (
            <ThemedText themeColor="textSecondary" type="body">
              {section.message}
            </ThemedText>
          )}
          {section.groups.map((group) => (
            <NoteGroup
              group={group}
              key={group.key}
              onRemoveNote={written.removeNote}
              onWriteNote={written.writeNote}
            />
          ))}
        </LabelledSection>
      ))}
    </View>
  );
}

function NoteGroup({
  group,
  onRemoveNote,
  onWriteNote,
}: {
  readonly group: NotedSubjectGroup;
  readonly onRemoveNote: (id: NoteId) => void;
  readonly onWriteNote: WriteNote;
}) {
  const theme = useTheme();
  const view = notedGroupView(group.subject);

  return (
    <View style={[styles.group, { backgroundColor: theme.fill, borderColor: theme.border }]}>
      {view.name === null ? null : (
        <View style={styles.head}>
          <ThemedText accessibilityRole="header" style={styles.name} type="heading">
            {view.name}
          </ThemedText>
          {view.detail === null ? null : (
            <ThemedText themeColor="accent" type="code">
              {view.detail}
            </ThemedText>
          )}
        </View>
      )}
      <NoteList
        emptyMessage={view.emptyMessage}
        notes={group.notes}
        notesName={view.notesName}
        onRemoveNote={onRemoveNote}
        onWriteNote={onWriteNote}
        placeholder={view.placeholder}
        writing={view.writing}
      />
    </View>
  );
}

export { NoteSections };
export type { NoteSectionsProps };

const styles = StyleSheet.create({
  sections: {
    gap: Spacing.four,
    minWidth: 0,
  },
  group: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
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
});
