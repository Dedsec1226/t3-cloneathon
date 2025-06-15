import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(open || false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onOpenChange?.(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onOpenChange])
  
  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  // Combine refs
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    containerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])
  
  return (
    <div ref={combinedRef} className={cn("relative inline-block", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as any, { onClick: handleToggle })
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? child : null
          }
        }
        return child
      })}
    </div>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { ref, ...props })
  }
  
  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    align?: "start" | "center" | "end"
    side?: "top" | "right" | "bottom" | "left"
  }
>(({ className, align = "center", side = "bottom", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      // Horizontal alignment (for top/bottom sides)
      side === "top" || side === "bottom" ? [
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 transform -translate-x-1/2",
      ] : [],
      // Vertical alignment (for left/right sides)
      side === "left" || side === "right" ? [
        align === "end" && "bottom-0",
        align === "start" && "top-0", 
        align === "center" && "top-1/2 transform -translate-y-1/2",
      ] : [],
      // Side positioning
      side === "top" && "bottom-full mb-1",
      side === "bottom" && "top-full mt-1",
      side === "left" && "right-full mr-1",
      side === "right" && "left-full ml-1",
      className
    )}
    {...props}
  />
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }
>(({ className, onSelect, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    onClick={onSelect}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } 