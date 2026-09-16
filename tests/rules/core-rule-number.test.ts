import { coreRuleDepthOf } from "@/features/rules/value-objects/core-rule-number";

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
