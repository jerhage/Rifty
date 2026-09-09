import Constants from "expo-constants";

const IMAGE_PORT = process.env.EXPO_PUBLIC_CARD_IMAGE_PORT ?? "8787";

function cardImageBaseUrl(): string {
  const [host] = (Constants.expoConfig?.hostUri ?? "").split(":");

  return `http://${host && host.length > 0 ? host : "localhost"}:${IMAGE_PORT}`;
}

export { cardImageBaseUrl };
