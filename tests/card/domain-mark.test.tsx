import { render, screen } from "@testing-library/react-native";

import { domainCode } from "@/features/card/presentation/card-taxonomy-format";
import { DomainBar } from "@/features/card/presentation/components/domain-bar";
import { DomainMarks } from "@/features/card/presentation/components/domain-mark";
import { ORDERED_DOMAINS } from "@/features/card/value-objects/card-domain";

describe("domainCode", () => {
  it("should give every domain a letter of its own, since four of the seven share an initial", () => {
    const codes = ORDERED_DOMAINS.map(domainCode);

    expect(new Set(codes).size).toBe(ORDERED_DOMAINS.length);
  });
});

describe("DomainBar", () => {
  it("should draw nothing for a card with no domain", async () => {
    await render(<DomainBar domainIds={[]} />);

    expect(screen.toJSON()).toBeNull();
  });
});

describe("DomainMarks", () => {
  it("should letter each domain where a bar across the art would not fit", async () => {
    await render(<DomainMarks domainIds={["Fury", "Order"]} />);

    expect(screen.getByText("F", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("O", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("F")).toBeNull();
  });

  it("should draw nothing for a card with no domain", async () => {
    await render(<DomainMarks domainIds={[]} />);

    expect(screen.toJSON()).toBeNull();
  });
});
