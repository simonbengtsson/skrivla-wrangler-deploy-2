import { RouterErrorPage, RouterNotFoundPage } from "@/components/AppFallbackPage"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { MixpanelInit } from "@/core/analytics"
import { queryClient } from "@/core/queryClient"
import { CurrentUserTracker } from "@/core/UserContext"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { useEffect } from "react"

export interface RouterAppContext {
  queryClient: typeof queryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  errorComponent: RouterErrorPage,
  notFoundComponent: RouterNotFoundPage,
  component: () => (
    <>
      <SystemThemeSync />
      <MixpanelInit />
      <CurrentUserTracker />
      <TooltipProvider>
        <SidebarProvider className="border-t">
          <AppSidebar />
          <Outlet />
        </SidebarProvider>
      </TooltipProvider>
    </>
  ),
})

function SystemThemeSync() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const syncTheme = () => {
      document.documentElement.classList.toggle("dark", media.matches)
      document.documentElement.style.colorScheme = media.matches ? "dark" : "light"
    }

    syncTheme()
    media.addEventListener("change", syncTheme)

    return () => {
      media.removeEventListener("change", syncTheme)
    }
  }, [])

  return null
}
