import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEventListener } from "@/hooks/use-event-listener"
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import { motion } from "framer-motion"
import { CornerDownLeft } from "lucide-react"
import {
   useRef,
   useState,
   type KeyboardEvent,
   type Dispatch,
   type SetStateAction,
} from "react"
import { flushSync } from "react-dom"

export function Toolbar({
   onSubmit,
   setSearchQuery,
   searchQuery,
}: {
   onSubmit: () => void
   searchQuery: string
   setSearchQuery: Dispatch<SetStateAction<string>>
}) {
   const [lastKeyPressTime, setLastKeyPressTime] = useState(0)

   const [expanded, setExpanded] = useState(false)

   const searchInputRef = useRef<HTMLInputElement>(null)

   useEventListener("keydown", (e) => {
      if (e.key === "k" && e.ctrlKey) {
         flushSync(() => {
            e.preventDefault()
            setExpanded(!expanded)
         })
         if (!expanded) searchInputRef.current?.focus()
      }
      if (e.key === "Escape") {
         setExpanded(false)
         setSearchQuery("")
      }
   })

   const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") {
         const now = Date.now()
         if (now - lastKeyPressTime < 600) {
            e.preventDefault()
         } else {
            setLastKeyPressTime(now)
         }
      }
   }

   return (
      <motion.div
         animate={{ width: expanded ? 320 : 50 }}
         transition={{ ease: "easeInOut", duration: 0.25 }}
         className="fixed bottom-5 left-1/2 z-[50] -translate-x-1/2 overflow-hidden rounded-lg border border-border/60 bg-muted p-1.5 lg:bottom-7"
      >
         {expanded ? (
            <form
               onKeyDown={onKeyDown}
               className="flex items-center"
               onSubmit={(e) => {
                  e.preventDefault()

                  onSubmit()
               }}
            >
               <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-6 -translate-y-1/2 opacity-60" />
               <Input
                  value={searchQuery}
                  onKeyUp={(e) => {
                     const target = e.target as HTMLInputElement
                     if (target.value === "") onSubmit()
                  }}
                  onChange={(e) => {
                     setSearchQuery(e.target.value)
                  }}
                  className="border-none bg-transparent px-10 py-1"
                  ref={searchInputRef}
                  onBlur={() => {
                     searchQuery === "" && setExpanded(false)
                  }}
                  placeholder="Search notes..."
               />
               <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="absolute right-3 top-[52%] -translate-y-1/2"
               >
                  <CornerDownLeft className="size-6 opacity-60" />
               </motion.span>
            </form>
         ) : (
            <Button
               onClick={() => {
                  flushSync(() => setExpanded(true))
                  searchInputRef.current?.focus()
               }}
               size={"icon"}
               variant={"ghost"}
            >
               <MagnifyingGlassIcon className="size-6 opacity-60" />
            </Button>
         )}
      </motion.div>
   )
}
