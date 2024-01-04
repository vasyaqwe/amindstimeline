"use client"

import { Button } from "@/components/ui/button"
import { Editor } from "@/components/ui/editor"
import { notesMutationKey, notesQueryKey } from "@/config"
import { useEditor } from "@/hooks/use-editor"
import { createClient } from "@/lib/supabase/client"
import { type Note } from "@/types/supabase"
import { PlusIcon } from "@heroicons/react/20/solid"
import {
   type InfiniteData,
   useMutation,
   useQueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

export function CreateNoteForm() {
   const [content, setContent] = useState("")
   const queryClient = useQueryClient()
   const supabase = createClient()

   const { mutate, isPending } = useMutation({
      mutationKey: notesMutationKey,
      mutationFn: async ({ content, id }: { content: string; id: string }) => {
         const { data, error } = await supabase
            .from("notes")
            .insert({ content })
            .select("*")
            .single()

         if (error) {
            throw error
         } else {
            return { ...data, optimisticId: id }
         }
      },
      onSuccess: async () => {
         setContent("")
         await resetEditor()
      },
      onMutate: async ({ content, id }) => {
         await queryClient.cancelQueries({ queryKey: notesQueryKey })

         const previousNotes = queryClient.getQueryData<InfiniteData<Note[]>>(
            notesQueryKey
         ) ?? { pageParams: [1], pages: [[]] }

         queryClient.setQueryData<InfiniteData<Note[]>>(notesQueryKey, {
            ...previousNotes,
            pages: previousNotes.pages.map((page, idx) =>
               idx === 0
                  ? [
                       {
                          content,
                          id,
                          created_at: new Date().toString(),
                          created_by: "",
                       },
                       ...page,
                    ]
                  : page
            ),
         })

         editor?.commands.clearContent()
         return { previousNotes }
      },
      onError: (_err, _newTodo, context) => {
         toast.error("Failed to create note, something went wrong")
         queryClient.setQueryData(notesQueryKey, context?.previousNotes)
      },
      // onSettled: async (_, error) => {
      //    await new Promise((resolve) => setTimeout(resolve, 3000))
      //    //delay for animation to complete
      //    if (error) {
      //    return await queryClient.invalidateQueries({ queryKey: notesQueryKey })
      //    }
      // },
   })

   const { editor, onImagePaste, onImageChange, resetEditor } = useEditor({
      isPending,
      onChange: (value) => setContent(value),
      value: content,
   })

   return (
      <div className="border-b border-border/50 pb-7 lg:mx-24">
         <Editor
            editor={editor}
            isPending={isPending}
            onImageChange={onImageChange}
            onImagePaste={onImagePaste}
            onSubmit={() => {
               mutate({ content, id: `optimistic-${Date.now()}` })
            }}
         >
            {editor && (
               <Button
                  disabled={
                     editor.getText().length < 1 &&
                     !editor.getHTML().includes("img")
                  }
                  variant={"ghost"}
                  size={"icon"}
                  aria-label="Create note"
                  className="ml-auto"
               >
                  <PlusIcon className="size-8 opacity-60" />
               </Button>
            )}
         </Editor>
      </div>
   )
}
