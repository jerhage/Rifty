import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { match } from "ts-pattern";

import { useAnnouncement } from "@/hooks/use-announcement";

import { createAppDependencies, type AppDependencies } from "./dependencies";

type AppStartup =
  | { readonly type: "opening" }
  | { readonly type: "failed"; readonly error: Error }
  | { readonly type: "ready"; readonly dependencies: AppDependencies };

const AppDependenciesContext = createContext<AppDependencies | null>(null);
const OPENING_LABEL = "Preparing your card catalog. This can take a moment on first launch.";
const READY_MESSAGE = "Your card catalog is ready.";
const OPEN_FAILED_MESSAGE = "Could not open your card catalog.";

function AppDependenciesProvider({ children }: PropsWithChildren) {
  const [startup, setStartup] = useState<AppStartup>({ type: "opening" });
  const announce = useAnnouncement();

  useEffect(() => {
    let isCurrent = true;
    void createAppDependencies()
      .then((dependencies) => {
        if (!isCurrent) return;
        announce(READY_MESSAGE);
        setStartup({ dependencies, type: "ready" });
      })
      .catch((caughtError: unknown) => {
        console.error("Could not open the card catalog.", caughtError);
        if (!isCurrent) return;
        announce(OPEN_FAILED_MESSAGE, "interrupting");
        setStartup({ error: asError(caughtError), type: "failed" });
      });

    return () => {
      isCurrent = false;
    };
  }, [announce]);

  return match(startup)
    .with({ type: "opening" }, () => (
      <View
        accessibilityLabel={OPENING_LABEL}
        accessibilityRole="progressbar"
        accessible
        style={styles.centered}
      >
        <ActivityIndicator />
      </View>
    ))
    .with({ type: "failed" }, () => (
      <View style={styles.centered}>
        <Text accessibilityLiveRegion="assertive" accessibilityRole="alert">
          {OPEN_FAILED_MESSAGE}
        </Text>
      </View>
    ))
    .with({ type: "ready" }, ({ dependencies }) => (
      <AppDependenciesContext.Provider value={dependencies}>
        {children}
      </AppDependenciesContext.Provider>
    ))
    .exhaustive();
}

function useAppDependencies(): AppDependencies {
  const dependencies = useContext(AppDependenciesContext);
  if (!dependencies) throw new Error("AppDependenciesProvider is required.");
  return dependencies;
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error("Unknown database initialization error.");
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});

export { AppDependenciesProvider, useAppDependencies };
