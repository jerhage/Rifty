import { QueryClient } from "@tanstack/react-query";

const GC_TIME_MS = 60 * 60 * 1000;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { gcTime: GC_TIME_MS, retry: 0 },
    },
  });
}

export { createQueryClient };
