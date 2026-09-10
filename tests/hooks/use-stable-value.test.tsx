import { renderHook } from "@testing-library/react-native";

import { useStableValue } from "@/hooks/use-stable-value";

interface Criteria {
  readonly typeIds: readonly string[];
}

describe("useStableValue", () => {
  it("keeps the first reference while the next value is structurally equal", async () => {
    const { result, rerender } = await renderHook(
      (criteria: Criteria) => useStableValue(criteria),
      { initialProps: { typeIds: ["Unit"] } },
    );
    const first = result.current;

    await rerender({ typeIds: ["Unit"] });

    expect(result.current).toBe(first);
  });

  it("adopts the next reference once a value differs", async () => {
    const { result, rerender } = await renderHook(
      (criteria: Criteria) => useStableValue(criteria),
      { initialProps: { typeIds: ["Unit"] } },
    );
    const first = result.current;
    const next: Criteria = { typeIds: ["Spell"] };

    await rerender(next);

    expect(result.current).not.toBe(first);
    expect(result.current).toEqual(next);
  });
});
