import { cn } from "@/lib/utils"
import { type ComponentProps } from "react"

type AvatarProps = ComponentProps<"div">

export function Avatar({ className, ...props }: AvatarProps) {
   return (
      <span
         className={cn(
            "inline-block size-[var(--avatar-size)] flex-shrink-0 rounded-full ",
            className
         )}
         style={{
            background:
               "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--accent-2)))",
         }}
         {...props}
      ></span>
   )
}
