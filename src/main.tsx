import { queryClient } from "@/core/queryClient"
import {
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE_MS,
  createQueryCachePersister,
  shouldPersistQuery,
} from "@/core/queryPersistence"
import type { RouterAppContext } from "@/routes/__root"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import {
  RouterErrorPage,
  RouterNotFoundPage,
} from "@/components/AppFallbackPage"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"
import reportWebVitals from "./reportWebVitals.ts"
import "./styles.css"

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  } satisfies RouterAppContext,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  defaultViewTransition: true,
  defaultErrorComponent: RouterErrorPage,
  defaultNotFoundComponent: RouterNotFoundPage,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  const persister = createQueryCachePersister()

  root.render(
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          buster: QUERY_CACHE_BUSTER,
          maxAge: QUERY_CACHE_MAX_AGE_MS,
          persister,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey),
          },
        }}
      >
        <RouterProvider router={router} context={{ queryClient }} />
      </PersistQueryClientProvider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
