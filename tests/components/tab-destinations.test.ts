import { TAB_DESTINATIONS, railCenteringStyle } from "@/components/app-shell/tab-destinations";

describe("the tab destinations", () => {
  it("should stand in the order the shell draws them, with Saved last", () => {
    expect(TAB_DESTINATIONS.map((destination) => destination.title)).toEqual([
      "Cards",
      "Decks",
      "Rules",
      "Saved",
    ]);
    expect(TAB_DESTINATIONS.at(-1)?.name).toBe("saved");
  });

  it("should give each destination an identity nothing else uses", () => {
    const identities = TAB_DESTINATIONS.map((destination) => destination.identity);

    expect(new Set(identities).size).toBe(TAB_DESTINATIONS.length);
  });

  it("should center the rail by pushing off the first destination and the last, and no other", () => {
    expect(railCenteringStyle(0)).toEqual({ marginTop: "auto" });
    expect(railCenteringStyle(TAB_DESTINATIONS.length - 1)).toEqual({ marginBottom: "auto" });
    expect(TAB_DESTINATIONS.slice(1, -1).map((_, at) => railCenteringStyle(at + 1))).toEqual([
      undefined,
      undefined,
    ]);
  });
});
