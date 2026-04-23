import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listTrashPages, queryKeys, restorePage } from "@/core/api"
import { formatAbsoluteDate } from "@/core/dateUtils"
import { upsertPageByCreatedAtDescending } from "@/core/pageList"
import type { Page } from "@/core/types"
import { useSession } from "@/core/UserContext"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { HistoryIcon } from "lucide-react"

export const Route = createFileRoute("/trash")({
  component: TrashPage,
})

function TrashPage() {
  const sessionQuery = useSession()
  const user = sessionQuery.data?.user || null
  const queryClient = useQueryClient()
  const trashPagesQuery = useQuery({
    queryKey: queryKeys.trashPages,
    queryFn: listTrashPages,
    enabled: sessionQuery.data?.user != null,
  })
  const restorePageMutation = useMutation({
    mutationFn: (pageId: string) => restorePage(pageId),
    onSuccess: (restoredPage) => {
      queryClient.setQueryData(queryKeys.trashPages, (currentPages: Page[] | undefined) => {
        if (!currentPages) {
          return currentPages
        }

        return currentPages.filter((currentPage) => currentPage.id !== restoredPage.id)
      })
      queryClient.setQueryData(queryKeys.pages, (currentPages: Page[] | undefined) => {
        return upsertPageByCreatedAtDescending(currentPages, restoredPage)
      })
      queryClient.setQueryData(queryKeys.page(restoredPage.id), restoredPage)
    },
  })

  const trashPages = trashPagesQuery.data ?? []
  const isTrashLoading = user != null && trashPagesQuery.isLoading

  return (
    <SidebarInset>
      <Header />
      <main className="container mx-auto flex flex-1 px-4 py-10">
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold text-gray-800 dark:text-gray-100">
              Trash
            </h1>
            <p className="text-sm text-muted-foreground">
              Deleted pages stay here for now. Restore and permanent delete can come later.
            </p>
          </div>

          {sessionQuery.isPending || isTrashLoading ? (
            <TrashTableSkeleton />
          ) : !user ? (
            <div className="flex w-full max-w-sm flex-col gap-3 border border-dashed border-border p-5 text-sm text-muted-foreground">
              <p>Log in to view deleted pages.</p>
              <Button asChild className="justify-start">
                <a href="/luvabase/login">Log In</a>
              </Button>
            </div>
          ) : trashPages.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No deleted pages yet.
            </div>
          ) : (
            <TrashTable
              canRestore={user != null}
              pages={trashPages}
              restoringPageId={
                restorePageMutation.isPending ? (restorePageMutation.variables ?? null) : null
              }
              onRestorePage={(pageId) => {
                restorePageMutation.mutate(pageId)
              }}
            />
          )}
        </div>
      </main>
    </SidebarInset>
  )
}

function TrashTable(props: {
  canRestore: boolean
  pages: Page[]
  restoringPageId: string | null
  onRestorePage: (pageId: string) => void
}) {
  return (
    <div className="border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.pages.map((page) => {
            const displayName = getPageDisplayName(page)
            const isUntitled = displayName === "Untitled"

            return (
              <TableRow key={page.id} className="hover:bg-transparent">
                <TableCell className={cn("font-medium", isUntitled && "text-muted-foreground")}>
                  {displayName}
                </TableCell>
                <TableCell>{formatAbsoluteDate(page.createdAt)}</TableCell>
                <TableCell>{page.deletedAt ? formatAbsoluteDate(page.deletedAt) : "—"}</TableCell>
                <TableCell>
                  {props.canRestore ? (
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label="Restore page"
                      disabled={props.restoringPageId === page.id}
                      onClick={() => {
                        props.onRestorePage(page.id)
                      }}
                    >
                      <HistoryIcon />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function TrashTableSkeleton() {
  return (
    <div className="border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-transparent">
              <TableCell>
                <Skeleton className="h-4 w-40 rounded-none" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 rounded-none" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 rounded-none" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto size-9 rounded-none" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getPageDisplayName(page: Pick<Page, "name">) {
  return page.name?.trim() || "Untitled"
}
