import { render, screen } from "@testing-library/react-native";

import { domainCode } from "@/features/card/presentation/card-taxonomy-format";
import { DomainBand } from "@/features/card/presentation/components/domain-band";
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

describe("DomainBand", () => {
  it("should draw each domain as a letter, so two domains of the same hue still read apart", async () => {
    await render(<DomainBand domainIds={["Chaos", "Mind"]} />);

    expect(screen.getByText("X", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("M", { includeHiddenElements: true })).toBeTruthy();
  });

  it("should hold its letters apart when a card carries more domains than any printed one does", async () => {
    await render(<DomainBand domainIds={["Body", "Calm", "Colorless"]} />);

    const letters = ["B", "C", "N"].map((letter) =>
      screen.getByText(letter, { includeHiddenElements: true }),
    );

    expect(letters).toHaveLength(3);
  });

  it("should keep its letters out of the accessibility tree, where the label names the domain", async () => {
    await render(<DomainBand domainIds={["Chaos", "Mind"]} />);

    expect(screen.queryByText("X")).toBeNull();
    expect(screen.queryByText("M")).toBeNull();
  });

  it("should draw nothing for a card with no domain", async () => {
    await render(<DomainBand domainIds={[]} />);

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
