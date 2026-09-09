import { shuffle } from "@/shared/shuffle";

function sequence(values: readonly number[]): () => number {
  let index = 0;

  return () => values[index++ % values.length];
}

describe("shuffle", () => {
  it("returns the same multiset of items", () => {
    const items = ["a", "b", "c", "d", "e", "a"];
    const shuffled = shuffle(items, sequence([0.7, 0.1, 0.9, 0.35, 0.5]));

    expect([...shuffled].sort()).toEqual([...items].sort());
    expect(items).toEqual(["a", "b", "c", "d", "e", "a"]);
  });

  it("produces the same order for the same random sequence", () => {
    const items = [1, 2, 3, 4, 5];
    const draws = [0.12, 0.87, 0.41, 0.64];

    expect(shuffle(items, sequence(draws))).toEqual(shuffle(items, sequence(draws)));
  });

  it("places each item where the drawn index says", () => {
    expect(shuffle(["a", "b", "c"], sequence([0, 0]))).toEqual(["b", "c", "a"]);
  });

  it("handles empty and single-element arrays without drawing", () => {
    const nextRandom = jest.fn(() => 0.5);

    expect(shuffle([], nextRandom)).toEqual([]);
    expect(shuffle(["only"], nextRandom)).toEqual(["only"]);
    expect(nextRandom).not.toHaveBeenCalled();
  });
});
