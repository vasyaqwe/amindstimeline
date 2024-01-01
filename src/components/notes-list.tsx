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
   useQueryClient,
   type InfiniteData,
} from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import {
   type Dispatch,
   type SetStateAction,
   useEffect,
   useState,
   useRef,
   Fragment,
} from "react"
import { chunk, cn, getFileNamesFromHTML, groupByDate } from "@/lib/utils"
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
import { toHtml } from "hast-util-to-html"
import { common, createLowlight } from "lowlight"

const lowlight = createLowlight(common)

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
      <div>
         {notes.length > 0 ? (
            Object.entries(groupByDate(notes))?.map((group, idx) => {
               return (
                  <div
                     className="relative mt-3"
                     key={idx}
                  >
                     <p className="right-full top-4 whitespace-nowrap text-right text-muted-foreground max-lg:text-center lg:absolute">
                        {" "}
                        {group[0]}{" "}
                        <span className="text-lg text-accent">
                           {group[1].length}
                        </span>
                     </p>
                     <AnimatePresence initial={false}>
                        {group[1].map((note) => (
                           <motion.div
                              style={{ zIndex: idx }}
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
                              className="group relative lg:px-12"
                           >
                              <EditorOutput
                                 note={note}
                                 optimisticNotesIdsMap={optimisticNotesIdsMap}
                                 setDeletedIds={setDeletedIds}
                              />
                           </motion.div>
                        ))}
                     </AnimatePresence>
                  </div>
               )
            })
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
   const supabase = createClient()
   const queryClient = useQueryClient()
   const [shouldAnimate, setShouldAnimate] = useState(
      note.id.startsWith("optimistic")
   )
   const [isClient, setIsClient] = useState(false)
   const [isEditing, setIsEditing] = useState(false)
   const [content, setContent] = useState(note.content ?? "")

   const wrapperRef = useRef<HTMLDivElement>(null)

   const isOptimistic = note.id.startsWith("optimistic")

   useEffect(() => {
      setIsClient(true)
   }, [])

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
         //update note's content (can't update everything with invalidateQueries because framer motion animation will trigger)
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
                  n.id === _optimisticNotesIdsMap[updatedNote.id]
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

         toast.success("Note updated")
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
      setIsEditing(false)
      setContent(note.content ?? "")
   }

   useEventListener("keydown", (e) => {
      if (e.key === "Escape") onCancelEditing()
   })

   const realNoteId = optimisticNotesIdsMap[note.id]

   function parseCodeBlocks() {
      const _content = content?.replaceAll("<p></p>", "") ?? ""
      if (!isClient) return _content

      const regex = /<code>([\s\S]*?)<\/code>/gm
      let m
      let outputHtml = _content
      while ((m = regex.exec(_content)) !== null) {
         // Extract the unescaped innerText of the <code> tag
         const tempDiv = document.createElement("div")
         tempDiv.innerHTML = m[0]
         const codeText = (tempDiv?.firstChild as HTMLElement)?.innerText

         // Replace the <code> block with the processed version
         const processedCodeText = toHtml(lowlight.highlightAuto(codeText))

         const newCodeTag = `<code>${processedCodeText}</code>`
         outputHtml =
            outputHtml.substring(0, m.index) +
            newCodeTag +
            outputHtml.substring(regex.lastIndex)
         regex.lastIndex += newCodeTag.length - m[0].length

         // Replace escaped characters back to "<" and ">"
         outputHtml = outputHtml.replace(/</g, "<").replace(/&gt;/g, ">")
      }
      return outputHtml
   }

   const noteId = isOptimistic && realNoteId ? realNoteId : note.id
   return (
      <>
         {(noteId || !isOptimistic) && (
            <div
               data-visible={isEditing}
               className={`absolute z-[1] mt-4 flex scale-75 opacity-0 transition duration-300 group-hover:scale-100
                group-hover:opacity-100 data-[visible=true]:scale-100 data-[visible=true]:opacity-100
                max-lg:right-0 max-lg:translate-y-10 max-lg:group-hover:-translate-y-12 
                max-lg:data-[visible=true]:-translate-y-12
                lg:left-[calc(100%-48px)]
                lg:-translate-x-10
                lg:group-hover:translate-x-4 lg:data-[visible=true]:translate-x-4`}
            >
               {isEditing ? (
                  <Button
                     disabled={isUpdatePending}
                     size={"icon"}
                     className="rounded-r-none border-r-transparent text-foreground/60 hover:border-[#16a34a]/25 hover:text-[#16a34a]/60"
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
                     disabled={isDeletePending}
                     size={"icon"}
                     className="rounded-r-none border-r-transparent text-foreground/60 hover:border-destructive/25 hover:text-destructive/60"
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
                     size={"icon"}
                     className="rounded-l-none border-l-transparent text-foreground/60 hover:border"
                     onClick={() => {
                        setShouldAnimate(false)
                        setIsEditing(true)

                        if (editor) editor.commands.focus("end")
                     }}
                  >
                     <PencilIcon className="size-5 fill-current" />
                  </Button>
               )}
            </div>
         )}
         <div
            className="group relative z-[2] overflow-hidden [&>*]:mt-4"
            ref={wrapperRef}
         >
            {isEditing ? (
               <Editor
                  shouldSubmitOnEnter={false}
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
                  data-hovered={isEditing}
                  className={cn(
                     "group prose prose-invert max-w-full rounded-2xl border border-border/30 bg-muted p-5 transition-colors hover:border-border group-hover:border-border",
                     shouldAnimate ? "animate-in-note" : ""
                  )}
                  dangerouslySetInnerHTML={{
                     __html: content.includes("<code>")
                        ? parseCodeBlocks()
                        : content?.replaceAll("<p></p>", "") ?? "",
                  }}
               />
            )}
         </div>
      </>
   )
}
