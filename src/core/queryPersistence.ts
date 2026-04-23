import { queryKeys } from "@/core/api"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"

export const QUERY_CACHE_MAX_AGE_MS = 60 * 60 * 1000
export const QUERY_CACHE_BUSTER = "skrivla-query-cache-v1"
export const QUERY_CACHE_STORAGE_KEY = "skrivla-query-cache"

export function createQueryCachePersister() {
  return createSyncStoragePersister({
    key: QUERY_CACHE_STORAGE_KEY,
    storage: window.localStorage,
  })
}

export function shouldPersistQuery(queryKey: readonly unknown[]) {
  if (queryKey.length === queryKeys.currentUser.length && queryKey[0] === queryKeys.currentUser[0]) {
    return true
  }

  if (queryKey.length === queryKeys.pages.length && queryKey[0] === queryKeys.pages[0]) {
    return true
  }

  if (queryKey.length === 2 && queryKey[0] === queryKeys.pages[0] && typeof queryKey[1] === "string") {
    return true
  }

  return false
}

export function clearPersistedQueryCache() {
  window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
}
