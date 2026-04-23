import { QueryClient } from "@tanstack/react-query"
import { QUERY_CACHE_MAX_AGE_MS } from "./queryPersistence"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE_MS,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
