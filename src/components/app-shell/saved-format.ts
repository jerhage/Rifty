const SAVED_TITLE = "Saved";
const NOTHING_SAVED_SUMMARY = "nothing written yet";

interface SavedNoteCounts {
  readonly card: number;
  readonly coreRule: number;
  readonly standalone: number;
  readonly unfindable: number;
}

function countLabel(count: number, what: string): string | null {
  return count === 0 ? null : `${count} ${what}`;
}

function savedSummaryLabel(counts: SavedNoteCounts): string {
  const parts = [
    countLabel(counts.standalone, "standalone"),
    countLabel(counts.card, "on cards"),
    countLabel(counts.coreRule, "on rules"),
    countLabel(counts.unfindable, "unplaced"),
  ].filter((part) => part !== null);

  return parts.length === 0 ? NOTHING_SAVED_SUMMARY : parts.join(" · ");
}

export { NOTHING_SAVED_SUMMARY, SAVED_TITLE, savedSummaryLabel };
export type { SavedNoteCounts };
