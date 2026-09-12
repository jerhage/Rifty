import { render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { Skeleton } from "@/components/ui/atoms/skeleton";

type Rendered = Awaited<ReturnType<typeof render>>;

function opacityOf(rendered: Rendered): unknown {
  const tree = rendered.toJSON();
  if (tree === null || Array.isArray(tree)) throw new Error("Expected one skeleton node.");
  const style: unknown = tree.props.style;

  return (Array.isArray(style) ? style : [style])
    .map((layer: unknown) =>
      layer !== null && typeof layer === "object" && "opacity" in layer
        ? (layer as { readonly opacity: unknown }).opacity
        : undefined,
    )
    .find((value) => value !== undefined);
}

describe("Skeleton", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should hold a steady opacity when the platform asks for reduced motion", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const rendered = await render(<Skeleton />);

    await waitFor(() => expect(opacityOf(rendered)).toBe(0.85));
  });

  it("should start the pulse at its dim end when the platform asks for no reduction", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const rendered = await render(<Skeleton />);

    await waitFor(() => expect(opacityOf(rendered)).toBe(0.4));
  });
});
