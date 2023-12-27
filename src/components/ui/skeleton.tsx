import { cn } from "@/lib/utils"

function Skeleton({
   className,
   ...props
}: React.HTMLAttributes<HTMLDivElement>) {
   return (
      <div
         className={cn(
            "animate-pulse rounded-md border border-border/50 bg-border/25",
            className
         )}
         {...props}
      />
   )
}

export { Skeleton }
