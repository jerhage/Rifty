/**
 * Which face of the rules sheet is showing, or that the sheet is not showing at all. A phone has
 * nowhere to stand either list beside the document, so both arrive over it through one sheet and
 * this says which one the reader asked for.
 */
type CoreRulesSheetState = "hidden" | "contents" | "saved";

export type { CoreRulesSheetState };
