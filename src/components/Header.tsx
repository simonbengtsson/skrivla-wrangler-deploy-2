import { SidebarTrigger } from "./ui/sidebar"

export function Header() {
  return (
    <header className="flex items-center gap-2 px-4 border-b">
      <SidebarTrigger />
      <div className="flex-1"></div>
    </header>
  )
}
