/**
 * Where the table of contents stands, which is one fact with two consequences: whether anything in
 * the header opens it, and how wide the page beneath that header is drawn.
 *
 * Standing beside the document makes the page a spread: the contents against the leading edge and
 * the rules text taking every point that is left. Standing over it leaves one column of prose,
 * which is capped and centered as a single column of reading always is.
 */
type CoreRulesContentsPlacement =
  | { readonly type: "beside" }
  | { readonly type: "over"; readonly open: () => void };

export type { CoreRulesContentsPlacement };
