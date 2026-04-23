import { RouterNotFoundPage } from "@/components/AppFallbackPage"
import { SimpleEditor, useCollaborationSession } from "@/components/SimpleEditor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { trackEvent } from "@/core/analytics"
import { deletePage, getPage, queryKeys, updatePage } from "@/core/api"
import { serializePageMarkdown } from "@/core/pageDocument"
import { upsertPageByCreatedAtDescending } from "@/core/pageList"
import type { LuvabaseMember, Page } from "@/core/types"
import { useSession } from "@/core/UserContext"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router"
import { LucideCheck, LucideCopy, LucideGlobe, LucideTrash } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export const Route = createFileRoute("/p/$pageId")({
  loader: async ({ context, params: { pageId } }) => {
    const page = await context.queryClient.ensureQueryData({
      queryKey: queryKeys.page(pageId),
      queryFn: () => getPage(pageId),
    })

    if (!page) {
      throw notFound()
    }

    return null
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <PageInstancePage />
}

function PageInstancePage() {
  const pageId = Route.useParams().pageId
  const sessionQuery = useSession()
  const user = sessionQuery.data?.user || null
  const { session, hasSynced: hasCollaborationSynced } = useCollaborationSession(pageId)
  const queryClient = useQueryClient()
  const saveNameTimeoutRef = useRef<number | null>(null)
  const [editorFocusRequest, setEditorFocusRequest] = useState(0)
  const [initialFocusTarget, setInitialFocusTarget] = useState<"title" | "editor" | null>(null)

  const pageQuery = useQuery({
    queryKey: queryKeys.page(pageId),
    queryFn: () => getPage(pageId),
  })
  const page = pageQuery.data

  const updatePageMutation = useMutation({
    mutationFn: (name: string) => updatePage(pageId, { name }),
    onSuccess: (updatedPage) => {
      queryClient.setQueryData(queryKeys.page(pageId), updatedPage)
      syncPageListCache(queryClient, updatedPage)
    },
  })

  const isLoading = pageQuery.isLoading

  const [draftName, setDraftName] = useState("")

  useEffect(() => {
    setDraftName(page?.name ?? "")
  }, [page?.name, pageId])

  useEffect(() => {
    setEditorFocusRequest(0)
    setInitialFocusTarget(null)
  }, [pageId])

  useEffect(() => {
    document.title = page?.name || "Untitled"
  }, [page?.name])

  useEffect(() => {
    if (initialFocusTarget !== null || !page || sessionQuery.isPending) {
      return
    }

    setInitialFocusTarget(!page.name?.trim() ? "title" : "editor")
  }, [initialFocusTarget, sessionQuery.isPending, page])

  useEffect(() => {
    return () => {
      if (saveNameTimeoutRef.current != null) {
        window.clearTimeout(saveNameTimeoutRef.current)
      }
    }
  }, [])

  if (!isLoading && page === null) {
    return <RouterNotFoundPage />
  }

  const shouldFocusTitle = initialFocusTarget === "title"
  const showTitleSkeleton = isLoading || sessionQuery.isPending || !hasCollaborationSynced
  const showEditorSkeleton =
    isLoading || sessionQuery.isPending || !hasCollaborationSynced || !session

  return (
    <SidebarInset>
      <PageInstanceHeader
        pageId={pageId}
        page={page ?? null}
        session={session}
        hasCollaborationSynced={hasCollaborationSynced}
        isAuthPending={sessionQuery.isPending}
        isLoading={isLoading}
      />
      <div className="flex flex-col container mx-auto max-w-5xl flex-1 p-4">
        {page ? (
          <>
            <div className="md:px-[54px] pb-4">
              {showTitleSkeleton ? (
                <Skeleton className="mt-1 h-8 w-full md:mt-10" />
              ) : (
                <input
                  id="page-title-input"
                  autoFocus={hasCollaborationSynced && shouldFocusTitle}
                  placeholder="Title"
                  value={draftName}
                  autoComplete="off"
                  spellCheck="false"
                  className="page-title-input text-3xl md:text-4xl md:pt-8 font-bold focus:outline-none text-gray-800 dark:text-gray-200 w-full"
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return
                    }

                    event.preventDefault()
                    setEditorFocusRequest((currentCount) => currentCount + 1)
                  }}
                  onChange={(event) => {
                    const nextName = event.target.value
                    setDraftName(nextName)

                    queryClient.setQueryData(
                      queryKeys.page(pageId),
                      (currentPage: Page | null | undefined) => {
                        if (!currentPage) {
                          return currentPage
                        }

                        const nextPage = {
                          ...currentPage,
                          name: nextName,
                        }
                        syncPageListCache(queryClient, nextPage)
                        return nextPage
                      },
                    )

                    if (saveNameTimeoutRef.current != null) {
                      window.clearTimeout(saveNameTimeoutRef.current)
                    }

                    saveNameTimeoutRef.current = window.setTimeout(() => {
                      updatePageMutation.mutate(nextName)
                    }, 300)
                  }}
                />
              )}
            </div>
            <div className="relative md:px-[54px]">
              {showEditorSkeleton ? <Skeleton className="h-[320px] w-full" /> : null}
              {session ? (
                <SimpleEditor
                  key={pageId}
                  session={session}
                  user={user}
                  autoFocus={hasCollaborationSynced && initialFocusTarget === "editor"}
                  focusRequest={editorFocusRequest}
                  className={
                    showEditorSkeleton
                      ? "invisible absolute inset-0 pointer-events-none"
                      : undefined
                  }
                />
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </SidebarInset>
  )
}

function PageInstanceHeader(props: {
  pageId: string
  page: Page | null
  session: ReturnType<typeof useCollaborationSession>["session"]
  hasCollaborationSynced: boolean
  isAuthPending: boolean
  isLoading: boolean
}) {
  const sessionQuery = useSession()
  const user = sessionQuery.data?.user || null
  const router = useRouter()
  const queryClient = useQueryClient()
  const page = props.page
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle")
  const [copyMarkdownState, setCopyMarkdownState] = useState<"idle" | "copied" | "error">("idle")

  const deletePageMutation = useMutation({
    mutationFn: () => deletePage(props.pageId),
    onSuccess: (deletedPage) => {
      queryClient.setQueryData(queryKeys.pages, (currentPages: Page[] | undefined) => {
        if (!currentPages) {
          return currentPages
        }

        return currentPages.filter((currentPage) => currentPage.id !== props.pageId)
      })
      queryClient.setQueryData(queryKeys.trashPages, (currentPages: Page[] | undefined) => {
        if (!currentPages) {
          return [deletedPage]
        }

        return [
          deletedPage,
          ...currentPages.filter((currentPage) => currentPage.id !== props.pageId),
        ]
      })
      queryClient.removeQueries({
        queryKey: queryKeys.page(props.pageId),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.pageContent(props.pageId),
      })
      trackEvent("pageDeleted", { pageId: props.pageId })
      router.navigate({ to: "/" })
    },
  })

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [props.pageId])

  useEffect(() => {
    if (!isShareDialogOpen) {
      setCopyState("idle")
    }
  }, [isShareDialogOpen])

  useEffect(() => {
    if (copyMarkdownState === "idle") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyMarkdownState("idle")
    }, 1_500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copyMarkdownState])

  async function handleCopyLink() {
    const nextShareUrl = shareUrl || window.location.href

    try {
      await navigator.clipboard.writeText(nextShareUrl)
      setCopyState("copied")
    } catch {
      setCopyState("error")
    }
  }

  async function handleCopyMarkdown() {
    if (!props.session || !props.hasCollaborationSynced) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        serializePageMarkdown(props.session.doc, page?.name.trim() || "Untitled"),
      )
      setCopyMarkdownState("copied")
    } catch {
      setCopyMarkdownState("error")
    }
  }

  function renderActions(currentUser: LuvabaseMember | null) {
    return (
      <div className="flex items-center gap-2">
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <HeaderButtonTooltip content="Share page">
            <Button
              size="sm"
              variant="outline"
              aria-label="Share page"
              onClick={() => {
                setIsShareDialogOpen(true)
              }}
            >
              <LucideGlobe />
              <span>Share</span>
            </Button>
          </HeaderButtonTooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Page</DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>All pages in Skrivla are public.</p>
                <p>
                  Share the the browser url (or click copy url below) of any page to collaborate
                  with anyone.
                </p>
              </div>
            </DialogDescription>
            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Page URL
              </label>
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.target.select()}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton onClick={handleCopyLink}>
                    {copyState === "copied" ? (
                      <>
                        <LucideCheck />
                        Copied
                      </>
                    ) : (
                      "Copy Link"
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {copyState === "error" && (
                <p className="text-sm text-destructive">
                  Copy failed. You can still copy the URL manually.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <HeaderButtonTooltip content="Copy as markdown">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Copy as markdown"
            disabled={!props.session || !props.hasCollaborationSynced}
            onClick={handleCopyMarkdown}
          >
            {copyMarkdownState === "copied" ? <LucideCheck /> : <LucideCopy />}
          </Button>
        </HeaderButtonTooltip>
        {currentUser && (
          <HeaderButtonTooltip content="Delete page">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Delete page"
              disabled={deletePageMutation.isPending}
              onClick={() => {
                deletePageMutation.mutate()
              }}
            >
              <LucideTrash />
            </Button>
          </HeaderButtonTooltip>
        )}
      </div>
    )
  }

  return (
    <header className="flex items-center gap-2 px-4 border-b py-2">
      <HeaderButtonTooltip content="Toggle sidebar">
        <span className="inline-flex">
          <SidebarTrigger aria-label="Toggle sidebar" />
        </span>
      </HeaderButtonTooltip>
      {props.isLoading || props.isAuthPending ? (
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-none" />
          <Skeleton className="h-9 w-9 rounded-none" />
          <Skeleton className="h-9 w-9 rounded-none" />
        </div>
      ) : page ? (
        <div className="ml-auto">{renderActions(user)}</div>
      ) : null}
    </header>
  )
}

function syncPageListCache(queryClient: ReturnType<typeof useQueryClient>, nextPage: Page) {
  queryClient.setQueryData(queryKeys.pages, (currentPages: Page[] | undefined) => {
    return upsertPageByCreatedAtDescending(currentPages, nextPage)
  })
}

function HeaderButtonTooltip(props: { content: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent side="bottom">{props.content}</TooltipContent>
    </Tooltip>
  )
}
