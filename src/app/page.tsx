import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Header } from "@/components/layout/header"
import { redirect } from "next/navigation"
import { CreateNoteForm } from "@/components/forms/create-note-form"
import { NOTES_LIMIT } from "@/config"
import { NotesList } from "@/components/notes-list"
import { type Row } from "@/types/supabase"

export default async function Index() {
   const cookieStore = cookies()
   const supabase = createClient(cookieStore)

   const {
      data: { session },
   } = await supabase.auth.getSession()

   if (!session) redirect("/sign-in")

   const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(NOTES_LIMIT)

   return (
      <>
         <Header />
         <main className="mx-auto max-w-2xl pb-20 pt-6">
            <CreateNoteForm />
            <NotesList initialNotes={notes as Row<"notes">[]} />
         </main>
      </>
   )
}
