"use client"

import { type HTMLMotionProps, motion } from "framer-motion"
import { type Row } from "@/types/supabase"
import { Loading } from "@/components/ui/loading"
import { NOTES_LIMIT, notesMutationKey, notesQueryKey } from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { createClient } from "@/lib/supabase/client"
import {
   type QueryStatus,
   useInfiniteQuery,
   useMutationState,
} from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

type NotesListProps = {
   initialNotes: Row<"notes">[]
}

async function fetchNotes({ pageParam = 1 }) {
   const supabase = createClient()

   const from = (pageParam - 1) * NOTES_LIMIT
   const to = from + NOTES_LIMIT - 1
   await new Promise((resolve) => setTimeout(resolve, 200))

   const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

   if (error) {
      throw new Error(error.message)
   }

   return data
}

export function NotesList({ initialNotes }: NotesListProps) {
   const variables = useMutationState<QueryStatus>({
      filters: { mutationKey: notesMutationKey, status: "pending" },
      select: (mutation) => mutation.state.status as never,
   })

   const {
      fetchNextPage,
      hasNextPage,
      isFetchedAfterMount,
      isFetchingNextPage,
      data,
   } = useInfiniteQuery({
      queryKey: notesQueryKey,
      queryFn: fetchNotes,
      initialPageParam: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      getNextPageParam: (lastPage, allPages) => {
         return lastPage?.length ? allPages.length + 1 : undefined
      },
      initialData: { pageParams: [1], pages: [initialNotes] },
   })

   const notes = data.pages?.flat()

   const { ref, entry } = useIntersection({
      threshold: 0,
   })

   useEffect(() => {
      if (entry?.isIntersecting && hasNextPage) {
         void fetchNextPage()
      }
   }, [entry, hasNextPage, fetchNextPage])

   return (
      <div className="flex flex-col gap-4 border-t border-border/40 pt-7">
         {notes.length > 0 ? (
            <AnimatePresence mode="wait">
               {notes?.map((note) => (
                  <EditorOutput
                     note={note}
                     key={note?.id}
                  />
               ))}
            </AnimatePresence>
         ) : variables.length < 1 ? (
            <h1 className="mt-5 text-center font-accent text-5xl">
               Things to come...
            </h1>
         ) : null}

         {isFetchedAfterMount && isFetchingNextPage && notes.length > 1 && (
            <Loading className="mx-auto mt-6" />
         )}
         <div
            ref={ref}
            aria-hidden={true}
         />
      </div>
   )
}

const EditorOutput = ({
   className,
   note,
   ...props
}: HTMLMotionProps<"div"> & { note: Row<"notes"> }) => {
   const shouldAnimate = note.id.startsWith("optimistic")

   return (
      <motion.div
         initial={{
            height: shouldAnimate ? 0 : "auto",
            opacity: shouldAnimate ? 0 : 1,
         }}
         animate={{
            opacity: 1,
            height: "auto",
            transition: {
               type: "spring",
               bounce: 0.3,
               opacity: { delay: 0.1 },
            },
         }}
         transition={{
            duration: 0.7,
            type: "spring",
            bounce: 0,
            opacity: { duration: 0.25 },
         }}
         className={cn(
            "prose prose-invert rounded-2xl border border-border/30 bg-muted transition-colors hover:border-border",
            shouldAnimate ? "animate-in-note" : "",
            className
         )}
         {...props}
      >
         <div
            className="p-5"
            dangerouslySetInnerHTML={{
               __html: note.content?.replaceAll("<p></p>", "") ?? "",
            }}
         />
      </motion.div>
   )
}
