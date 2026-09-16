import { render, screen } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { CoreRulesEdition } from "@/features/rules/core-rules-edition";
import { CoreRulesScreen } from "@/features/rules/presentation/screens/core-rules-screen";

import { createSqliteScenarioStore, type SqliteScenarioStore } from "../sqlite-scenario-store";
import { seededCoreRules } from "./fixtures";

const EDITION: CoreRulesEdition = { title: "Riftbound Core Rules", publishedOn: "2025-06-02" };

function SafeArea({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { bottom: 0, left: 0, right: 0, top: 0 },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe("CoreRulesScreen", () => {
  let store: SqliteScenarioStore;

  beforeEach(() => {
    store = createSqliteScenarioStore();
  });

  afterEach(() => {
    store.close();
  });

  it("should head the document with its edition, its date and what it holds", async () => {
    const coreRules = await seededCoreRules(store);

    await render(<CoreRulesScreen coreRules={coreRules} edition={EDITION} />, {
      wrapper: SafeArea,
    });

    expect(screen.getByRole("header", { name: "Riftbound Core Rules" })).toBeTruthy();
    expect(screen.getByText("Published 2025-06-02")).toBeTruthy();
    expect(screen.getByText("5 chapters · 1168 numbered rules")).toBeTruthy();
  });

  it("should open the document at its first entry", async () => {
    const coreRules = await seededCoreRules(store);

    await render(<CoreRulesScreen coreRules={coreRules} edition={EDITION} />, {
      wrapper: SafeArea,
    });

    expect(screen.getByText("Golden and Silver Rules")).toBeTruthy();
  });
});
