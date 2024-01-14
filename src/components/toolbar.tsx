import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEventListener } from "@/hooks/use-event-listener"
import { useIsClient } from "@/hooks/use-is-client"
import { cn, isMobile } from "@/lib/utils"
import { ArrowUpIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid"
import { AnimatePresence, motion } from "framer-motion"
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
   const { isClient } = useIsClient()

   const [lastReturnKeyPressTime, setLastReturnKeyPressTime] = useState(0)
   const [isReturnKeyPressed, setIsReturnKeyPressed] = useState(false)

   const [expanded, setExpanded] = useState(false)

   const searchInputRef = useRef<HTMLInputElement>(null)

   const isSearchQueryEmpty = searchQuery.trim() === ""

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
      let timeout: NodeJS.Timeout | null = null

      if (timeout) {
         clearTimeout(timeout)
      }

      if (e.key === "Enter") {
         const now = Date.now()
         if (now - lastReturnKeyPressTime < 600) {
            e.preventDefault()
            setIsReturnKeyPressed(false)
         } else {
            if (!isSearchQueryEmpty) {
               setIsReturnKeyPressed(true)
               timeout = setTimeout(() => {
                  setIsReturnKeyPressed(false)
               }, 250)
            }
            setLastReturnKeyPressTime(now)
         }
      }
   }

   function scrollToTop() {
      if (!isClient) return
      document.documentElement.scrollTo({ top: 0, behavior: "smooth" })
   }

   return (
      <motion.div
         //toolbar going behind ios keyboard :(
         style={{
            top: expanded && isMobile() ? 20 : "auto",
            bottom: expanded && isMobile() ? "auto" : 25,
         }}
         initial={false}
         animate={{ width: expanded ? 320 : 100 }}
         transition={{ ease: "circInOut", duration: 0.3 }}
         className="fixed left-1/2 z-[50] flex min-h-[50.5px] -translate-x-1/2 items-center overflow-hidden rounded-lg border bg-popover/10 p-1.5 shadow-lg backdrop-blur-md"
      >
         <Button
            onClick={() => {
               flushSync(() => setExpanded(!expanded))
               if (!expanded) searchInputRef.current?.focus()
            }}
            size={"icon"}
            variant={"ghost"}
            aria-label="Search notes"
            className="absolute left-1.5 flex-shrink-0 hover:bg-border"
         >
            <MagnifyingGlassIcon className="size-6 opacity-60" />
         </Button>
         <AnimatePresence initial={false}>
            {expanded && (
               <motion.form
                  id="search"
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  onKeyDown={onKeyDown}
                  className="mr-auto flex items-center"
                  onSubmit={(e) => {
                     e.preventDefault()
                     if (isSearchQueryEmpty) return

                     scrollToTop()
                     onSubmit()
                  }}
               >
                  <Input
                     value={searchQuery}
                     onKeyUp={(e) => {
                        //submit when input is empty
                        const target = e.target as HTMLInputElement
                        if (
                           target.value === "" &&
                           e.key !== "Enter" &&
                           !e.ctrlKey
                        )
                           onSubmit()
                     }}
                     onChange={(e) => {
                        setSearchQuery(e.target.value)
                     }}
                     className="border-none bg-transparent px-10 py-1 text-base placeholder:text-foreground/30"
                     ref={searchInputRef}
                     onBlur={() => {
                        searchQuery === "" && setExpanded(false)
                     }}
                     placeholder="Search notes..."
                  />
               </motion.form>
            )}
         </AnimatePresence>

         <AnimatePresence initial={false}>
            {!expanded && (
               <motion.div
                  className="absolute left-[calc(50%-0.5px)] top-1/2 h-[50%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-border"
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                     transition: {
                        delay: 0.2,
                     },
                  }}
                  exit={{
                     opacity: 0,
                     transition: {
                        duration: 0.1,
                     },
                  }}
                  aria-hidden={true}
               />
            )}
         </AnimatePresence>

         <AnimatePresence
            initial={false}
            mode="wait"
         >
            {expanded ? (
               <motion.div
                  key={expanded.toString()}
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: "circInOut", duration: 0.2 }}
                  className={cn("absolute right-1.5 flex-shrink-0")}
               >
                  <Button
                     form="search"
                     disabled={isSearchQueryEmpty}
                     aria-label="Search notes"
                     size={"icon"}
                     variant={"ghost"}
                     className="hover:bg-border data-[pressed=true]:bg-border"
                     data-pressed={isReturnKeyPressed}
                  >
                     <CornerDownLeft className={"size-6 opacity-60"} />
                  </Button>
               </motion.div>
            ) : (
               <motion.div
                  key={expanded.toString()}
                  aria-label="Scroll to top"
                  initial={{ opacity: 1 }}
                  exit={{
                     opacity: 0,
                  }}
                  animate={{ opacity: 1 }}
                  transition={{ ease: "circInOut", duration: 0.2 }}
                  className="absolute right-1.5 flex-shrink-0"
               >
                  <Button
                     onClick={scrollToTop}
                     size={"icon"}
                     variant={"ghost"}
                     className="hover:bg-border"
                  >
                     <ArrowUpIcon className="size-6 opacity-60" />
                  </Button>
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   )
}
