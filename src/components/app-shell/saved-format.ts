const SAVED_TITLE = "Saved";
const NOTHING_SAVED_SUMMARY = "nothing saved yet";

interface SavedCounts {
  readonly card: number;
  readonly coreRule: number;
  readonly standalone: number;
  readonly unfindable: number;
}

function countLabel(count: number, one: string, many: string): string | null {
  return count === 0 ? null : `${count} ${count === 1 ? one : many}`;
}

function savedSummaryLabel(counts: SavedCounts): string {
  const parts = [
    countLabel(counts.standalone, "standalone note", "standalone notes"),
    countLabel(counts.card, "card", "cards"),
    countLabel(counts.coreRule, "rule", "rules"),
    countLabel(counts.unfindable, "missing subject", "missing subjects"),
  ].filter((part) => part !== null);

  return parts.length === 0 ? NOTHING_SAVED_SUMMARY : parts.join(" · ");
}

export { NOTHING_SAVED_SUMMARY, SAVED_TITLE, savedSummaryLabel };
export type { SavedCounts };
