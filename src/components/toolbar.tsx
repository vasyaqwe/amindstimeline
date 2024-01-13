import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEventListener } from "@/hooks/use-event-listener"
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
         animate={{ width: expanded ? 320 : 100 }}
         transition={{ ease: "circInOut", duration: 0.4 }}
         className="fixed bottom-5 left-1/2 z-[50] flex min-h-[50.5px] -translate-x-1/2 items-center overflow-hidden rounded-lg border border-border/60 bg-muted p-1.5 lg:bottom-7"
      >
         <Button
            onClick={() => {
               flushSync(() => setExpanded(!expanded))
               searchInputRef.current?.focus()
            }}
            size={"icon"}
            variant={"ghost"}
            aria-label="Search notes"
            className="absolute left-1.5 flex-shrink-0"
         >
            <MagnifyingGlassIcon className="size-6 opacity-60" />
         </Button>
         <AnimatePresence>
            {expanded && (
               <motion.form
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  onKeyDown={onKeyDown}
                  className="mr-auto flex items-center"
                  onSubmit={(e) => {
                     e.preventDefault()

                     onSubmit()
                  }}
               >
                  <Input
                     value={searchQuery}
                     onKeyUp={(e) => {
                        const target = e.target as HTMLInputElement
                        if (target.value === "") onSubmit()
                     }}
                     onChange={(e) => {
                        setSearchQuery(e.target.value)
                     }}
                     className="border-none bg-transparent px-10 py-1 text-base"
                     ref={searchInputRef}
                     onBlur={() => {
                        searchQuery === "" && setExpanded(false)
                     }}
                     placeholder="Search notes..."
                  />
               </motion.form>
            )}
         </AnimatePresence>

         <AnimatePresence>
            {!expanded && (
               <motion.div
                  className="absolute left-[calc(50%-0.5px)] top-1/2 h-[50%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                     transition: {
                        delay: 0.3,
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

         <AnimatePresence mode="wait">
            {expanded ? (
               <motion.div
                  key={expanded.toString()}
                  initial={{ opacity: 0 }}
                  animate={{
                     opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: "circInOut", duration: 0.2 }}
                  className="absolute right-1.5 flex-shrink-0"
               >
                  <Button
                     disabled={searchQuery.trim() === ""}
                     aria-label="Search notes"
                     onClick={() => {
                        onSubmit()
                     }}
                     size={"icon"}
                     variant={"ghost"}
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
                     onClick={() => {
                        document.documentElement.scrollTo({
                           top: 0,
                           behavior: "smooth",
                        })
                     }}
                     size={"icon"}
                     variant={"ghost"}
                  >
                     <ArrowUpIcon className="size-6 opacity-60" />
                  </Button>
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>
   )
}
