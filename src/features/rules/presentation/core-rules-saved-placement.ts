/**
 * Where the saved surface stands, which decides what the header's bookmark count does: expand a
 * pane beside the document, or open the sheet on its Saved face over it.
 */
type CoreRulesSavedPlacement =
  | { readonly type: "beside"; readonly expanded: boolean; readonly toggle: () => void }
  | { readonly type: "over"; readonly open: () => void };

export type { CoreRulesSavedPlacement };
