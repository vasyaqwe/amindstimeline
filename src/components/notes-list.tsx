/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client"

import { motion } from "framer-motion"
import { type Note } from "@/types/supabase"
import { Loading } from "@/components/ui/loading"
import { NOTES_LIMIT, notesMutationKey, notesQueryKey } from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { createClient } from "@/lib/supabase/client"
import {
   type QueryStatus,
   useInfiniteQuery,
   useMutationState,
   useMutation,
} from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { cn, getFileNamesFromHTML } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TrashIcon } from "@heroicons/react/20/solid"
import { toast } from "sonner"

type NotesListProps = {
   initialNotes: Note[]
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
   const createdNotes = useMutationState<Note & { optimisticId: string }>({
      filters: { mutationKey: notesMutationKey, status: "success" },
      select: (mutation) =>
         mutation.state.data as Note & { optimisticId: string },
   })

   const [deletedIds, setDeletedIds] = useState<string[]>([])
   const [optimisticNotesIdsMap, setOptimisticNotesIdsMap] = useState<
      Record<string, string>
   >({})

   useEffect(() => {
      setOptimisticNotesIdsMap(() =>
         createdNotes.reduce((acc: Record<string, string>, curr) => {
            acc[curr.optimisticId] = curr.id
            return acc
         }, {})
      )
   }, [createdNotes])

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

   const notes = data.pages?.flat().filter((n) => !deletedIds.includes(n.id))

   const { ref, entry } = useIntersection({
      threshold: 0,
   })

   useEffect(() => {
      if (entry?.isIntersecting && hasNextPage) {
         void fetchNextPage()
      }
   }, [entry, hasNextPage, fetchNextPage])

   return (
      <div className="pt-3">
         <AnimatePresence initial={false}>
            {notes.length > 0 ? (
               notes?.map((note) => (
                  <motion.div
                     key={note.id}
                     exit={{
                        height: 0,
                        opacity: 0,
                     }}
                     initial={{
                        height: 0,
                        opacity: 0,
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
                     className="group relative px-12"
                  >
                     <EditorOutput
                        note={note}
                        optimisticNotesIdsMap={optimisticNotesIdsMap}
                        setDeletedIds={setDeletedIds}
                     />
                  </motion.div>
               ))
            ) : variables.length < 1 ? (
               <h1 className="mt-5 text-center font-accent text-5xl">
                  Things to come...
               </h1>
            ) : null}
         </AnimatePresence>

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

type EditorOutputProps = {
   note: Note
   setDeletedIds: Dispatch<SetStateAction<string[]>>
   optimisticNotesIdsMap: Record<string, string>
}

const EditorOutput = ({
   note,
   setDeletedIds,
   optimisticNotesIdsMap,
}: EditorOutputProps) => {
   const isOptimistic = note.id.startsWith("optimistic")
   const supabase = createClient()

   const { mutate: onDelete, isPending: isDeletePending } = useMutation({
      mutationKey: ["notes", note.id, "delete"],
      mutationFn: async ({ id }: { id: string }) => {
         const { data, error } = await supabase
            .from("notes")
            .delete()
            .eq("id", id)
            .select("*")

         if (error) {
            throw error
         } else {
            return data[0]
         }
      },
      onSuccess: async (deletedNote) => {
         toast.success("Note deleted")
         setDeletedIds((prev) => [...prev, note.id])

         if (deletedNote) {
            const filesToDelete = getFileNamesFromHTML(
               deletedNote.content
            ).filter(Boolean)
            if (filesToDelete.length > 0) {
               await supabase.storage.from("files").remove(filesToDelete)
            }
         }
      },
      onError: () => {
         toast.error("Failed to delete note, something went wrong")
      },
   })

   const realNoteId = optimisticNotesIdsMap[note.id]

   return (
      <>
         {(realNoteId || !isOptimistic) && (
            <div
               className={`absolute left-[calc(100%-48px)] z-[1] mt-4 -translate-x-10 scale-75 opacity-0 transition
                duration-300 group-hover:translate-x-4 group-hover:scale-100 group-hover:opacity-100`}
            >
               <Button
                  disabled={isDeletePending}
                  size={"icon"}
                  className="text-foreground/60 hover:border-destructive/25 hover:text-destructive/70"
                  onClick={() =>
                     onDelete({
                        id: isOptimistic && realNoteId ? realNoteId : note.id,
                     })
                  }
               >
                  {isDeletePending ? (
                     <Loading />
                  ) : (
                     <TrashIcon className="size-6 fill-current" />
                  )}
               </Button>
            </div>
         )}
         <div className="relative z-[2] overflow-hidden [&>div]:mt-4">
            <div
               className={cn(
                  "group prose prose-invert rounded-2xl border border-border/30 bg-muted p-5 transition-colors hover:border-border",
                  isOptimistic ? "animate-in-note" : ""
               )}
               dangerouslySetInnerHTML={{
                  __html: note.content?.replaceAll("<p></p>", "") ?? "",
               }}
            />
         </div>
      </>
   )
}
