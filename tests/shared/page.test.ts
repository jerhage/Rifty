import { Page } from "@/shared/page";

describe("Page", () => {
  it("keeps items immutable and carries the latest page's continuation state when appended", () => {
    const first = Page.create(["one", "two"], true);
    const combined = first.append(Page.create(["three"], false));

    expect(combined).toEqual(Page.create(["one", "two", "three"], false));
    expect(first.items).toEqual(["one", "two"]);
    expect(() => (first.items as string[]).push("four")).toThrow("not extensible");
  });

  it("maps items without changing continuation state", () => {
    expect(Page.create([1, 2], true).map((value) => `${value}`)).toEqual(
      Page.create(["1", "2"], true),
    );
    expect(Page.empty<number>()).toEqual(Page.create([], false));
  });
});
