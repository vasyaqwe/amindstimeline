import { createBrowserClient } from "@supabase/ssr"
import { useMemo } from "react"
import { type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export type TypedSupabaseClient = SupabaseClient<Database>

let client: TypedSupabaseClient | undefined

function getSupabaseBrowserClient() {
   if (client) {
      return client
   }

   client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )

   return client
}

function useSupabaseClient() {
   return useMemo(getSupabaseBrowserClient, [])
}

export { useSupabaseClient }
