import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
   `inline-flex items-center justify-center whitespace-nowrap gap-2 rounded-lg border border-border/70 hover:border-border
    text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 
    active:pt-[9px] active:pb-[7px] active:shadow-inner`,
   {
      variants: {
         variant: {
            default: `bg-primary text-primary-foreground py-[8px] hover:bg-border/50 active:bg-border/60`,
            destructive: `bg-destructive text-destructive-foreground hover:bg-destructive/90`,
            outline: `bg-background hover:bg-accent/50 hover:text-accent-foreground`,
            secondary: `bg-secondary text-secondary-foreground hover:bg-accent`,
            ghost: "hover:bg-border/50 hover:text-foreground active:py-2 border-0 data-[pressed=true]:bg-border/50",
            link: "text-primary underline-offset-4 hover:underline",
         },
         size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8 text-base",
            icon: "h-9 w-9 rounded-md",
         },
      },
      defaultVariants: {
         variant: "default",
         size: "default",
      },
   }
)

export interface ButtonProps
   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
      VariantProps<typeof buttonVariants> {
   asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
   ({ className, variant, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button"
      return (
         <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
         />
      )
   }
)
Button.displayName = "Button"

export { Button, buttonVariants }
