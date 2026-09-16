import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import type { CoreRule } from "@/features/rules/core-rule";
import type { CoreRuleLister } from "@/features/rules/core-rule-lister";
import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import type { CoreRulesEditionFinder } from "@/features/rules/core-rules-edition-finder";
import { CoreRulesData } from "@/features/rules/presentation/data/core-rules-data";

import { coreRuleDocument } from "./fixtures";
import { createTestWrapper } from "../test-wrapper";

const STORE_FAILURE = new Error("The store is unavailable.");
const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };
const DOCUMENT = coreRuleDocument([{ number: "000", body: "The golden rule." }]);

const editionFound: CoreRulesEditionFinder = { get: () => Promise.resolve(EDITION) };
const editionMissing: CoreRulesEditionFinder = { get: () => Promise.resolve(null) };
const documentFound: CoreRuleLister = { getAll: () => Promise.resolve(DOCUMENT) };
const documentMissing: CoreRuleLister = { getAll: () => Promise.resolve([]) };

async function renderCoreRules(
  coreRuleLister: CoreRuleLister,
  coreRulesEditionFinder: CoreRulesEditionFinder,
) {
  return await render(
    <CoreRulesData coreRuleLister={coreRuleLister} coreRulesEditionFinder={coreRulesEditionFinder}>
      {({ coreRules, edition }) => <Text>{`${edition.title} — ${coreRules.length} entries`}</Text>}
    </CoreRulesData>,
    { wrapper: createTestWrapper() },
  );
}

describe("CoreRulesData", () => {
  it("should render the document and its edition once both reads settle", async () => {
    await renderCoreRules(documentFound, editionFound);

    expect(await screen.findByText("Riftbound Core Rules — 1 entries")).toBeTruthy();
  });

  it("should render nothing but the loading state before the reads settle", async () => {
    await renderCoreRules(
      { getAll: () => new Promise<readonly CoreRule[]>(() => {}) },
      { get: () => new Promise<CoreRulesEdition | null>(() => {}) },
    );

    expect(screen.queryByText(/Riftbound Core Rules/)).toBeNull();
    expect(screen.queryByText("Could not load the core rules.")).toBeNull();
    expect(screen.queryByText("The core rules are not on this device yet.")).toBeNull();
  });

  it("should report a failed document read and read again when the retry is pressed", async () => {
    let attempts = 0;
    const flaky: CoreRuleLister = {
      getAll: () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(STORE_FAILURE) : Promise.resolve(DOCUMENT);
      },
    };
    await renderCoreRules(flaky, editionFound);
    await screen.findByText("Could not load the core rules.");

    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("Riftbound Core Rules — 1 entries")).toBeTruthy();
  });

  it("should report a failed edition read as a failure", async () => {
    await renderCoreRules(documentFound, { get: () => Promise.reject(STORE_FAILURE) });

    expect(await screen.findByText("Could not load the core rules.")).toBeTruthy();
  });

  it("should report an empty document as rules not yet on the device", async () => {
    await renderCoreRules(documentMissing, editionFound);

    expect(await screen.findByText("The core rules are not on this device yet.")).toBeTruthy();
    expect(screen.queryByText("Could not load the core rules.")).toBeNull();
  });

  it("should report a missing edition as rules not yet on the device", async () => {
    await renderCoreRules(documentFound, editionMissing);

    expect(await screen.findByText("The core rules are not on this device yet.")).toBeTruthy();
    expect(screen.queryByText("Could not load the core rules.")).toBeNull();
  });
});
