import { Page } from "@/shared/page";

describe("Page", () => {
  it("should keep items immutable and carry the latest page's continuation state when appended", () => {
    const first = Page.create(["one", "two"], true);
    const combined = first.append(Page.create(["three"], false));

    expect(combined).toEqual(Page.create(["one", "two", "three"], false));
    expect(first.items).toEqual(["one", "two"]);
    expect(() => (first.items as string[]).push("four")).toThrow("not extensible");
  });

  it("should map items without changing continuation state, and give an empty page no continuation", () => {
    expect(Page.create([1, 2], true).map((value) => `${value}`)).toEqual(
      Page.create(["1", "2"], true),
    );
    expect(Page.empty<number>()).toEqual(Page.create([], false));
  });
});
