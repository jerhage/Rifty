import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

function createTestWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false, retryDelay: 0 },
      queries: { gcTime: 0, retry: false, retryDelay: 0 },
    },
  });

  return function TestWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export { createTestWrapper };
