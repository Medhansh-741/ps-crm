// apps/web/app/authority/layout.tsx

'use client';

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutGrid,
  LogOut,
  MapPinned,
  Menu,
  User,
  Users,
} from "lucide-react";
import Sidebar, { defaultSidebarConfig } from "@/components/Sidebar";
import { supabase } from "@/src/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

export default function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed,   setIsCollapsed]   = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const sidebarConfig = {
    ...defaultSidebarConfig,
    branding: {
      ...defaultSidebarConfig.branding,
      title: "Authority",
    },
    navigation: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: <LayoutGrid size={20} strokeWidth={2} />,
        href: "/authority",
        isActive: pathname === "/authority",
      },
      {
        id: "track",
        name: "Track Complaints",
        icon: <ClipboardList size={20} strokeWidth={2} />,
        href: "/authority/track",
        isActive: pathname.startsWith("/authority/track"),
      },
      {
        id: "map",
        name: "Map View",
        icon: <MapPinned size={20} strokeWidth={2} />,
        href: "/authority/map",
        isActive: pathname.startsWith("/authority/map"),
      },
      {
        id: "workers",
        name: "Workers",
        icon: <Users size={20} strokeWidth={2} />,
        href: "/authority/workers",
        isActive: pathname.startsWith("/authority/workers"),
      },
    ],
    bottomNavigation: [
      {
        id: "profile",
        name: "Profile",
        icon: <User size={20} strokeWidth={2} />,
        href: "/authority/profile",
      },
      {
        id: "logout",
        name: "Logout",
        icon: <LogOut size={20} strokeWidth={2} />,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        {...sidebarConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <main
        className={`flex-1 w-full p-4 transition-[margin] duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-md bg-[#b4725a] p-2 text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
