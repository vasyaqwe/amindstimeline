"use client"

import { EditorOutput } from "@/components/ui/editor"
import { Skeleton } from "@/components/ui/skeleton"
import { NOTES_LIMIT, notesMutationKey, notesQueryKey } from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { type Row } from "@/types/supabase"
import {
   type QueryStatus,
   useInfiniteQuery,
   useMutationState,
} from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect } from "react"

type NotesListProps = {
   initialNotes: Row<"notes">[]
}

async function fetchNotes({ pageParam = 1 }) {
   const supabase = createClient()

   const from = (pageParam - 1) * NOTES_LIMIT
   const to = from + NOTES_LIMIT - 1

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

   const { fetchNextPage, hasNextPage, isFetchingNextPage, data } =
      useInfiniteQuery({
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
      <div className="flex flex-col gap-4 border-t border-border/60 pt-7">
         {notes.length > 0 ? (
            <AnimatePresence mode="wait">
               {notes?.map((n) => (
                  <motion.div
                     key={n?.id}
                     initial={{
                        height: n.id.startsWith("optimistic") ? 0 : "auto",
                        opacity: n.id.startsWith("optimistic") ? 0 : 1,
                     }}
                     animate={{
                        height: "auto",
                        opacity: 1,
                        transition: {
                           duration: 1,
                           type: "spring",
                           bounce: 0.4,
                           opacity: { delay: 0.1 },
                        },
                     }}
                     transition={{
                        duration: 0.6,
                        type: "spring",
                        bounce: 0,
                        opacity: { duration: 0.12 },
                     }}
                     className={cn(
                        "prose prose-invert rounded-2xl border border-border/30 bg-muted transition"
                        // n.id.startsWith("optimistic")
                        //    ? "border-accent/50 bg-accent/10 hover:border-accent/50"
                        //    : "border-border/30 bg-muted hover:border-border/60"
                     )}
                  >
                     <EditorOutput html={n?.content ?? ""} />
                  </motion.div>
               ))}
            </AnimatePresence>
         ) : variables.length < 1 ? (
            <h1 className="mt-5 text-center font-accent text-5xl">
               Things to come.
            </h1>
         ) : null}
         {isFetchingNextPage && notes.length > 1 && (
            <>
               <Skeleton className="min-h-[150px]" />
               <Skeleton className="min-h-[120px]" />
               <Skeleton className="min-h-[130px]" />
            </>
         )}
         <div
            ref={ref}
            aria-hidden={true}
         />
      </div>
   )
}
