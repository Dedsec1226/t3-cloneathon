"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Badge } from '@/components/ui/badge';

const settingsNavItems = [
  { href: '/settings', label: 'Account', key: 'account' },
  { href: '/settings/history', label: 'History & Sync', key: 'history' },
  { href: '/settings/models', label: 'Models', key: 'models' },
  { href: '/settings/api-keys', label: 'API Keys', key: 'api-keys' },
  { href: '/settings/contact', label: 'Contact Us', key: 'contact' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto flex max-w-[1200px] flex-col overflow-y-auto px-4 pb-24 pt-safe-offset-6 md:px-6 lg:px-8">
      {/* Header */}
      <header className="flex items-center justify-between py-12">
        <Link 
          href="/home"
          className="justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 h-9 px-4 py-2 flex items-center hover:bg-muted/40"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Link>
        <div className="flex flex-row items-center gap-2">
          <ThemeToggle />
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 h-9 px-4 py-2">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-grow flex-col gap-4 md:flex-row">
        {/* Left Sidebar - Profile Section (constant across all tabs) */}
        <div className="hidden space-y-8 md:block md:w-1/4">
          <div className="relative text-center">
            <div 
              className="mx-auto w-40 h-40 rounded-full transition-opacity duration-200 flex items-center justify-center text-foreground text-4xl font-semibold bg-muted"
            >
              A
            </div>
            <h1 className="mt-4 text-2xl font-bold transition-opacity duration-200">Abhinav</h1>
            <div className="relative flex items-center justify-center">
              <p className="break-all text-muted-foreground transition-opacity duration-200"></p>
            </div>
            <p 
              className="perspective-1000 group relative h-6 cursor-pointer break-all text-muted-foreground" 
              role="button" 
              tabIndex={0} 
              aria-label="Copy user ID to clipboard"
            >
              <span className="absolute inset-0 transition-transform duration-300 [backface-visibility:hidden] [transform-style:preserve-3d] truncate group-hover:[transform:rotateX(180deg)]">
                abhinavkale919913@gmail.com
              </span>
              <span className="absolute inset-0 transition-transform duration-300 [backface-visibility:hidden] [transform-style:preserve-3d] [transform:rotateX(180deg)] group-hover:[transform:rotateX(0deg)]">
                <span className="flex h-6 items-center justify-center gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    Copy User ID
                    <span className="inline-flex h-4 w-4 items-center justify-center">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </span>
                </span>
              </span>
            </p>
            <Badge variant="secondary" className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
              Free Plan
            </Badge>
          </div>

          {/* Message Usage Card */}
          <div className="space-y-6 rounded-lg p-4 bg-card">
            <div className="flex flex-row justify-between sm:flex-col sm:justify-between lg:flex-row lg:items-center">
              <span className="text-sm font-semibold">Message Usage</span>
                          <div className="text-xs text-muted-foreground">
              <p>Open source - unlimited usage</p>
            </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Standard</h3>
                  <span className="text-sm text-muted-foreground">∞</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: '100%' }}></div>
                </div>
                <p className="text-sm text-muted-foreground">Unlimited messages</p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Card */}
          <div className="space-y-6 rounded-lg p-4 bg-card">
            <span className="text-sm font-semibold">Keyboard Shortcuts</span>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Search</span>
                <div className="flex gap-1">
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">⌘</kbd>
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Chat</span>
                <div className="flex gap-1">
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">⌘</kbd>
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">Shift</kbd>
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">O</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Toggle Sidebar</span>
                <div className="flex gap-1">
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">⌘</kbd>
                  <kbd className="rounded bg-background px-2 py-1 font-sans text-sm">B</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Section */}
        <div className="md:w-3/4 md:pl-12">
          <div className="space-y-6">
            {/* Centered Horizontal Tabs */}
            <div 
              role="tablist" 
              aria-orientation="horizontal" 
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-secondary/80 p-1 text-secondary-foreground no-scrollbar mx-auto w-full justify-center overflow-auto md:w-fit" 
              aria-label="Settings sections"
            >
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    role="tab"
                    aria-selected={isActive}
                    data-state={isActive ? "active" : "inactive"}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium ring-offset-background transition-all hover:bg-sidebar-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isActive 
                        ? "bg-background text-foreground shadow" 
                        : "text-secondary-foreground"
                    )}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="mt-2 space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 