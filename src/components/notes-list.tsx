/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
"use client"

import { motion } from "framer-motion"
import { type Note } from "@/types/supabase"
import { Loading } from "@/components/ui/loading"
import {
   NOTES_LIMIT,
   notesMutationKey,
   notesQueryKey,
   motionProps,
} from "@/config"
import { useIntersection } from "@/hooks/use-intersection"
import { createClient } from "@/lib/supabase/client"
import {
   useInfiniteQuery,
   useMutationState,
   useMutation,
   useQueryClient,
   type InfiniteData,
   keepPreviousData,
} from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import {
   type Dispatch,
   type SetStateAction,
   useEffect,
   useState,
   type MouseEvent,
   useMemo,
   useDeferredValue,
} from "react"
import {
   chunk,
   cn,
   getFileNamesFromHTML,
   groupByDate,
   parseCodeBlocks,
   pick,
   reverseKeysWithValues,
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
import { Toolbar } from "@/components/toolbar"

type NotesListProps = {
   initialNotes: Note[]
}

async function fetchNotes({ pageParam = 1, searchQuery = "" }) {
   const supabase = createClient()

   const from = (pageParam - 1) * NOTES_LIMIT
   const to = from + NOTES_LIMIT - 1

   const isSearching = searchQuery && searchQuery.trim() !== ""

   let query = supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to)

   if (isSearching) {
      query = query.ilike("content", `%${searchQuery}%`)
   }

   const { data, error } = await query

   if (error) {
      throw new Error(error.message)
   }

   if (isSearching) {
      //filter out html
      return data.filter(
         (note) =>
            note.content
               ?.replace(/<\/?[^>]+(>|$)/g, "")
               .toLowerCase()
               .includes(searchQuery.toLowerCase())
      )
   }

   return data
}

export function NotesList({ initialNotes }: NotesListProps) {
   const { isClient } = useIsClient()
   const { previewImageSrc } = useGlobalStore()

   const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

   const createdNotes = useMutationState<Note & { optimisticId: string }>({
      filters: { mutationKey: notesMutationKey, status: "success" },
      select: (mutation) =>
         mutation.state.data as Note & { optimisticId: string },
   })

   const [deletedIds, setDeletedIds] = useState<string[]>([])

   //Record<optimisticId, realId>, which is used to retrieve real id where needed
   const [optimisticNotesIdsMap, setOptimisticNotesIdsMap] = useState<
      Record<string, string>
   >({})
   //this weird trick is required to make framer motion work with query invalidation (id changes from optimistic to real > animation triggers)
   useEffect(() => {
      setOptimisticNotesIdsMap(() =>
         createdNotes.reduce((acc: Record<string, string>, curr) => {
            acc[curr.optimisticId] = curr.id
            return acc
         }, {})
      )
   }, [createdNotes])

   const [searchQuery, setSearchQuery] = useState("")

   const {
      fetchNextPage,
      hasNextPage,
      refetch,
      isFetching,
      isFetchedAfterMount,
      isFetchingNextPage,
      data,
   } = useInfiniteQuery({
      queryKey: notesQueryKey,
      queryFn: ({ pageParam }) =>
         fetchNotes({
            pageParam,
            searchQuery,
         }),
      initialPageParam: 1,
      placeholderData: keepPreviousData,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      getNextPageParam: (lastPage, allPages) => {
         return lastPage?.length ? allPages.length + 1 : undefined
      },
      initialData: { pageParams: [1], pages: [initialNotes] },
   })

   const { ref, entry } = useIntersection({
      threshold: 0,
   })

   useEffect(() => {
      if (entry?.isIntersecting && hasNextPage) {
         void fetchNextPage()
      }
   }, [entry, hasNextPage, fetchNextPage])

   //wow, it just works, note exit animation bug is fixed by deferring deletedIds
   const deferredDeletedIds = useDeferredValue(deletedIds)

   const notes = Object.entries(
      groupByDate(
         data.pages?.flat().filter((n) => !deferredDeletedIds.includes(n.id))
      )
   )

   return (
      <div className="lg:pt-3">
         <Toolbar
            onSubmit={refetch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
         />
         <div
            aria-hidden={true}
            style={{
               backgroundImage:
                  "linear-gradient(180deg, hsl(var(--background) / 0) 10%, hsl(var(--background)) 95%)",
            }}
            className="pointer-events-none fixed bottom-0 left-1/2 z-[49] h-32 w-full -translate-x-1/2 lg:h-40"
         />
         {isClient && <ImagePreviewDialog image={previewImageSrc} />}

         {searchQuery.length > 0 && notes.length < 1 && !isFetching && (
            <p className="mt-5 text-center font-accent text-5xl">
               No results found.
            </p>
         )}
         {initialNotes.length < 1 && (
            <h1 className="mt-5 text-center font-accent text-5xl">
               Things to come...
            </h1>
         )}

         <AnimatePresence initial={false}>
            {notes.length > 0
               ? notes?.map((group, groupIdx) => {
                    return (
                       <motion.div
                          key={group[0]}
                          layout={"position"}
                          className="relative"
                          {...pick(motionProps, ["exit", "transition"])}
                       >
                          <motion.p
                             className="right-full top-4 whitespace-nowrap text-right text-muted-foreground max-lg:text-center lg:absolute lg:right-[calc(100%-3rem)]"
                             {...pick(motionProps, [
                                "initial",
                                "animate",
                                "transition",
                             ])}
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
                                   key={note.id}
                                   style={{
                                      zIndex:
                                         note.id === editingNoteId
                                            ? 999
                                            : noteIdx,
                                   }}
                                   className="group relative lg:px-24"
                                   {...motionProps}
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
               : null}
         </AnimatePresence>

         {isFetchedAfterMount && isFetchingNextPage && notes.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2">
               <Loading className="mx-auto mt-6" />
            </div>
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

   const { mutate: onDelete } = useMutation({
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
         const previousNotes = queryClient.getQueryData<InfiniteData<Note[]>>(
            notesQueryKey
         ) ?? { pageParams: [1], pages: [[]] }

         if (updatedNote) {
            const reversedOptimisticNotesIdsMap: Record<string, string> =
               reverseKeysWithValues(optimisticNotesIdsMap)

            const updatedNotes = previousNotes.pages.flatMap((notes) =>
               notes.map((n) =>
                  n.id ===
                  (reversedOptimisticNotesIdsMap[updatedNote.id] ??
                     updatedNote.id)
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

   const noteId = isOptimistic
      ? optimisticNotesIdsMap[note.id] ?? note.id
      : note.id

   const isEditing = editingNoteId === note.id

   const _content = useMemo(() => {
      return content.includes("<code>")
         ? parseCodeBlocks({
              content,
           })
         : content
   }, [content])

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
               className={`peer absolute right-0 z-[1] mt-4 flex scale-[85%] opacity-0 transition 
                duration-300
                focus-within:scale-100 
                focus-within:opacity-100
                group-hover:scale-100 
                group-hover:opacity-100 
                data-[visible=true]:scale-100
                data-[visible=true]:opacity-100
                max-lg:-top-full
                max-lg:translate-y-full
                lg:right-2
        `}
            >
               {isEditing ? (
                  <Button
                     aria-label="Save note"
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
                     aria-label="Edit note"
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
                     aria-label="Cancel editing"
                     size={"icon"}
                     className="rounded-l-none border-l-transparent text-foreground/60 hover:border"
                     onClick={onCancelEditing}
                  >
                     <XMarkIcon className="size-7 fill-current" />
                  </Button>
               ) : (
                  <Button
                     aria-label="Delete note"
                     size={"icon"}
                     className="rounded-l-none border-l-transparent text-foreground/60 hover:border-destructive/25 hover:text-destructive/60"
                     onClick={() => {
                        setDeletedIds((prev) => [...prev, note.id])
                        toast.success("Note deleted", {
                           duration: 3000,
                           onAutoClose: () =>
                              onDelete({
                                 id: noteId,
                              }),
                           onDismiss: () =>
                              onDelete({
                                 id: noteId,
                              }),
                           action: {
                              label: "Undo",
                              onClick: () =>
                                 setDeletedIds((prev) =>
                                    prev.filter((id) => id !== note.id)
                                 ),
                           },
                        })
                     }}
                  >
                     <TrashIcon className="size-5 fill-current" />
                  </Button>
               )}
            </div>
         )}
         <div
            id={note.id}
            className="group relative z-[2]"
         >
            <div className="overflow-hidden bg-background [&>*]:mt-4">
               {isEditing ? (
                  <Editor
                     data-hovered={isEditing}
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
                     className={cn(
                        `group prose prose-invert max-w-full rounded-2xl border border-border/30 bg-muted p-5 
                        transition-colors hover:border-border group-hover:border-border`,
                        shouldAnimate ? "animate-in-note" : ""
                     )}
                     dangerouslySetInnerHTML={{
                        __html: _content,
                     }}
                  />
               )}
            </div>
         </div>
      </>
   )
}
