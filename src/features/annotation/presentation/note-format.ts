import type { Note } from "@/features/annotation/note";

/** Several subjects show their notes on one screen, so every label names the subject and the note. */
function noteCountLabel(count: number): string {
  return `${count} ${count === 1 ? "note" : "notes"}`;
}

function notePositionLabel(position: number): string {
  return `Note ${position}`;
}

/** `Clock.now()` answers in ISO-8601, which leads with the date. */
function noteDateLabel(note: Note): string {
  return note.createdAt.slice(0, 10);
}

function noteEntryLabel(position: number, note: Note): string {
  return `${notePositionLabel(position)} · ${noteDateLabel(note)}`;
}

function noteFieldLabel(subjectName: string, position: number): string {
  return `${notePositionLabel(position)} on ${subjectName}`;
}

function noteDraftFieldLabel(subjectName: string): string {
  return `New note on ${subjectName}`;
}

function noteAddLabel(subjectName: string): string {
  return `Add a note to ${subjectName}`;
}

function noteSaveLabel(subjectName: string): string {
  return `Save the new note on ${subjectName}`;
}

function noteDiscardLabel(subjectName: string): string {
  return `Discard the new note on ${subjectName}`;
}

function noteRemoveLabel(subjectName: string, position: number): string {
  return `Remove ${notePositionLabel(position).toLowerCase()} on ${subjectName}`;
}

const NOTE_PLACEHOLDER = "Write the note…";
const NOTES_EMPTY_MESSAGE = "No notes on this one yet.";

export {
  NOTES_EMPTY_MESSAGE,
  NOTE_PLACEHOLDER,
  noteAddLabel,
  noteCountLabel,
  noteDateLabel,
  noteDiscardLabel,
  noteDraftFieldLabel,
  noteEntryLabel,
  noteFieldLabel,
  notePositionLabel,
  noteRemoveLabel,
  noteSaveLabel,
};
