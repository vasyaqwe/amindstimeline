import { Avatar } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import logo from "@public/logo.png"
import Image from "next/image"

export async function Header() {
   const cookieStore = cookies()
   const supabase = createClient(cookieStore)

   const {
      data: { user },
   } = await supabase.auth.getUser()

   // const signOut = async () => {
   //    "use server"

   //    const cookieStore = cookies()
   //    const supabase = createClient(cookieStore)
   //    await supabase.auth.signOut()
   //    return redirect("/login")
   // }

   return (
      <header className="container flex items-center justify-between p-5 text-accent md:p-10">
         <p className="font-accent text-3xl">
            <Image
               className="-mt-1 mr-1 inline max-w-[32px]"
               src={logo}
               alt="a mind's timeline"
            />
            a mind's timeline
         </p>{" "}
         {/* <form action={signOut}>
            <button className="bg-btn-background hover:bg-btn-background-hover rounded-md px-4 py-2 no-underline">
               Logout
            </button>
         </form> */}
         <p className="flex items-center gap-3 font-accent text-3xl">
            <Avatar />
            {user?.user_metadata.full_name}
         </p>
      </header>
   )
}
