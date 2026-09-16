const SAVED_TITLE = "Saved";
const SCRATCHPAD_WRITTEN_SUMMARY = "scratchpad written";
const SCRATCHPAD_EMPTY_SUMMARY = "scratchpad empty";

function savedSummaryLabel(scratchpadNoteCount: number): string {
  return scratchpadNoteCount === 0 ? SCRATCHPAD_EMPTY_SUMMARY : SCRATCHPAD_WRITTEN_SUMMARY;
}

export { SAVED_TITLE, SCRATCHPAD_EMPTY_SUMMARY, SCRATCHPAD_WRITTEN_SUMMARY, savedSummaryLabel };
