import { useSyncExternalStore } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : "light";
}

function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): true {
  return true;
}

function getServerSnapshot(): false {
  return false;
}

export { useColorScheme };
