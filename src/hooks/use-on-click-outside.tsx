// hook from usehooks-ts
import { useEventListener } from "@/hooks/use-event-listener"
import { type RefObject } from "react"

type Handler = (event: MouseEvent) => void

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
   ref: RefObject<T>,
   handler: Handler,
   mouseEvent: "mousedown" | "mouseup" = "mousedown"
): void {
   useEventListener(mouseEvent, (e) => {
      const el = ref?.current
      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(e.target as Node)) {
         return
      }

      handler(e)
   })
}
