import { StyleSheet, View } from "react-native";
import { match } from "ts-pattern";

import { LabelledSection } from "@/components/ui/atoms/labelled-section";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import type { NoteId } from "@/features/annotation/note";
import { BookmarkToggle } from "@/features/annotation/presentation/components/bookmark-toggle";
import type { WriteNote } from "@/features/annotation/presentation/components/note-card";
import { NoteList } from "@/features/annotation/presentation/components/note-list";
import type { SectionedSubjects } from "@/features/annotation/presentation/data/saved-sections-data";
import type { SavedSubjectGroup } from "@/features/annotation/presentation/saved-subject";
import type { SavedSection } from "@/features/annotation/presentation/saved-subjects";
import {
  bookmarkOnLabel,
  savedGroupView,
} from "@/features/annotation/presentation/saved-subjects-format";
import type { AnnotationSubject } from "@/features/annotation/value-objects/annotation-subject";
import { useColumnFit, type ColumnSpec } from "@/hooks/use-layout-size";
import { useTheme } from "@/hooks/use-theme";

interface SavedSectionsProps {
  readonly saved: SectionedSubjects;
}

interface SectionColumn {
  readonly key: string;
  readonly sections: readonly SavedSection[];
}

const SAVED_COLUMNS: ColumnSpec = {
  gap: Spacing.three,
  minimum: 320,
  sidePadding: Spacing.three,
};

function sectionColumns(
  sections: readonly SavedSection[],
  columns: number,
): readonly SectionColumn[] {
  const laid: SectionColumn[] = [];
  let taken = 0;

  for (let left = Math.min(columns, sections.length); left > 0; left -= 1) {
    const standing = sections.slice(taken, taken + Math.ceil((sections.length - taken) / left));
    const [first] = standing;

    laid.push({ key: first.label, sections: standing });
    taken += standing.length;
  }

  return laid;
}

function SavedSections({ saved }: SavedSectionsProps) {
  const { columns } = useColumnFit(SAVED_COLUMNS);

  return (
    <View style={styles.columns}>
      {sectionColumns(saved.sections, columns).map(({ key, sections }) => (
        <SavedColumn key={key} sections={sections} saved={saved} />
      ))}
    </View>
  );
}

function SavedColumn({
  sections,
  saved,
}: {
  readonly sections: readonly SavedSection[];
  readonly saved: SectionedSubjects;
}) {
  return (
    <View style={styles.column}>
      {sections.map((section) => (
        <LabelledSection key={section.label} label={section.label}>
          {section.message === null ? null : (
            <ThemedText themeColor="textSecondary" type="body">
              {section.message}
            </ThemedText>
          )}
          {section.groups.map((group) => (
            <SavedGroup
              group={group}
              key={group.key}
              onRemoveBookmark={saved.removeBookmark}
              onRemoveNote={saved.removeNote}
              onWriteNote={saved.writeNote}
            />
          ))}
        </LabelledSection>
      ))}
    </View>
  );
}

function SavedGroup({
  group,
  onRemoveBookmark,
  onRemoveNote,
  onWriteNote,
}: {
  readonly group: SavedSubjectGroup;
  readonly onRemoveBookmark: (subject: AnnotationSubject) => void;
  readonly onRemoveNote: (id: NoteId) => void;
  readonly onWriteNote: WriteNote;
}) {
  const theme = useTheme();
  const view = savedGroupView(group.subject);

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
      {view.body === undefined ? null : (
        <ThemedText numberOfLines={3} themeColor="textSecondary" type="body">
          {view.body}
        </ThemedText>
      )}
      {view.keepingLabel === null ? null : (
        <View style={styles.keeping}>
          <ThemedText style={styles.keepingLabel} themeColor="textTertiary" type="mono">
            {view.keepingLabel}
          </ThemedText>
          {match(view.dropping)
            .with({ type: "withheld" }, () => null)
            .with({ type: "offered" }, ({ subject }) => (
              <BookmarkToggle
                bookmarked
                label={bookmarkOnLabel(view.notesName)}
                onPress={() => onRemoveBookmark(subject)}
              />
            ))
            .exhaustive()}
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

export { SAVED_COLUMNS, SavedSections };
export type { SavedSectionsProps };

const styles = StyleSheet.create({
  columns: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.three,
    minWidth: 0,
  },
  column: {
    flex: 1,
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
  keeping: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    minWidth: 0,
  },
  keepingLabel: {
    flex: 1,
    minWidth: 0,
  },
});
