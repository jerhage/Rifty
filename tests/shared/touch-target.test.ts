import { TouchTarget } from "@/constants/theme";

describe("TouchTarget", () => {
  it("should slop every undersized face out to at least the minimum", () => {
    const short = Array.from({ length: TouchTarget.minimum }, (_, faceSize) => faceSize);

    const reached = short.map((faceSize) => faceSize + 2 * TouchTarget.slop(faceSize));

    expect(reached.every((size) => size >= TouchTarget.minimum)).toBe(true);
  });

  it("should ask for no slop once the face already meets the minimum", () => {
    expect(TouchTarget.slop(TouchTarget.minimum)).toBe(0);
    expect(TouchTarget.slop(TouchTarget.minimum + 20)).toBe(0);
  });
});
