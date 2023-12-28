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

   const { mutate, isPending } = useMutation({
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
         // await new Promise((resolve) => setTimeout(resolve, 1000))
         //delay for animation to complete
         // void queryClient.invalidateQueries({ queryKey: notesQueryKey })
      },
   })

   return (
      <form
         ref={formRef}
         onSubmit={(e) => {
            e.preventDefault()
            if (!isPending) mutate({ content })
         }}
         className="pb-7"
      >
         <Editor
            isPending={isPending}
            value={content}
            onChange={(value) => setContent(value)}
            onKeyDown={() => formRef.current?.requestSubmit()}
         />
      </form>
   )
}
