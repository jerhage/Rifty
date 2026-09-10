import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { match } from "ts-pattern";

import { createAppDependencies, type AppDependencies } from "./dependencies";

type AppStartup =
  | { readonly type: "opening" }
  | { readonly type: "failed"; readonly error: Error }
  | { readonly type: "ready"; readonly dependencies: AppDependencies };

const AppDependenciesContext = createContext<AppDependencies | null>(null);

function AppDependenciesProvider({ children }: PropsWithChildren) {
  const [startup, setStartup] = useState<AppStartup>({ type: "opening" });

  useEffect(() => {
    let isCurrent = true;
    void createAppDependencies()
      .then((dependencies) => {
        if (isCurrent) setStartup({ dependencies, type: "ready" });
      })
      .catch((caughtError: unknown) => {
        console.error("Could not open the card catalog.", caughtError);
        if (isCurrent) setStartup({ error: asError(caughtError), type: "failed" });
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return match(startup)
    .with({ type: "opening" }, () => (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    ))
    .with({ type: "failed" }, () => (
      <View style={styles.centered}>
        <Text>Could not open your card catalog.</Text>
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
