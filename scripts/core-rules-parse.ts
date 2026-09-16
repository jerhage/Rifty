import { match } from "ts-pattern";

type CoreRuleNumber = string;
type CoreRuleKind = "heading" | "rule";
type CoreRuleDetailKind = "bullet" | "example";

interface CoreRuleDetail {
  readonly position: number;
  readonly kind: CoreRuleDetailKind;
  readonly body: string;
}

interface CoreRule {
  readonly number: CoreRuleNumber;
  readonly parentNumber: CoreRuleNumber | null;
  readonly position: number;
  readonly kind: CoreRuleKind;
  readonly body: string;
  readonly details: readonly CoreRuleDetail[];
}

interface CoreRulesDocument {
  readonly title: string;
  readonly publishedOn: string;
  readonly coreRules: readonly CoreRule[];
}

type ParsedLine =
  | { readonly type: "blank" }
  | {
      readonly type: "numbered";
      readonly number: CoreRuleNumber;
      readonly textColumn: number;
      readonly body: string;
    }
  | { readonly type: "unnumbered"; readonly column: number; readonly body: string };

// The piece a following line is placed against. An example paragraph absorbs any line until a blank;
// a body and an item absorb only a line that starts lowercase.
type OpenPiece =
  | { readonly type: "closed" }
  | { readonly type: "body"; readonly lines: string[] }
  | { readonly type: "example"; readonly lines: string[] }
  | { readonly type: "item"; readonly lines: string[] };

interface CoreRuleDetailDraft {
  readonly kind: CoreRuleDetailKind;
  readonly bodyLines: string[];
}

interface CoreRuleDraft {
  readonly number: CoreRuleNumber;
  readonly textColumn: number;
  readonly bodyLines: string[];
  readonly details: CoreRuleDetailDraft[];
}

// A period after the number is usual but not universal, so it is optional and the gap tells the two
// apart: one space is enough after a period, two are required without one.
const NUMBERED_LINE = /^\s*(\d{3}(?:\.(?:\d+|[a-z]))*)(?:\.\s+|\s\s+)(?=\S)/;
const EXAMPLES_LABEL = /^Examples:$/;
const EXAMPLE_LABEL = /^Example:\s*/;
const LOWERCASE_START = /^\p{Ll}/u;
const LAST_UPDATED_LINE = /^Last Updated:\s+(\d{4}-\d{2}-\d{2})$/;
const SENTENCE_END = /[.!?:][)\]"'’”]?$/;
const HEADING_LENGTH_LIMIT = 48;
const WRAP_TOLERANCE = 1;
const PREAMBLE_LINES = 2;

function parsedLine(line: string): ParsedLine {
  // A page break occupies a character but no column, so it must not count toward the indent.
  const text = line.replace(/\f/g, "").replace(/\s+$/, "");

  if (text.length === 0) return { type: "blank" };

  const numbered = NUMBERED_LINE.exec(text);
  const number = numbered?.[1];

  if (numbered !== null && number !== undefined)
    return {
      type: "numbered",
      number,
      textColumn: numbered[0].length,
      body: text.slice(numbered[0].length),
    };

  return { type: "unnumbered", column: text.length - text.trimStart().length, body: text.trim() };
}

function headerOf(preamble: readonly string[]): Pick<CoreRulesDocument, "publishedOn" | "title"> {
  const [title, lastUpdated] = preamble;
  const publishedOn =
    lastUpdated === undefined ? undefined : LAST_UPDATED_LINE.exec(lastUpdated)?.[1];

  if (preamble.length !== PREAMBLE_LINES || title === undefined || publishedOn === undefined)
    throw new Error(
      `The core rules text must open with a title line and a "Last Updated: YYYY-MM-DD" line, and opened with ${preamble.length}: ${preamble.join(" / ")}.`,
    );

  return { title, publishedOn };
}

function detailOf(draft: CoreRuleDetailDraft, position: number): CoreRuleDetail {
  return { position, kind: draft.kind, body: draft.bodyLines.join(" ") };
}

function coreRuleDepthOf(number: CoreRuleNumber): number {
  return number.split(".").length;
}

function coreRuleOf(draft: CoreRuleDraft, position: number): CoreRule {
  const segments = draft.number.split(".");
  const body = draft.bodyLines.join(" ");

  return {
    number: draft.number,
    parentNumber: segments.length === 1 ? null : segments.slice(0, -1).join("."),
    position,
    kind: body.length <= HEADING_LENGTH_LIMIT && !SENTENCE_END.test(body) ? "heading" : "rule",
    body,
    details: draft.details.map(detailOf),
  };
}

function parseCoreRules(text: string): CoreRulesDocument {
  const preamble: string[] = [];
  const drafts: CoreRuleDraft[] = [];
  let open: OpenPiece = { type: "closed" };
  let exampleRun = false;

  for (const line of text.split("\n"))
    match(parsedLine(line))
      .with({ type: "blank" }, () => {
        open = { type: "closed" };
      })
      .with({ type: "numbered" }, (numbered) => {
        const bodyLines = [numbered.body];

        drafts.push({
          number: numbered.number,
          textColumn: numbered.textColumn,
          bodyLines,
          details: [],
        });
        open = { type: "body", lines: bodyLines };
        exampleRun = false;
      })
      .with({ type: "unnumbered" }, (unnumbered) => {
        const draft = drafts.at(-1);
        const piece = open;

        if (draft === undefined) {
          preamble.push(unnumbered.body);
          return;
        }

        if (piece.type !== "closed" && LOWERCASE_START.test(unnumbered.body)) {
          piece.lines.push(unnumbered.body);
          return;
        }

        const label = EXAMPLE_LABEL.exec(unnumbered.body);

        if (label !== null) {
          const lines = [unnumbered.body.slice(label[0].length)];

          draft.details.push({ kind: "example", bodyLines: lines });
          open = { type: "example", lines };
          exampleRun = false;
          return;
        }

        if (EXAMPLES_LABEL.test(unnumbered.body)) {
          open = { type: "closed" };
          exampleRun = true;
          return;
        }

        if (piece.type === "example") {
          piece.lines.push(unnumbered.body);
          return;
        }

        const continuesBody =
          draft.details.length === 0 &&
          Math.abs(unnumbered.column - draft.textColumn) <= WRAP_TOLERANCE;

        if (continuesBody) {
          draft.bodyLines.push(unnumbered.body);
          open = { type: "body", lines: draft.bodyLines };
          return;
        }

        const lines = [unnumbered.body];

        draft.details.push({ kind: exampleRun ? "example" : "bullet", bodyLines: lines });
        open = { type: "item", lines };
      })
      .exhaustive();

  return { ...headerOf(preamble), coreRules: drafts.map(coreRuleOf) };
}

export { coreRuleDepthOf, parseCoreRules };
export type {
  CoreRule,
  CoreRuleDetail,
  CoreRuleDetailKind,
  CoreRuleKind,
  CoreRuleNumber,
  CoreRulesDocument,
};
