import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { createAppDependencies, type AppDependencies } from "./dependencies";

const AppDependenciesContext = createContext<AppDependencies | null>(null);

function AppDependenciesProvider({ children }: PropsWithChildren) {
  const [dependencies, setDependencies] = useState<AppDependencies | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void createAppDependencies()
      .then((loadedDependencies) => {
        if (isCurrent) setDependencies(loadedDependencies);
      })
      .catch((caughtError: unknown) => {
        console.error("Could not open the card catalog.", caughtError);
        if (isCurrent) setError(asError(caughtError));
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Could not open your card catalog.</Text>
      </View>
    );
  }

  if (!dependencies) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AppDependenciesContext.Provider value={dependencies}>
      {children}
    </AppDependenciesContext.Provider>
  );
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
