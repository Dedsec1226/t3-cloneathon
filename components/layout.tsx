"use client";

import { Sidebar, SidebarHeader, SidebarBody, SidebarFooter, SidebarItem, SidebarContent } from "@/components/ui/Sidebar/sidebar";
import { Home, Settings, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        variant="default"
        size="default"
      >
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">T3</span>
          </div>
        </SidebarHeader>
        <SidebarBody>
          <SidebarItem
            id="home"
            label="Home"
            icon={Home}
            href="/"
          />
          <SidebarItem
            id="documents"
            label="Documents"
            icon={FileText}
            href="/documents"
          />
          <SidebarItem
            id="chat"
            label="Chat"
            icon={MessageSquare}
            href="/chat"
          />
        </SidebarBody>
        <SidebarFooter>
          <SidebarItem
            id="settings"
            label="Settings"
            icon={Settings}
            href="/settings"
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarContent sidebarCollapsed={collapsed}>
        {children}
      </SidebarContent>
    </div>
  );
} 