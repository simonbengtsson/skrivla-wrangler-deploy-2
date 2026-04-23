import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { createPage, queryKeys } from "@/core/api"
import type { Page } from "@/core/types"
import { useSession } from "@/core/UserContext"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useRouter } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: App,
})

function App() {
  const router = useRouter()
  const sessionQuery = useSession()
  const queryClient = useQueryClient()

  const createPageMutation = useMutation({
    mutationFn: () => createPage(),
    onSuccess: (page) => {
      queryClient.setQueryData(queryKeys.pages, (currentPages: Page[] | undefined) => {
        if (!currentPages) {
          return [page]
        }

        return [page, ...currentPages.filter((currentPage) => currentPage.id !== page.id)]
      })

      router.navigate({
        to: "/p/$pageId",
        params: { pageId: page.id },
      })
    },
  })

  return (
    <SidebarInset>
      <Header />
      <main className="container mx-auto flex flex-1 px-4 py-16">
        <div className="flex w-full flex-1 items-center justify-center pb-24">
          {sessionQuery.isPending ? (
            <IndexStateSkeleton />
          ) : !sessionQuery.data?.user ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Log in to view and create pages.</p>
              <Button asChild>
                <a href="/luvabase/login">Log In</a>
              </Button>
            </div>
          ) : (
            <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
              <div className="space-y-2">
                <h1 className="flex items-center justify-center gap-2 font-heading text-3xl sm:text-5xl font-bold text-gray-500 dark:text-gray-200">
                  <img src="/appicon-only.svg" alt="Skrivla Logo" className="size-8 sm:size-14" />
                  Skrivla
                </h1>
                <p className="sm:text-xl leading-6 text-muted-foreground py-4">
                  Create a page and share it for realtime collaboration with anyone. No login
                  needed.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={createPageMutation.isPending}
                onClick={() => {
                  createPageMutation.mutate()
                }}
              >
                Create Page
              </Button>
            </div>
          )}
        </div>
      </main>
    </SidebarInset>
  )
}

function IndexStateSkeleton() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
      <div className="w-full space-y-2">
        <Skeleton className="mx-auto h-8 w-40 rounded-none" />
        <Skeleton className="mx-auto h-4 w-full rounded-none" />
        <Skeleton className="mx-auto h-4 w-5/6 rounded-none" />
      </div>
      <Skeleton className="h-10 w-32 rounded-none" />
    </div>
  )
}
