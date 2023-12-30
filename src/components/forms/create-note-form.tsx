"use client"

import { Editor } from "@/components/ui/editor"
import { notesMutationKey, notesQueryKey } from "@/config"
import { createClient } from "@/lib/supabase/client"
import { type Note } from "@/types/supabase"
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
      onSuccess: () => {
         toast.success("Note created")
         setContent("")
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
                          created_at: "",
                          created_by: "",
                       },
                       ...page,
                    ]
                  : page
            ),
         })

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

   return (
      <div className="mx-12 border-b border-border/60 pb-6">
         <Editor
            onSubmit={() => {
               mutate({ content, id: `optimistic-${Date.now()}` })
            }}
            isPending={isPending}
            value={content}
            onChange={(value) => setContent(value)}
         />
      </div>
   )
}
