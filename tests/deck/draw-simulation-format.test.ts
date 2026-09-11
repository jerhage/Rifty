import { MULLIGAN_LIMIT } from "@/features/analysis/draw-simulation";
import {
  handLabel,
  mulliganActionLabel,
  mulliganCounterLabel,
  mulliganDisabled,
  mulliganStatusMessage,
} from "@/features/deck/presentation/draw-simulation-format";

describe("hand label", () => {
  it("should name the hand number while the mulligan is unused", () => {
    expect(handLabel({ type: "awaitingSelection" }, 1)).toBe("Opening hand · Hand 1");
  });

  it("should not mention a mulligan while cards are merely chosen", () => {
    expect(handLabel({ type: "ready", count: 2 }, 3)).toBe("Opening hand · Hand 3");
  });

  it("should report how many cards a spent mulligan replaced", () => {
    expect(handLabel({ type: "spent", replaced: 2 }, 4)).toBe(
      "Opening hand · Hand 4 · Mulliganed 2",
    );
  });

  it("should report a spent mulligan that replaced nothing", () => {
    expect(handLabel({ type: "spent", replaced: 0 }, 2)).toBe(
      "Opening hand · Hand 2 · Mulliganed 0",
    );
  });
});

describe("mulligan action label", () => {
  it("should invite a mulligan before anything is chosen", () => {
    expect(mulliganActionLabel({ type: "awaitingSelection" })).toBe("Mulligan");
  });

  it("should count the chosen cards", () => {
    expect(mulliganActionLabel({ type: "ready", count: 1 })).toBe("Mulligan 1");
    expect(mulliganActionLabel({ type: "ready", count: MULLIGAN_LIMIT })).toBe("Mulligan 2");
  });

  it("should say the mulligan is spent once it has been used", () => {
    expect(mulliganActionLabel({ type: "spent", replaced: 1 })).toBe("Mulligan spent");
  });
});

describe("mulligan availability", () => {
  it("should refuse a mulligan with nothing chosen", () => {
    expect(mulliganDisabled({ type: "awaitingSelection" })).toBe(true);
  });

  it("should allow a mulligan once cards are chosen", () => {
    expect(mulliganDisabled({ type: "ready", count: 1 })).toBe(false);
    expect(mulliganDisabled({ type: "ready", count: MULLIGAN_LIMIT })).toBe(false);
  });

  it("should refuse a second mulligan", () => {
    expect(mulliganDisabled({ type: "spent", replaced: 0 })).toBe(true);
  });
});

describe("mulligan counter label", () => {
  it("should offer the whole limit before anything is chosen", () => {
    expect(mulliganCounterLabel({ type: "awaitingSelection" })).toBe("2 of 2 left");
  });

  it("should count down as cards are chosen", () => {
    expect(mulliganCounterLabel({ type: "ready", count: 1 })).toBe("1 of 2 left");
  });

  it("should reach zero on the last permitted selection", () => {
    expect(mulliganCounterLabel({ type: "ready", count: MULLIGAN_LIMIT })).toBe("0 of 2 left");
  });

  it("should leave nothing once the mulligan is spent", () => {
    expect(mulliganCounterLabel({ type: "spent", replaced: 2 })).toBe("0 left");
  });
});

describe("mulligan status message", () => {
  const noNotice = { type: "none" } as const;

  it("should prompt for a selection while nothing is chosen", () => {
    expect(mulliganStatusMessage({ type: "awaitingSelection" }, noNotice)).toEqual({
      type: "note",
      text: "Tap up to two cards to mulligan",
    });
  });

  it("should count the cards a ready mulligan would redraw", () => {
    expect(mulliganStatusMessage({ type: "ready", count: 1 }, noNotice)).toEqual({
      type: "note",
      text: "Redraws 1",
    });
    expect(mulliganStatusMessage({ type: "ready", count: MULLIGAN_LIMIT }, noNotice)).toEqual({
      type: "note",
      text: "Redraws 2",
    });
  });

  it("should report a spent mulligan and rule out a second", () => {
    expect(mulliganStatusMessage({ type: "spent", replaced: 2 }, noNotice)).toEqual({
      type: "note",
      text: "You mulliganed 2. No second mulligan.",
    });
  });

  it("should explain a spent mulligan that redrew nothing", () => {
    expect(mulliganStatusMessage({ type: "spent", replaced: 0 }, noNotice)).toEqual({
      type: "note",
      text: "The deck ran out before the redraw. No second mulligan.",
    });
  });

  it("should warn when the selection limit is reached", () => {
    expect(
      mulliganStatusMessage({ type: "ready", count: MULLIGAN_LIMIT }, { type: "selectionLimit" }),
    ).toEqual({
      type: "warning",
      text: "Two is the mulligan limit. Tap a chosen card again to deselect it.",
    });
  });

  it("should warn when a second mulligan is attempted", () => {
    expect(
      mulliganStatusMessage({ type: "spent", replaced: 1 }, { type: "mulliganSpent" }),
    ).toEqual({
      type: "warning",
      text: "One mulligan per game — this hand is set.",
    });
  });

  it("should let a notice outrank the running note", () => {
    expect(
      mulliganStatusMessage({ type: "awaitingSelection" }, { type: "selectionLimit" }).text,
    ).not.toBe("Tap up to two cards to mulligan");
  });
});
