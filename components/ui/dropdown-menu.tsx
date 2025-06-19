import * as React from "react"
import { createPortal } from "react-dom"
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
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
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
            return React.cloneElement(child, { 
              onClick: handleToggle 
            } as Partial<React.ComponentProps<typeof DropdownMenuTrigger>>)
          }
          if (child.type === DropdownMenuContent) {
            return isOpen && mounted ? React.cloneElement(child, { 
              triggerRef: containerRef 
            } as Partial<React.ComponentProps<typeof DropdownMenuContent>>) : null
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
    return React.cloneElement(children, { 
      ref, 
      ...props 
    } as Partial<React.ComponentProps<React.ComponentType>>)
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
    triggerRef?: React.RefObject<HTMLDivElement>
  }
>(({ className, align = "center", side = "bottom", triggerRef, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate position based on trigger element
  React.useEffect(() => {
    if (triggerRef?.current && mounted) {
      const updatePosition = () => {
        const triggerRect = triggerRef.current!.getBoundingClientRect()
        
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Actual dropdown dimensions - use more accurate estimates
        const dropdownWidth = 160 // w-40 from ChatList 
        const dropdownHeight = 88 // More accurate estimate including padding
        
        let top = 0
        let left = 0

        // Position based on side and alignment
        if (side === "bottom") {
          top = triggerRect.bottom + 8 // Slightly more spacing
          
          if (align === "end") {
            // For end alignment, position dropdown so its right edge aligns with trigger's right edge
            left = triggerRect.right - dropdownWidth
          } else if (align === "start") {
            left = triggerRect.left
          } else { // center
            left = triggerRect.left + (triggerRect.width - dropdownWidth) / 2
          }
        } else if (side === "top") {
          top = triggerRect.top - dropdownHeight - 8
          
          if (align === "end") {
            left = triggerRect.right - dropdownWidth
          } else if (align === "start") {
            left = triggerRect.left
          } else {
            left = triggerRect.left + (triggerRect.width - dropdownWidth) / 2
          }
        } else if (side === "right") {
          left = triggerRect.right + 8
          
          if (align === "end") {
            top = triggerRect.bottom - dropdownHeight
          } else if (align === "start") {
            top = triggerRect.top
          } else {
            top = triggerRect.top + (triggerRect.height - dropdownHeight) / 2
          }
        } else if (side === "left") {
          left = triggerRect.left - dropdownWidth - 8
          
          if (align === "end") {
            top = triggerRect.bottom - dropdownHeight
          } else if (align === "start") {
            top = triggerRect.top
          } else {
            top = triggerRect.top + (triggerRect.height - dropdownHeight) / 2
          }
        }

        // Keep dropdown within viewport
        if (left + dropdownWidth > viewportWidth - 16) {
          left = viewportWidth - dropdownWidth - 16
        }
        if (left < 16) {
          left = 16
        }
        
        if (top + dropdownHeight > viewportHeight - 16) {
          // Try to show above instead
          if (side === "bottom") {
            top = triggerRect.top - dropdownHeight - 8
          } else {
            top = viewportHeight - dropdownHeight - 16
          }
        }
        if (top < 16) {
          top = 16
        }

        setPosition({ top, left })
      }

      // Update position initially and on scroll/resize
      updatePosition()
      
      const handleResize = () => updatePosition()
      const handleScroll = () => updatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [triggerRef, mounted, side, align])

  // Combine refs
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    contentRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])

  if (!mounted) return null

  const content = (
    <div
      ref={combinedRef}
      className={cn(
        "fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
      {...props}
    />
  )

  return createPortal(content, document.body)
})
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