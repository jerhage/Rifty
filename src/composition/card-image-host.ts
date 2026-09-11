import Constants from "expo-constants";

const IMAGE_HOST = process.env.EXPO_PUBLIC_CARD_IMAGE_HOST;
const IMAGE_PORT = process.env.EXPO_PUBLIC_CARD_IMAGE_PORT ?? "8787";

/**
 * Expo Go fills in `hostUri`; a development build launched straight onto a device does not, so it
 * would fall back to `localhost` and ask the device for its own images.
 */
function cardImageBaseUrl(): string {
  const [servedHost] = (Constants.expoConfig?.hostUri ?? "").split(":");
  const host = IMAGE_HOST ?? (servedHost && servedHost.length > 0 ? servedHost : "localhost");

  return `http://${host}:${IMAGE_PORT}`;
}

export { cardImageBaseUrl };
