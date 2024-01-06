/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client"

import { LayoutGroup, motion } from "framer-motion"
import { type Note } from "@/types/supabase"
import { Loading } from "@/components/ui/loading"
import {
   NOTES_LIMIT,
   notesMutationKey,
   notesQueryKey,
   transition,
} from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { createClient } from "@/lib/supabase/client"
import {
   type QueryStatus,
   useInfiniteQuery,
   useMutationState,
   useMutation,
   useQueryClient,
   type InfiniteData,
} from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import {
   type Dispatch,
   type SetStateAction,
   useEffect,
   useState,
   type MouseEvent,
} from "react"
import {
   chunk,
   cn,
   getFileNamesFromHTML,
   groupByDate,
   parseCodeBlocks,
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
   CheckIcon,
   PencilIcon,
   TrashIcon,
   XMarkIcon,
} from "@heroicons/react/20/solid"
import { toast } from "sonner"
import { Editor } from "@/components/ui/editor"
import { useEventListener } from "@/hooks/use-event-listener"
import { useEditor } from "@/hooks/use-editor"
import { createPortal } from "react-dom"
import { useIsClient } from "@/hooks/use-is-client"
import { ImagePreviewDialog } from "@/components/dialogs/image-preview-dialog"
import { useGlobalStore } from "@/stores/use-global-store"

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
   const { isClient } = useIsClient()
   const { previewImageSrc } = useGlobalStore()
   const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

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

   //this weird trick is required to make framer motion work with tanstack query
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

   const notes = Object.entries(
      groupByDate(data.pages?.flat().filter((n) => !deletedIds.includes(n.id)))
   )

   const { ref, entry } = useIntersection({
      threshold: 0,
   })

   useEffect(() => {
      if (entry?.isIntersecting && hasNextPage) {
         void fetchNextPage()
      }
   }, [entry, hasNextPage, fetchNextPage])

   return (
      <div className="lg:pt-3">
         {isClient && <ImagePreviewDialog image={previewImageSrc} />}

         <LayoutGroup>
            <AnimatePresence initial={false}>
               {notes.length > 0 ? (
                  notes?.map((group, groupIdx) => {
                     return (
                        <motion.div
                           layout={"position"}
                           exit={{
                              height: 0,
                              opacity: 0,
                           }}
                           transition={transition}
                           key={group[0]}
                           className="relative"
                        >
                           <motion.p
                              initial={{
                                 height: 0,
                                 opacity: 0,
                              }}
                              animate={{
                                 opacity: 1,
                                 height: "auto",
                                 transition: {
                                    type: "spring",
                                    bounce: 0,
                                    opacity: { delay: 0.1 },
                                 },
                              }}
                              className="right-full top-4 whitespace-nowrap text-right text-muted-foreground max-lg:text-center lg:absolute lg:right-[calc(100%-3rem)]"
                           >
                              {" "}
                              {group[0]}{" "}
                              <span
                                 className={cn(
                                    "ml-1 inline-block text-lg text-accent",
                                    groupIdx === 0
                                       ? "max-lg:mt-4"
                                       : "max-lg:mt-3"
                                 )}
                              >
                                 {group[1].length > NOTES_LIMIT - 1
                                    ? "15+"
                                    : group[1].length}
                              </span>
                           </motion.p>
                           <AnimatePresence initial={false}>
                              {group[1].map((note, noteIdx) => (
                                 <motion.div
                                    style={{
                                       zIndex:
                                          note.id === editingNoteId
                                             ? 999
                                             : noteIdx,
                                    }}
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
                                          bounce: 0,
                                          opacity: { delay: 0.1 },
                                       },
                                    }}
                                    transition={transition}
                                    className="group relative lg:px-24"
                                 >
                                    <EditorOutput
                                       editingNoteId={editingNoteId}
                                       setEditingNoteId={setEditingNoteId}
                                       note={note}
                                       optimisticNotesIdsMap={
                                          optimisticNotesIdsMap
                                       }
                                       setDeletedIds={setDeletedIds}
                                    />
                                 </motion.div>
                              ))}
                           </AnimatePresence>
                        </motion.div>
                     )
                  })
               ) : variables.length < 1 ? (
                  <h1 className="mt-5 text-center font-accent text-5xl">
                     Things to come...
                  </h1>
               ) : null}
            </AnimatePresence>
         </LayoutGroup>

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
   editingNoteId: string | null
   setEditingNoteId: Dispatch<SetStateAction<string | null>>
   setDeletedIds: Dispatch<SetStateAction<string[]>>
   optimisticNotesIdsMap: Record<string, string>
}

const EditorOutput = ({
   note,
   setDeletedIds,
   setEditingNoteId,
   editingNoteId,
   optimisticNotesIdsMap,
}: EditorOutputProps) => {
   const supabase = createClient()
   const queryClient = useQueryClient()
   const { showDialog } = useGlobalStore()
   const { isClient } = useIsClient()

   const [shouldAnimate, setShouldAnimate] = useState(
      note.id.startsWith("optimistic")
   )
   const [content, setContent] = useState(note.content ?? "")

   const isOptimistic = note.id.startsWith("optimistic")

   const { mutate: onDelete, isPending: isDeletePending } = useMutation({
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

   const { mutate: onUpdate, isPending: isUpdatePending } = useMutation({
      mutationKey: ["notes-update"],
      mutationFn: async ({ id }: { id: string }) => {
         const { data, error } = await supabase
            .from("notes")
            .update({ content })
            .eq("id", id)
            .select("*")

         if (error) {
            throw error
         } else {
            return data[0]
         }
      },
      onSuccess: async (updatedNote) => {
         //update note's content (can't update everything with invalidateQueries because framer motion animation will trigger due to id update)
         const previousNotes =
            queryClient.getQueryData<InfiniteData<Note[]>>(notesQueryKey)
         if (updatedNote && previousNotes) {
            const _optimisticNotesIdsMap: Record<string, string> =
               Object.entries(optimisticNotesIdsMap).reduce(
                  (acc, [key, value]) => ({ ...acc, [value]: key }),
                  {}
               )

            const updatedNotes = previousNotes.pages.flatMap((notes) =>
               notes.map((n) =>
                  n.id ===
                  (_optimisticNotesIdsMap[updatedNote.id] ?? updatedNote.id)
                     ? {
                          ...n,
                          content: updatedNote?.content,
                       }
                     : n
               )
            )

            queryClient.setQueryData<InfiniteData<Note[]>>(notesQueryKey, {
               ...previousNotes,
               pages: chunk(updatedNotes, NOTES_LIMIT),
            })
         }

         onCancelEditing()
         await resetEditor()
         editor?.commands.setContent(updatedNote?.content ?? "")
         setContent(updatedNote?.content ?? "")
      },
      onError: () => {
         toast.error("Failed to update note, something went wrong")
      },
   })

   const { editor, onImagePaste, onImageChange, resetEditor } = useEditor({
      isPending: isUpdatePending,
      onChange: (value) => setContent(value),
      value: content,
      shouldInitNewEditorOnReset: false,
   })

   function onCancelEditing() {
      editor?.commands.setContent(note.content)
      setEditingNoteId(null)
      setContent(note.content ?? "")
   }

   function onEditorOutputClick(e: MouseEvent<HTMLDivElement>) {
      const target = e.target as Element
      if (
         target instanceof HTMLImageElement &&
         target.classList.contains("editor-image")
      ) {
         useGlobalStore.setState({
            previewImageSrc: target.src,
         })
         showDialog("imagePreview")
      }
   }

   useEventListener("keydown", (e) => {
      if (e.key === "Escape") onCancelEditing()
   })

   const realNoteId = optimisticNotesIdsMap[note.id]

   const noteId = isOptimistic && realNoteId ? realNoteId : note.id

   const isEditing = editingNoteId === note.id

   return (
      <>
         {isClient &&
            editingNoteId === note.id &&
            createPortal(
               <div
                  onClick={() => onCancelEditing()}
                  aria-hidden={true}
                  className={`fixed inset-0 z-[50] bg-muted/60 backdrop-blur-sm animate-in fade-in-0`}
               />,
               document.body
            )}
         {(noteId || !isOptimistic) && (
            <div
               data-visible={isEditing}
               className={`absolute z-[1] mt-4 flex scale-75 opacity-0 transition duration-300 
                focus-within:scale-100
                focus-within:opacity-100 
                group-hover:scale-100
                group-hover:opacity-100 
                data-[visible=true]:scale-100 
                data-[visible=true]:opacity-100
                max-lg:right-0
                max-lg:translate-y-10 
                max-lg:focus-within:-translate-y-12 
                max-lg:group-hover:-translate-y-12 
                max-lg:data-[visible=true]:-translate-y-12 
                lg:left-[calc(100%-48px)]
                lg:-translate-x-20
                lg:focus-within:-translate-x-9 
                lg:group-hover:-translate-x-9 
                lg:data-[visible=true]:-translate-x-9`}
            >
               {isEditing ? (
                  <Button
                     disabled={isUpdatePending}
                     size={"icon"}
                     className={cn(
                        "rounded-r-none border-r-transparent text-foreground/60",
                        !isUpdatePending
                           ? "hover:border-[#16a34a]/25 hover:text-[#16a34a]/60"
                           : ""
                     )}
                     onClick={() => onUpdate({ id: noteId })}
                  >
                     {isUpdatePending ? (
                        <Loading />
                     ) : (
                        <CheckIcon className="size-6 fill-current" />
                     )}
                  </Button>
               ) : (
                  <Button
                     size={"icon"}
                     className="rounded-r-none border-r-transparent text-foreground/60 hover:border"
                     onClick={() => {
                        setShouldAnimate(false)
                        setEditingNoteId(note.id)

                        if (editor) editor.commands.focus("end")
                     }}
                  >
                     <PencilIcon className="size-5 fill-current" />
                  </Button>
               )}
               {isEditing ? (
                  <Button
                     disabled={isDeletePending}
                     size={"icon"}
                     className="rounded-l-none border-l-transparent text-foreground/60 hover:border"
                     onClick={onCancelEditing}
                  >
                     <XMarkIcon className="size-7 fill-current" />
                  </Button>
               ) : (
                  <Button
                     disabled={isDeletePending}
                     size={"icon"}
                     className="rounded-l-none border-l-transparent text-foreground/60 hover:border-destructive/25 hover:text-destructive/60"
                     onClick={() =>
                        onDelete({
                           id: noteId,
                        })
                     }
                  >
                     {isDeletePending ? (
                        <Loading />
                     ) : (
                        <TrashIcon className="size-5 fill-current" />
                     )}
                  </Button>
               )}
            </div>
         )}
         <div
            id={note.id}
            className="group relative z-[2]"
         >
            <div className="overflow-hidden [&>*]:mt-4">
               {isEditing ? (
                  <Editor
                     toolbarStyle="floating"
                     className="!min-h-[auto]"
                     onSubmit={() => {
                        onUpdate({ id: noteId })
                     }}
                     editor={editor}
                     isPending={isUpdatePending}
                     onImageChange={onImageChange}
                     onImagePaste={onImagePaste}
                  />
               ) : (
                  <div
                     onClick={onEditorOutputClick}
                     data-hovered={isEditing}
                     className={cn(
                        "group prose prose-invert max-w-full rounded-2xl border border-border/30 bg-muted p-5 transition-colors hover:border-border group-hover:border-border",
                        shouldAnimate ? "animate-in-note" : ""
                     )}
                     dangerouslySetInnerHTML={{
                        __html: content.includes("<code>")
                           ? isClient
                              ? parseCodeBlocks({ content })
                              : content
                           : content,
                     }}
                  />
               )}
            </div>
         </div>
      </>
   )
}
