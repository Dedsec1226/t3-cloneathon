import * as React from "react"
import { cn } from "@/lib/utils"

interface BorderTrailProps {
  className?: string
  size?: number
  children?: React.ReactNode
}

export function BorderTrail({ className, size = 60, children }: BorderTrailProps) {
  return (
    <div
      className={cn("absolute inset-0 rounded-full", className)}
      style={{
        background: `conic-gradient(from 0deg, transparent, currentColor, transparent)`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {children}
    </div>
  )
} 