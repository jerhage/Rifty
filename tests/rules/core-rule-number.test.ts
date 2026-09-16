import {
  coreRuleAncestorNumbersOf,
  coreRuleDepthOf,
  isCoreRuleChapterNumber,
} from "@/features/rules/value-objects/core-rule-number";

describe("coreRuleDepthOf", () => {
  it("should count the segments of a five-deep number", () => {
    const number = "626.1.d.1.a";

    expect(coreRuleDepthOf(number)).toBe(5);
    expect(coreRuleDepthOf(number)).toBe(number.split(".").length);
  });

  it("should count a top-level number as one", () => {
    expect(coreRuleDepthOf("000")).toBe(1);
  });
});

describe("coreRuleAncestorNumbersOf", () => {
  it("should list the enclosing numbers of a five-deep number, outermost first", () => {
    expect(coreRuleAncestorNumbersOf("626.1.d.1.a")).toEqual([
      "626",
      "626.1",
      "626.1.d",
      "626.1.d.1",
    ]);
  });

  it("should give a top-level number no ancestors", () => {
    expect(coreRuleAncestorNumbersOf("000")).toEqual([]);
  });
});

describe("isCoreRuleChapterNumber", () => {
  it("should read a top-level century boundary as a chapter", () => {
    expect(["000", "100", "500", "600", "700"].map(isCoreRuleChapterNumber)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("should not read a top-level number off the century boundary as a chapter", () => {
    expect(["101", "104", "717", "553"].map(isCoreRuleChapterNumber)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it("should not read a number below the top level as a chapter", () => {
    expect(isCoreRuleChapterNumber("100.1")).toBe(false);
    expect(isCoreRuleChapterNumber("103.2.a")).toBe(false);
  });
});
