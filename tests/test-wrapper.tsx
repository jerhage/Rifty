import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Dimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface TestFrame {
  readonly height: number;
  readonly width: number;
}

function windowOf({ height, width }: TestFrame) {
  jest
    .spyOn(Dimensions, "get")
    .mockReturnValue({ fontScale: 1, height, scale: 2, width } as ReturnType<
      typeof Dimensions.get
    >);
}

function createTestWrapper(frame?: TestFrame) {
  if (frame !== undefined) windowOf(frame);

  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false, retryDelay: 0 },
      queries: { gcTime: 0, retry: false, retryDelay: 0 },
    },
  });

  return function TestWrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        {frame === undefined ? (
          children
        ) : (
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: frame.width, height: frame.height },
              insets: { bottom: 0, left: 0, right: 0, top: 0 },
            }}
          >
            {children}
          </SafeAreaProvider>
        )}
      </QueryClientProvider>
    );
  };
}

export { createTestWrapper };
export type { TestFrame };
