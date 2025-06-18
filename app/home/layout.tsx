"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ClerkProvider } from "@clerk/nextjs";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen relative flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main
        className={`min-h-screen flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <ClerkProvider>
        {children}
        </ClerkProvider>
      </main>
    </div>
  );
}
