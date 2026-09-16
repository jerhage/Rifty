import type { Note } from "@/features/annotation/note";

/** Several subjects show their notes on one screen, so every label names the subject and the note. */
function noteCountLabel(count: number): string {
  return `${count} ${count === 1 ? "note" : "notes"}`;
}

function noteCountOnLabel(notesName: string, count: number): string {
  return `${noteCountLabel(count)} on ${notesName}`;
}

/** The control that opens a subject's notes: a stable name, with the count carried as its value. */
function notesOnLabel(notesName: string): string {
  return `Notes on ${notesName}`;
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

function noteFieldLabel(notesName: string, position: number): string {
  return `${notePositionLabel(position)} on ${notesName}`;
}

function noteDraftFieldLabel(notesName: string): string {
  return `New note on ${notesName}`;
}

function noteAddLabel(notesName: string): string {
  return `Add a note to ${notesName}`;
}

function noteSaveLabel(notesName: string): string {
  return `Save the new note on ${notesName}`;
}

function noteDiscardLabel(notesName: string): string {
  return `Discard the new note on ${notesName}`;
}

function noteRemoveLabel(notesName: string, position: number): string {
  return `Remove ${notePositionLabel(position).toLowerCase()} on ${notesName}`;
}

const NOTE_PLACEHOLDER = "Write the note…";
const NOTE_WRITTEN_MESSAGE = "Note added.";
const NOTE_REPLACED_MESSAGE = "Note saved.";
const NOTE_BLANK_MESSAGE = "A note needs something written in it.";
const NOTE_GONE_MESSAGE = "That note is no longer there.";
const NOTE_FAILED_MESSAGE = "Could not save that note. Try again.";
const NOTE_REMOVED_MESSAGE = "Note removed.";
const NOTE_REMOVE_FAILED_MESSAGE = "Could not remove that note. Try again.";
const NOTES_EMPTY_MESSAGE = "No notes on this one yet.";

const SCRATCHPAD_TITLE = "Scratchpad";
const SCRATCHPAD_NOTES_NAME = "the scratchpad";
const SCRATCHPAD_PLACEHOLDER = "Anything at all — round results, judge calls, trades to chase…";
const SCRATCHPAD_EMPTY_MESSAGE = "Nothing in the scratchpad yet.";

export {
  NOTES_EMPTY_MESSAGE,
  NOTE_BLANK_MESSAGE,
  NOTE_FAILED_MESSAGE,
  NOTE_GONE_MESSAGE,
  NOTE_PLACEHOLDER,
  NOTE_REMOVED_MESSAGE,
  NOTE_REMOVE_FAILED_MESSAGE,
  NOTE_REPLACED_MESSAGE,
  NOTE_WRITTEN_MESSAGE,
  SCRATCHPAD_EMPTY_MESSAGE,
  SCRATCHPAD_NOTES_NAME,
  SCRATCHPAD_PLACEHOLDER,
  SCRATCHPAD_TITLE,
  noteAddLabel,
  noteCountLabel,
  noteCountOnLabel,
  noteDateLabel,
  noteDiscardLabel,
  noteDraftFieldLabel,
  noteEntryLabel,
  noteFieldLabel,
  notePositionLabel,
  noteRemoveLabel,
  noteSaveLabel,
  notesOnLabel,
};
