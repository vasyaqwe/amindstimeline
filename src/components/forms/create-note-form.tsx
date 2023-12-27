"use client"

import { Editor } from "@/components/ui/editor"
import { notesMutationKey, notesQueryKey } from "@/config"
import { createClient } from "@/lib/supabase/client"
import { type Row } from "@/types/supabase"
import {
   type InfiniteData,
   useMutation,
   useQueryClient,
} from "@tanstack/react-query"
import { useRef, useState } from "react"

export function CreateNoteForm() {
   const [content, setContent] = useState("")
   const queryClient = useQueryClient()
   const supabase = createClient()

   const formRef = useRef<HTMLFormElement>(null)

   const { mutate } = useMutation({
      mutationKey: notesMutationKey,
      mutationFn: async ({ content }: { content: string }) => {
         await supabase.from("notes").insert({ content }).single()
      },
      onSuccess: () => {
         setContent("")
      },
      onMutate: async ({ content }) => {
         await queryClient.cancelQueries({ queryKey: notesQueryKey })

         const previousNotes = queryClient.getQueryData<
            InfiniteData<Row<"notes">[]>
         >(notesQueryKey) ?? { pageParams: [1], pages: [[]] }

         queryClient.setQueryData<InfiniteData<Row<"notes">[]>>(notesQueryKey, {
            ...previousNotes,
            pages: previousNotes.pages.map((page, idx) =>
               idx === 0
                  ? [
                       {
                          content,
                          id: `optimistic-${Date.now()}`,
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
         queryClient.setQueryData(notesQueryKey, context?.previousNotes)
      },
      onSettled: async () => {
         return await queryClient.invalidateQueries({ queryKey: notesQueryKey })
      },
   })

   return (
      <form
         ref={formRef}
         onSubmit={(e) => {
            e.preventDefault()
            mutate({ content })
         }}
         className="pb-7"
      >
         <Editor
            value={content}
            onChange={(value) => setContent(value)}
            onKeyDown={() => formRef.current?.requestSubmit()}
         />
      </form>
   )
}
