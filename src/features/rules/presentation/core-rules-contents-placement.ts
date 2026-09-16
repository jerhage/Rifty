/**
 * Where the contents stand: beside the document makes the page a spread, over it leaves one column
 * of prose and puts a control in the header.
 */
type CoreRulesContentsPlacement =
  | { readonly type: "beside" }
  | { readonly type: "over"; readonly open: () => void };

export type { CoreRulesContentsPlacement };
