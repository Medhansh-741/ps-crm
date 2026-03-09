// apps/web/app/authority/layout.tsx
'use client'

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart2, Bell, ClipboardList,
  LayoutGrid, LogOut, Menu, User, Users,
} from "lucide-react"
import Sidebar, { defaultSidebarConfig } from "@/components/Sidebar"
import { supabase } from "@/src/lib/supabase"
import NotificationBell from "@/components/NotificationBell"

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed,   setIsCollapsed]   = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const sidebarConfig = {
    ...defaultSidebarConfig,
    branding: { ...defaultSidebarConfig.branding, title: "Authority" },
    navigation: [
      { id: "dashboard",     name: "Dashboard",        icon: <LayoutGrid    size={20} strokeWidth={2} />, href: "/authority",               isActive: pathname === "/authority" },
      { id: "track",         name: "Track Complaints", icon: <ClipboardList size={20} strokeWidth={2} />, href: "/authority/track",         isActive: pathname.startsWith("/authority/track") },
      { id: "workers",       name: "Workers",          icon: <Users         size={20} strokeWidth={2} />, href: "/authority/workers",       isActive: pathname.startsWith("/authority/workers") },
      { id: "reports",       name: "Reports",          icon: <BarChart2     size={20} strokeWidth={2} />, href: "/authority/reports",       isActive: pathname.startsWith("/authority/reports") },
      { id: "notifications", name: "Notifications",    icon: <Bell          size={20} strokeWidth={2} />, href: "/authority/notifications", isActive: pathname.startsWith("/authority/notifications") },
    ],
    bottomNavigation: [
      { id: "profile", name: "Profile", icon: <User   size={20} strokeWidth={2} />, href: "/authority/profile" },
      { id: "logout",  name: "Logout",  icon: <LogOut size={20} strokeWidth={2} />, onClick: handleLogout },
    ],
  }

  return (
    /*
      Sidebar.tsx: fixed on mobile, `lg:relative` on desktop (it joins the flex row).
      So on desktop the sidebar is a natural flex child with w-64.
      flex-1 on the right div fills exactly the remaining viewport width — zero ml- needed.
    */
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      <Sidebar
        {...sidebarConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(c => !c)}
      />

      {/* Right column: everything to the right of the sidebar */}
      <div className="flex flex-1 min-w-0 flex-col">

        {/* Topbar — spans only this column, not the full viewport */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between
                           border-b border-gray-200 bg-white px-5
                           dark:border-gray-800 dark:bg-gray-950">
          {/* Mobile hamburger — hidden on lg */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg
                       bg-[#b4725a] text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb label — visible on desktop */}
          <p className="hidden lg:block text-sm font-semibold capitalize text-gray-600 dark:text-gray-400">
            {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Dashboard"}
          </p>

          <NotificationBell />
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
