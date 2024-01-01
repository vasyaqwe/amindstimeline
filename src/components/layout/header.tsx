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
      <header className="container flex items-center justify-between gap-6 p-5 text-3xl text-accent md:py-10 md:text-4xl lg:px-10">
         <p className="flex-shrink-0 font-accent">
            <Image
               className="-mt-1 mr-1 inline max-w-[26px] sm:max-w-[32px]"
               src={logo}
               alt="a mind's timeline"
            />
            memento
         </p>{" "}
         {/* <form action={signOut}>
            <button className="bg-btn-background hover:bg-btn-background-hover rounded-md px-4 py-2 no-underline">
               Logout
            </button>
         </form> */}
         <p className="flex items-center gap-3 font-accent">
            <Avatar />
            <span className="line-clamp-1 break-all pr-1">
               {user?.user_metadata.full_name}
            </span>
         </p>
      </header>
   )
}
