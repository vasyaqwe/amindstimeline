import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip"
import { type TooltipTriggerProps } from "@radix-ui/react-tooltip"
import { type ComponentProps } from "react"

type HintProps = ComponentProps<"div"> &
   TooltipTriggerProps & { content: string; delayDuration?: number }

export function Hint({
   children,
   content,
   delayDuration,
   ...props
}: HintProps) {
   return (
      <TooltipProvider>
         <Tooltip
            delayDuration={delayDuration ?? 250}
            {...props}
         >
            <TooltipTrigger
               onFocus={(e) => e.preventDefault()}
               asChild
            >
               <span {...props}>{children}</span>
            </TooltipTrigger>
            <TooltipContent
               hideWhenDetached
               className="break-words font-primary"
            >
               {content}
            </TooltipContent>
         </Tooltip>
      </TooltipProvider>
   )
}
