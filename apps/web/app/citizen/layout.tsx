'use client';

import { useState } from "react";
import { Flame, LayoutGrid, MapPin, Menu, Ticket } from "lucide-react";
import Sidebar, { defaultSidebarConfig, SidebarNavigationItem } from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";
import { supabase } from '@/src/lib/supabase';
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const citizenNavigation: SidebarNavigationItem[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <LayoutGrid size={20} strokeWidth={2.5} />,
      href: "/citizen",
      isActive: pathname === "/citizen",
    },
    {
      id: "track",
      name: "Your Tickets",
      icon: <Ticket size={20} strokeWidth={2} />,
      href: "/citizen/tickets",
      isActive: pathname === "/citizen/tickets",
    },
    {
      id: "projects",
      name: "Heatmap",
      icon: <Flame size={20} strokeWidth={2} />,
      href: "/citizen/heatmap",
      isActive: pathname === "/citizen/heatmap",
    },
    {
      id: "reports",
      name: "Nearby Tickets",
      icon: <MapPin size={20} strokeWidth={2} />,
      href: "/citizen/nearby",
      isActive: pathname === "/citizen/nearby",
    },
  ];

  const sidebarConfig = {
    ...defaultSidebarConfig,
    branding: {
      ...defaultSidebarConfig.branding,
      title: "Citizen",
    },
    colors: {
      ...defaultSidebarConfig.colors,
      textMain: "text-white dark:text-white",
    },
    navigation: citizenNavigation,
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        {...sidebarConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onLogout={handleLogout}
      />


      {/* Keep content adjacent to fixed sidebar on desktop */}
      <main className={`flex-1 w-full p-4 transition-[margin] duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 m-4 bg-purple-600 text-white rounded-md"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className="h-full">
          {children}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}
