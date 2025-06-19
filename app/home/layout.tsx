"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";
import { useSidebarStore } from "@/lib/sidebar-store";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const [hydrated, setHydrated] = useState(false);

  // Prevent hydration mismatch with persisted state
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Use default state during SSR to prevent hydration mismatch
  const effectiveSidebarOpen = hydrated ? sidebarOpen : true;

  return (
    <div className={`min-h-screen relative flex ${effectiveSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar />
      <main
        className={`min-h-screen flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          effectiveSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </main>
    </div>
  );
}
