import * as React from "react"
import { cn } from "@/lib/utils"

interface TextShimmerProps {
  children: React.ReactNode
  className?: string
  duration?: number
}

export function TextShimmer({ children, className, duration = 2 }: TextShimmerProps) {
  return (
    <div 
      className={cn("animate-pulse", className)}
      style={{
        animationDuration: `${duration}s`
      }}
    >
      {children}
    </div>
  )
} 