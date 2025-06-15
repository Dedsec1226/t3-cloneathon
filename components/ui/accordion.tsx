import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type: "single" | "multiple"
    collapsible?: boolean
    defaultValue?: string
  }
>(({ className, type, collapsible, defaultValue, children, ...props }, ref) => {
  const [openItems, setOpenItems] = React.useState<string[]>(
    defaultValue ? [defaultValue] : []
  )

  const toggleItem = (value: string) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? [] : [value])
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter(item => item !== value)
          : [...openItems, value]
      )
    }
  }

  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            ...(child.props as any),
            isOpen: openItems.includes((child.props as any).value),
            onToggle: () => toggleItem((child.props as any).value),
          })
        }
        return child
      })}
    </div>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    isOpen?: boolean
    onToggle?: () => void
  }
>(({ className, value, isOpen, onToggle, children, ...props }, ref) => (
  <div ref={ref} className={cn("border-b", className)} {...props}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as any, {
          ...(child.props as any),
          isOpen,
          onToggle,
        })
      }
      return child
    })}
  </div>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
    onToggle?: () => void
  }
>(({ className, isOpen, onToggle, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    )}
    onClick={onToggle}
    {...props}
  >
    {children}
    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
  </button>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isOpen?: boolean
  }
>(({ className, isOpen, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all",
      isOpen ? "animate-accordion-down" : "animate-accordion-up"
    )}
    style={{ display: isOpen ? 'block' : 'none' }}
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } 