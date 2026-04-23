import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"
import type { ReactNode } from "react"

type AppFallbackPageProps = {
  badge: string
  title: string
  message: string
  actions?: ReactNode
}

function AppFallbackPage(props: AppFallbackPageProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <div className="rounded-full border border-border bg-muted px-3 py-1 text-[0.7rem] font-medium tracking-[0.28em] uppercase text-muted-foreground">
          {props.badge}
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{props.title}</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {props.message}
          </p>
        </div>
        {props.actions ? (
          <div className="flex flex-wrap items-center justify-center gap-3">{props.actions}</div>
        ) : null}
      </div>
    </div>
  )
}

export function RouterErrorPage() {
  return (
    <AppFallbackPage
      badge="Error"
      title="Something went wrong"
      message="The app ran into an unexpected error."
      actions={
        <>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </>
      }
    />
  )
}

export function RouterNotFoundPage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 justify-center px-6 py-30">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full border border-border bg-muted px-3 py-1 text-[0.7rem] font-medium tracking-[0.28em] uppercase text-muted-foreground">
            404
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Page not found</h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              The page you requested doesn&apos;t exist or is no longer available.
            </p>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}

export function GlobalErrorPage() {
  return (
    <AppFallbackPage
      badge="Error"
      title="Something went wrong"
      message="The app couldn't finish loading."
      actions={
        <>
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" asChild>
            <a href="/">Go home</a>
          </Button>
        </>
      }
    />
  )
}
