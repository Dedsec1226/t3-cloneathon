import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const CommandDialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open: boolean
    onOpenChange: (open: boolean) => void
  }
>(({ className, open, onOpenChange, children, ...props }, ref) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]"
          >
            <div
              ref={ref}
              className={cn(
                "grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full",
                className
              )}
              {...props}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})
CommandDialog.displayName = "CommandDialog"

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: string }
>(({ className, heading, children, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-hidden p-1", className)} {...props}>
    {heading && (
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {heading}
      </div>
    )}
    {children}
  </div>
))
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onSelect?: (value: string) => void
    disabled?: boolean
  }
>(({ className, value, onSelect, disabled, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      disabled
        ? "pointer-events-none opacity-50"
        : "hover:bg-accent hover:text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground",
      className
    )}
    onClick={() => !disabled && onSelect && value && onSelect(value)}
    {...props}
  >
    {children}
  </div>
))
CommandItem.displayName = "CommandItem"

export {
  CommandDialog,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} 