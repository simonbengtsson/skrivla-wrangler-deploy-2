"use client"

import { trackEvent } from "@/core/analytics"
import { createPage, getMembers, listPages, queryKeys } from "@/core/api"
import { clearPersistedQueryCache } from "@/core/queryPersistence"
import { DEV_AUTH_ANONYMOUS_VALUE, DEV_AUTH_COOKIE_NAME } from "@/core/shared"
import type { Page } from "@/core/types"
import { useSession } from "@/core/UserContext"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useRouter, useRouterState } from "@tanstack/react-router"
import {
  InfoIcon,
  LucideChevronDown,
  LucideFileText,
  LucideLogIn,
  LucideLogOut,
  LucidePlus,
  LucideSearch,
  LucideTrash2,
  UserIcon,
  WrenchIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "./ui/sidebar"
import { Skeleton } from "./ui/skeleton"

function getPodIdFromHostname(hostname: string) {
  const [podId] = hostname.split(".")
  return podId || null
}

function getPageDisplayName(page: Pick<Page, "name">) {
  return page.name?.trim() || "Untitled"
}

export function AppSidebar() {
  const { setOpenMobile } = useSidebar()
  const sessionQuery = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const podId = getPodIdFromHostname(window.location.hostname)
  const podUrl = `https://luvabase.com/dash/pods/${podId}`
  const podAdminUrl = `${podUrl}`
  const isDev = import.meta.env.DEV

  const pagesQuery = useQuery({
    queryKey: queryKeys.pages,
    queryFn: listPages,
    enabled: sessionQuery.data?.user != null,
  })
  const devMembersQuery = useQuery({
    queryKey: queryKeys.members,
    queryFn: getMembers,
    enabled: isDev,
  })

  const user = sessionQuery.data?.user || null

  const createPageMutation = useMutation({
    mutationFn: () => createPage(),
    onSuccess: (page) => {
      queryClient.setQueryData(queryKeys.pages, (currentPages: Page[] | undefined) => {
        if (!currentPages) {
          return [page]
        }

        return [page, ...currentPages.filter((currentPage) => currentPage.id !== page.id)]
      })

      trackEvent("pageCreated", { pageId: page.id })
      setOpenMobile(false)
      router.navigate({
        to: "/p/$pageId",
        params: { pageId: page.id },
      })
    },
  })

  const pages = pagesQuery.data ?? []
  const devMembers = devMembersQuery.data ?? []
  const selectedDevUserId = user?.id ?? DEV_AUTH_ANONYMOUS_VALUE

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()

        if (!user) {
          return
        }

        setIsOpenDialogOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [user])

  function handleOpenPage(pageId: string) {
    setIsOpenDialogOpen(false)
    setOpenMobile(false)
    router.navigate({
      to: "/p/$pageId",
      params: { pageId },
    })
  }

  function handleDevUserChange(nextUserId: string) {
    if (!isDev || nextUserId === selectedDevUserId) {
      return
    }

    clearPersistedQueryCache()
    document.cookie = `${DEV_AUTH_COOKIE_NAME}=${encodeURIComponent(nextUserId)}; Path=/; Max-Age=31536000; SameSite=Lax`
    window.location.reload()
  }

  async function handleLogout() {
    setOpenMobile(false)
    clearPersistedQueryCache()

    try {
      await fetch("/luvabase/logout", {
        method: "POST",
      })
    } finally {
      window.location.reload()
    }
  }

  return (
    <Sidebar className="border-t">
      <SidebarHeader className="p-5 pb-0" onClick={() => setOpenMobile(false)}>
        <h1 className="font-heading text-2xl font-bold text-gray-500 dark:text-gray-200 flex items-center gap-2">
          <img src="/appicon-only.svg" alt="Skrivla Logo" width={24} height={24} />
          Skrivla
        </h1>
        {sessionQuery.isPending ? (
          <Skeleton className="mt-1 h-9 w-full rounded-none" />
        ) : user ? (
          <Button
            className="justify-start mt-1"
            variant="outline"
            disabled={createPageMutation.isPending}
            onClick={() => {
              createPageMutation.mutate()
            }}
          >
            <LucidePlus />
            <span>New Page</span>
          </Button>
        ) : null}
      </SidebarHeader>
      <SidebarContent className="p-4">
        {sessionQuery.isPending ? (
          <>
            <Skeleton className="mb-3 h-4 w-20 rounded-none" />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
              </SidebarMenu>
            </SidebarGroupContent>
          </>
        ) : user ? (
          <>
            <SidebarGroupLabel>My Pages</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages.map((page) => {
                  const isActive = pathname === `/p/${page.id}`
                  const displayName = getPageDisplayName(page)
                  const isUntitled = displayName === "Untitled"

                  return (
                    <SidebarMenuItem key={page.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          to="/p/$pageId"
                          params={{ pageId: page.id }}
                          onClick={() => setOpenMobile(false)}
                        >
                          <LucideFileText
                            className={cn(isUntitled && "text-sidebar-foreground/50")}
                          />
                          <span className={cn(isUntitled && "text-sidebar-foreground/50")}>
                            {displayName}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </>
        ) : (
          <div className="flex flex-col gap-4 border border-dashed border-border p-5 text-sm text-muted-foreground">
            <p>Log in to view your pages, create new documents and manage this pod.</p>
            <Button asChild className="justify-start">
              <a href={"/luvabase/login"} onClick={() => setOpenMobile(false)}>
                <LucideLogIn />
                <span>Log In</span>
              </a>
            </Button>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="text-xs text-gray-500">
        <SidebarMenu>
          {sessionQuery.isPending ? (
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Skeleton className="size-4 rounded-none" />
                  <Skeleton className="h-4 w-24 rounded-none" />
                  <Skeleton className="ml-auto size-4 rounded-none" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : user ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  setIsOpenDialogOpen(true)
                }}
              >
                <LucideSearch />
                <span>Open</span>
                <span className="ml-auto text-[10px] tracking-widest text-gray-500 uppercase">
                  ⌘K
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          {sessionQuery.isPending ? (
            <SidebarMenuSkeleton showIcon />
          ) : user ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/trash"}>
                <Link to="/trash" onClick={() => setOpenMobile(false)}>
                  <LucideTrash2 />
                  <span>Trash</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          {!sessionQuery.data || sessionQuery.data.environment === "cloudflare" ? null : (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <UserIcon />
                    <span className="truncate text-left tracking-normal">
                      {user?.name || "Anonymous"}
                    </span>
                    <LucideChevronDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  {isDev ? (
                    <>
                      <DropdownMenuLabel>Dev User</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={selectedDevUserId}
                        onValueChange={handleDevUserChange}
                      >
                        <DropdownMenuRadioItem value={DEV_AUTH_ANONYMOUS_VALUE}>
                          Anonymous
                        </DropdownMenuRadioItem>
                        {devMembers.map((member) => (
                          <DropdownMenuRadioItem key={member.id} value={member.id}>
                            {member.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      {user ? <DropdownMenuSeparator /> : null}
                    </>
                  ) : (
                    <></>
                  )}
                  {user ? (
                    <DropdownMenuItem asChild>
                      <a href={podAdminUrl} onClick={() => setOpenMobile(false)}>
                        <WrenchIcon />
                        <span>Admin</span>
                      </a>
                    </DropdownMenuItem>
                  ) : null}
                  {!isDev && user ? <DropdownMenuSeparator /> : null}
                  {!isDev ? (
                    <DropdownMenuItem onSelect={() => void handleLogout()}>
                      <LucideLogOut />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton>
                  <InfoIcon />
                  <span>About Skrivla</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Skrivla</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                  <div>
                    Skrivla is a minimal collaborative text editor. Perfect for quick thoughts,
                    meeting notes and collaborative brainstorming.
                    <br />
                    <br />
                    {sellingPoints.map((point) => (
                      <div className="flex items-center gap-3 py-3" key={point.title}>
                        <div style={{ fontFamily: "Noto Color Emoji", fontSize: 25 }}>
                          {point.icon}
                        </div>
                        <div>
                          <div className="text-lg font-bold">{point.title}</div>
                          <div>{point.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <CommandDialog
          open={isOpenDialogOpen}
          onOpenChange={setIsOpenDialogOpen}
          title="Open Page"
          description="Jump to a specific page by name."
        >
          <Command className="rounded-none border-0">
            <CommandInput placeholder="Search pages..." />
            <CommandList>
              <CommandEmpty>
                {user ? "No matching pages found." : "Sign in to open a page."}
              </CommandEmpty>
              <CommandGroup heading="Pages">
                {pages.map((page) => {
                  const displayName = getPageDisplayName(page)

                  return (
                    <CommandItem
                      key={page.id}
                      value={`${displayName} ${page.id}`}
                      onSelect={() => {
                        handleOpenPage(page.id)
                      }}
                    >
                      <LucideFileText />
                      <span>{displayName}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </SidebarFooter>
    </Sidebar>
  )
}

const sellingPoints = [
  {
    icon: "🌎",
    title: "Instant collaborative editing",
    description: "Share a page link with anyone to edit together. No accounts needed.",
  },
  {
    icon: "🎨",
    title: "Designed for desktop, mobile and dark mode",
    description: "Works on any device and any system theme.",
  },
]
