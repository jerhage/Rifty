import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCoreRules } from "../../scripts/core-rules-parse";
import type { CoreRule, CoreRulesDocument } from "../../scripts/core-rules-parse";
import { buildCoreRulesSeed, coreRulesSeedVersion } from "../../scripts/core-rules-seed";
import type { CoreRulesSeed } from "../../scripts/core-rules-seed";

const EXTRACTED_TEXT_PATH = join(__dirname, "../../data/rules/core-rules.txt");

function extractedText(): string {
  try {
    return readFileSync(EXTRACTED_TEXT_PATH, "utf8");
  } catch (cause) {
    throw new Error(
      `The measured counts need ${EXTRACTED_TEXT_PATH}, produced by: pdftotext -layout data/rules/core-rules.pdf data/rules/core-rules.txt`,
      { cause },
    );
  }
}

let extracted: CoreRulesSeed | null = null;

function extractedSeed(): CoreRulesSeed {
  if (extracted === null) extracted = buildCoreRulesSeed(parseCoreRules(extractedText()));

  return extracted;
}

function coreRuleOf(overrides: Partial<CoreRule> = {}): CoreRule {
  return {
    number: "103",
    parentNumber: null,
    position: 0,
    kind: "rule",
    body: "A rule body.",
    details: [],
    ...overrides,
  };
}

function documentOf(...coreRules: readonly CoreRule[]): CoreRulesDocument {
  return { title: "Riftbound Core Rules", publishedOn: "2025-06-02", coreRules };
}

function withBody(document: CoreRulesDocument, body: string): CoreRulesDocument {
  return {
    ...document,
    coreRules: document.coreRules.map((coreRule, index) =>
      index === 0 ? { ...coreRule, body } : coreRule,
    ),
  };
}

describe("core rules seed", () => {
  it("should name the published date as the edition's own id", () => {
    expect(extractedSeed().coreRulesEditions).toEqual([
      { id: "2025-06-02", title: "Riftbound Core Rules", publishedOn: "2025-06-02" },
    ]);
  });

  it("should count the core rules of the extracted document", () => {
    const { coreRules } = extractedSeed();

    expect(coreRules).toHaveLength(1364);
    expect(coreRules.filter((row) => row.kind === "heading")).toHaveLength(196);
  });

  it("should count the details of the extracted document", () => {
    const { coreRuleDetails } = extractedSeed();

    expect(coreRuleDetails).toHaveLength(249);
    expect(coreRuleDetails.filter((row) => row.kind === "bullet")).toHaveLength(139);
    expect(coreRuleDetails.filter((row) => row.kind === "example")).toHaveLength(110);
  });

  it("should give every core rule a parent the seed also holds", () => {
    const { coreRules } = extractedSeed();
    const numbers = new Set(coreRules.map((row) => row.number));
    const dangling = coreRules.filter(
      (row) =>
        row.parentNumber !== null &&
        row.parentNumber !== undefined &&
        !numbers.has(row.parentNumber),
    );

    expect(dangling.map((row) => row.number)).toEqual([]);
    expect(coreRules.filter((row) => row.parentNumber === null)).toHaveLength(274);
  });

  it("should give every detail a core rule the seed also holds", () => {
    const { coreRuleDetails, coreRules } = extractedSeed();
    const numbers = new Set(coreRules.map((row) => row.number));
    const orphaned = coreRuleDetails.filter((row) => !numbers.has(row.ruleNumber));

    expect(orphaned.map((row) => `${row.ruleNumber} ${row.position}`)).toEqual([]);
  });

  it("should carry document order as a dense position starting at zero", () => {
    const positions = extractedSeed().coreRules.map((row) => row.position);

    expect(positions).toEqual(positions.map((_, index) => index));
  });

  it("should number each rule's details densely from zero", () => {
    const byRule = new Map<string, number[]>();

    for (const row of extractedSeed().coreRuleDetails)
      byRule.set(row.ruleNumber, [...(byRule.get(row.ruleNumber) ?? []), row.position]);

    const misnumbered = [...byRule].filter(
      ([, positions]) => !positions.every((position, index) => position === index),
    );

    expect(misnumbered.map(([ruleNumber]) => ruleNumber)).toEqual([]);
    expect(byRule.size).toBe(176);
  });

  it("should name the core rule whose row its insert schema refuses", () => {
    expect(() =>
      buildCoreRulesSeed(documentOf(coreRuleOf({ number: "104", position: -1 }))),
    ).toThrow(/The core rule 104 does not satisfy its insert schema/);
  });

  it("should name the detail whose row its insert schema refuses", () => {
    const document = documentOf(
      coreRuleOf({ details: [{ position: 0, kind: "bullet", body: "  " }] }),
    );

    expect(() => buildCoreRulesSeed(document)).toThrow(
      /The detail 0 of core rule 103 does not satisfy its insert schema/,
    );
  });

  it("should hash the same document to the same version twice", () => {
    const text = extractedText();

    expect(coreRulesSeedVersion(buildCoreRulesSeed(parseCoreRules(text)))).toBe(
      coreRulesSeedVersion(buildCoreRulesSeed(parseCoreRules(text))),
    );
  });

  it("should hash a changed body to a different version", () => {
    const document = parseCoreRules(extractedText());

    expect(
      coreRulesSeedVersion(
        buildCoreRulesSeed(withBody(document, "A body the document does not print")),
      ),
    ).not.toBe(coreRulesSeedVersion(buildCoreRulesSeed(document)));
  });
});
