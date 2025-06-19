"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { ConvexProvider } from "convex/react";
import { convex } from '@/lib/convex';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    })
  )

  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          {children}
          <Toaster />
          </ThemeProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </ConvexProvider>
  )
} 