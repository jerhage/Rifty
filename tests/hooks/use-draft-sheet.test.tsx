import { act, renderHook } from "@testing-library/react-native";

import { useDraftSheet } from "@/hooks/use-draft-sheet";

interface Filters {
  readonly domainIds: readonly string[];
  readonly typeIds: readonly string[];
}

const INITIAL: Filters = { domainIds: ["Fury"], typeIds: [] };

function createSheet() {
  return renderHook(() => useDraftSheet<Filters>(() => INITIAL));
}

describe("useDraftSheet", () => {
  it("should start closed with the draft matching the applied value", async () => {
    const { result } = await createSheet();

    expect(result.current.isOpen).toBe(false);
    expect(result.current.applied).toEqual(INITIAL);
    expect(result.current.draft).toEqual(INITIAL);
  });

  it("should leave the applied value untouched while the draft is edited", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft((current) => ({ ...current, typeIds: ["Unit"] }));
    });

    expect(result.current.draft).toEqual({ domainIds: ["Fury"], typeIds: ["Unit"] });
    expect(result.current.applied).toEqual(INITIAL);
  });

  it("should promote the draft to applied and close when applied", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft((current) => ({ ...current, typeIds: ["Unit"] }));
    });
    await act(async () => {
      result.current.apply();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.applied).toEqual({ domainIds: ["Fury"], typeIds: ["Unit"] });
    expect(result.current.draft).toEqual({ domainIds: ["Fury"], typeIds: ["Unit"] });
  });

  it("should discard the draft edit and close when dismissed", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft(() => ({ domainIds: [], typeIds: ["Spell"] }));
    });
    await act(async () => {
      result.current.dismiss();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.applied).toEqual(INITIAL);
    expect(result.current.draft).toEqual(INITIAL);
  });

  it("should restore the draft from the applied value when reopened after a dismissal", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft(() => ({ domainIds: [], typeIds: ["Spell"] }));
    });
    await act(async () => {
      result.current.dismiss();
    });
    await act(async () => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.draft).toEqual(INITIAL);
  });

  it("should reopen on the value a previous apply confirmed", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft(() => ({ domainIds: ["Calm"], typeIds: ["Gear"] }));
    });
    await act(async () => {
      result.current.apply();
    });
    await act(async () => {
      result.current.open();
    });

    expect(result.current.draft).toEqual({ domainIds: ["Calm"], typeIds: ["Gear"] });
  });

  it("should write both the applied value and the draft when settled, leaving the sheet alone", async () => {
    const { result } = await createSheet();
    const next: Filters = { domainIds: ["Mind"], typeIds: [] };

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft(() => ({ domainIds: [], typeIds: ["Spell"] }));
    });
    await act(async () => {
      result.current.settle(next);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.applied).toEqual(next);
    expect(result.current.draft).toEqual(next);
  });

  it("should pass the current draft to an edit so a reset can preserve chosen facets", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft(() => ({ domainIds: ["Calm"], typeIds: ["Unit"] }));
    });
    await act(async () => {
      result.current.editDraft((current) => ({ domainIds: current.domainIds, typeIds: [] }));
    });

    expect(result.current.draft).toEqual({ domainIds: ["Calm"], typeIds: [] });
    expect(result.current.applied).toEqual(INITIAL);
  });

  it("should apply the last of several draft edits made before a render", async () => {
    const { result } = await createSheet();

    await act(async () => {
      result.current.open();
    });
    await act(async () => {
      result.current.editDraft((current) => ({
        ...current,
        typeIds: [...current.typeIds, "Unit"],
      }));
      result.current.editDraft((current) => ({
        ...current,
        typeIds: [...current.typeIds, "Spell"],
      }));
    });

    expect(result.current.draft).toEqual({ domainIds: ["Fury"], typeIds: ["Unit", "Spell"] });
  });
});
