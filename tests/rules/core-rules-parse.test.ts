import { readFileSync } from "node:fs";
import { join } from "node:path";
import { coreRuleDepthOf, parseCoreRules } from "../../scripts/core-rules-parse";
import type { CoreRule, CoreRulesDocument } from "../../scripts/core-rules-parse";

const EXTRACTED_TEXT_PATH = join(__dirname, "../../data/rules/core-rules.txt");
const HEADING_LENGTH_LIMIT = 48;
const SENTENCE_END = /[.!?:][)\]"'’”]?$/;
const LONG_UNPUNCTUATED_BODIES = [
  "127.2",
  "129.5",
  "140.4.c",
  "600.4",
  "602.1.b",
  "623.2",
  "638.1.a",
  "638.1.b",
  "638.1.c",
  "639",
  "652.5.b.2",
];

function documentOf(...lines: readonly string[]): string {
  return ["    Riftbound Core Rules", "    Last Updated: 2025-06-02", "", ...lines].join("\n");
}

function coreRuleNumbered(parsed: CoreRulesDocument, number: string): CoreRule {
  const found = parsed.coreRules.find((coreRule) => coreRule.number === number);

  if (found === undefined) throw new Error(`The parse holds no core rule ${number}.`);

  return found;
}

function countByDepth(parsed: CoreRulesDocument): Record<number, number> {
  const counted: Record<number, number> = {};

  for (const coreRule of parsed.coreRules) {
    const depth = coreRuleDepthOf(coreRule.number);

    counted[depth] = (counted[depth] ?? 0) + 1;
  }

  return counted;
}

let extracted: CoreRulesDocument | null = null;

function extractedCoreRules(): CoreRulesDocument {
  if (extracted !== null) return extracted;

  try {
    extracted = parseCoreRules(readFileSync(EXTRACTED_TEXT_PATH, "utf8"));
  } catch (cause) {
    throw new Error(
      `The measured counts need ${EXTRACTED_TEXT_PATH}, produced by: pdftotext -layout data/rules/core-rules.pdf data/rules/core-rules.txt`,
      { cause },
    );
  }

  return extracted;
}

describe("core rules parse", () => {
  it("should read the title and the last updated date from the two opening lines", () => {
    const parsed = parseCoreRules(documentOf("000. Golden and Silver Rules"));

    expect(parsed.title).toBe("Riftbound Core Rules");
    expect(parsed.publishedOn).toBe("2025-06-02");
  });

  it("should refuse a document that does not open with a title and a last updated line", () => {
    expect(() => parseCoreRules("000. Golden and Silver Rules")).toThrow(/Last Updated/);
  });

  it("should take one space after the period and two where the period is missing", () => {
    const parsed = parseCoreRules(
      documentOf(
        "000. Golden and Silver Rules",
        "553.5   Otherwise, Focus passes to the next Relevant Player.",
        "           999 One space and no period",
      ),
    );

    expect(parsed.coreRules.map((coreRule) => coreRule.number)).toEqual(["000", "553.5"]);
    expect(coreRuleNumbered(parsed, "553.5").details).toEqual([
      { position: 0, kind: "bullet", body: "999 One space and no period" },
    ]);
  });

  it("should join a wrapped sentence with a single space", () => {
    const parsed = parseCoreRules(
      documentOf(
        "103.    To play Riftbound, a player must have two Decks, a Champion Legend, and a number",
        "        of Battlefields determined by the Mode of Play.",
      ),
    );

    expect(coreRuleNumbered(parsed, "103").body).toBe(
      "To play Riftbound, a player must have two Decks, a Champion Legend, and a number of Battlefields determined by the Mode of Play.",
    );
  });

  it("should take a line indented deeper than the body as a detail rather than body text", () => {
    const parsed = parseCoreRules(
      documentOf(
        "103.2.  A Main Deck of at least 40 cards",
        "            1 Chosen Champion Unit",
        "            Units",
      ),
    );
    const coreRule = coreRuleNumbered(parsed, "103.2");

    expect(coreRule.body).toBe("A Main Deck of at least 40 cards");
    expect(coreRule.details).toEqual([
      { position: 0, kind: "bullet", body: "1 Chosen Champion Unit" },
      { position: 1, kind: "bullet", body: "Units" },
    ]);
  });

  it("should join a lowercase line to the bullet above it and start a bullet otherwise", () => {
    const parsed = parseCoreRules(
      documentOf(
        "103.  A rule body.",
        "           First bullet that wraps",
        "           onto a second line",
        "           Second bullet",
      ),
    );

    expect(coreRuleNumbered(parsed, "103").details).toEqual([
      { position: 0, kind: "bullet", body: "First bullet that wraps onto a second line" },
      { position: 1, kind: "bullet", body: "Second bullet" },
    ]);
  });

  it("should strip the Example label and read the example to the blank line at any column", () => {
    const parsed = parseCoreRules(
      documentOf(
        "559.  The process is referred",
        "      to as mistargeting.",
        "          Example: A spell has an instruction.",
        "      Before that instruction can execute, it fails.",
        "",
        "          Example: A second example.",
      ),
    );
    const coreRule = coreRuleNumbered(parsed, "559");

    expect(coreRule.body).toBe("The process is referred to as mistargeting.");
    expect(coreRule.details).toEqual([
      {
        position: 0,
        kind: "example",
        body: "A spell has an instruction. Before that instruction can execute, it fails.",
      },
      { position: 1, kind: "example", body: "A second example." },
    ]);
  });

  it("should drop an Examples label and run its list past the blank lines between items", () => {
    const parsed = parseCoreRules(
      documentOf(
        "108.2.  A rule body.",
        "            Examples:",
        "            If a Unit is Buffed and it",
        "            stays buffed",
        "",
        "            If a Gear is Exhausted",
      ),
    );

    expect(coreRuleNumbered(parsed, "108.2").details).toEqual([
      { position: 0, kind: "example", body: "If a Unit is Buffed and it stays buffed" },
      { position: 1, kind: "example", body: "If a Gear is Exhausted" },
    ]);
  });

  it("should strip the trailing period and read alpha and numeric segments alike", () => {
    const parsed = parseCoreRules(documentOf("103.2.  A Main Deck.", "103.2.a.  Chosen Champion."));

    expect(parsed.coreRules.map((coreRule) => coreRule.number)).toEqual(["103.2", "103.2.a"]);
  });

  it("should give a five deep number its parent, its depth and its position", () => {
    const parsed = parseCoreRules(
      documentOf("103.  Deck Construction", "103.2.a.1.a.  A five deep rule."),
    );
    const coreRule = coreRuleNumbered(parsed, "103.2.a.1.a");

    expect(coreRule.parentNumber).toBe("103.2.a.1");
    expect(coreRuleDepthOf(coreRule.number)).toBe(5);
    expect(coreRule.position).toBe(1);
    expect(coreRuleNumbered(parsed, "103").parentNumber).toBeNull();
    expect(coreRuleNumbered(parsed, "103").position).toBe(0);
  });

  it("should count the numbered entries of the extracted document", () => {
    const parsed = extractedCoreRules();

    expect(parsed.coreRules).toHaveLength(1364);
    expect(new Set(parsed.coreRules.map((coreRule) => coreRule.number)).size).toBe(1364);
    expect(countByDepth(parsed)).toEqual({ 1: 274, 2: 464, 3: 432, 4: 191, 5: 3 });
  });

  it("should count the details of the extracted document", () => {
    const parsed = extractedCoreRules();
    const details = parsed.coreRules.flatMap((coreRule) => coreRule.details);

    expect(parsed.coreRules.filter((coreRule) => coreRule.details.length > 0)).toHaveLength(176);
    expect(details).toHaveLength(249);
    expect(details.filter((detail) => detail.kind === "bullet")).toHaveLength(139);
    expect(details.filter((detail) => detail.kind === "example")).toHaveLength(110);
  });

  it("should count the headings of the extracted document", () => {
    const headings = extractedCoreRules().coreRules.filter(
      (coreRule) => coreRule.kind === "heading",
    );

    expect(headings).toHaveLength(196);
    expect(headings.filter((coreRule) => coreRuleDepthOf(coreRule.number) === 1)).toHaveLength(112);
  });

  it("should read the title and date of the extracted document", () => {
    expect(extractedCoreRules().title).toBe("Riftbound Core Rules");
    expect(extractedCoreRules().publishedOn).toBe("2025-06-02");
  });

  it("should read the three headings that a single space follows", () => {
    const parsed = extractedCoreRules();

    for (const [number, body] of [
      ["000", "Golden and Silver Rules"],
      ["500", "Playing the Game"],
      ["700", "Additional Rules"],
    ] as const) {
      const coreRule = coreRuleNumbered(parsed, number);

      expect(coreRule.kind).toBe("heading");
      expect(coreRule.body).toBe(body);
      expect(coreRule.details).toEqual([]);
    }
  });

  it("should read the one entry the extracted document prints without a period", () => {
    expect(coreRuleNumbered(extractedCoreRules(), "553.5").body).toBe(
      "Otherwise, Focus passes to the next Relevant Player in Turn Order.",
    );
  });

  it("should hold the known details of three entries of the extracted document", () => {
    const parsed = extractedCoreRules();
    const mainDeck = coreRuleNumbered(parsed, "103.2");
    const chosenChampion = coreRuleNumbered(parsed, "103.2.a.2");
    const publicInformation = coreRuleNumbered(parsed, "108.2");

    expect(mainDeck.details.map((detail) => [detail.kind, detail.body])).toEqual([
      ["bullet", "1 Chosen Champion Unit"],
      ["bullet", "Units"],
      ["bullet", "Gear"],
      ["bullet", "Spells"],
    ]);
    expect(chosenChampion.details.map((detail) => detail.kind)).toEqual(["example", "example"]);
    expect(chosenChampion.details[0]?.body.startsWith("Loose Cannon has the tag Jinx.")).toBe(true);
    expect(chosenChampion.details[1]?.body.startsWith("Tibbers has the tag Annie,")).toBe(true);
    expect(publicInformation.details.map((detail) => [detail.kind, detail.body])).toEqual([
      ["example", "If a Unit is Buffed"],
      ["example", "If a Gear is Exhausted"],
      ["example", "Etc."],
    ]);
  });

  it("should list the seven bullets of the entry that introduces game objects", () => {
    const gameObjects = coreRuleNumbered(extractedCoreRules(), "123");

    expect(gameObjects.details).toHaveLength(7);
    expect(gameObjects.details.every((detail) => detail.kind === "bullet")).toBe(true);
    expect(gameObjects.details[0]?.body).toBe("Main Deck cards in any zone");
  });

  it("should keep the example that runs over a page break out of the body it is indented under", () => {
    const mistargeting = coreRuleNumbered(extractedCoreRules(), "559.3.c.4");

    expect(mistargeting.body.endsWith("is referred to as mistargeting.")).toBe(true);
    expect(mistargeting.body).not.toContain("base.");
    expect(mistargeting.details).toHaveLength(1);
    expect(mistargeting.details[0]?.kind).toBe("example");
  });

  it("should keep an Examples run whole across the blank lines between its four items", () => {
    const legalTargets = coreRuleNumbered(extractedCoreRules(), "563.2.c.4");

    expect(legalTargets.details.map((detail) => detail.kind)).toEqual([
      "example",
      "example",
      "example",
      "example",
    ]);
    expect(legalTargets.details[0]?.body).toBe(
      "An enemy unit at a battlefield is no longer a legal target if it is no longer an enemy, no longer a unit, or no longer at a battlefield.",
    );
    expect(legalTargets.details[3]?.body.startsWith("A spell that's played from hidden")).toBe(
      true,
    );
  });

  it("should call the eleven long entries that end without punctuation rules", () => {
    const neither = extractedCoreRules().coreRules.filter(
      (coreRule) =>
        coreRule.body.length > HEADING_LENGTH_LIMIT && !SENTENCE_END.test(coreRule.body),
    );

    expect(neither.map((coreRule) => coreRule.number)).toEqual(LONG_UNPUNCTUATED_BODIES);
    expect(neither.map((coreRule) => coreRule.kind)).toEqual(
      LONG_UNPUNCTUATED_BODIES.map(() => "rule"),
    );
  });
});
