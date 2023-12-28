import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import logo from "@public/logo.png"
import Image from "next/image"

export default async function Login({
   searchParams,
}: {
   searchParams: { message: string }
}) {
   const cookieStore = cookies()
   const supabase = createClient(cookieStore)

   const {
      data: { session },
   } = await supabase.auth.getSession()

   if (session) redirect("/")

   const signIn = async () => {
      "use server"

      const cookieStore = cookies()
      const supabase = createClient(cookieStore)

      const baseUrl =
         process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : `https://amindstimeline.vercel.app`

      const { error, data } = await supabase.auth.signInWithOAuth({
         provider: "google",

         options: {
            queryParams: {
               access_type: "offline",
               prompt: "consent",
            },
            redirectTo: `${baseUrl}/auth/callback`,
         },
      })

      if (error) {
         return redirect("/login?message=Could not authenticate user")
      }

      redirect(data.url)
   }

   return (
      <form
         className="grid h-svh place-content-center"
         action={signIn}
      >
         <h1 className="mb-5 text-center font-accent text-6xl text-accent">
            <Image
               className="-mt-1 mr-1 inline max-w-[48px]"
               src={logo}
               alt="a mind's timeline"
            />
            a mind's timeline
         </h1>
         <Button size={"lg"}>
            <svg
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 30 30"
               width="20px"
               height="20px"
               className="-mt-0.5"
            >
               <path
                  className="fill-foreground"
                  d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"
               />
            </svg>
            Continue with Google
         </Button>
         {searchParams?.message && (
            <p className="mt-4 bg-foreground/10 p-4 text-center text-foreground">
               {searchParams.message}
            </p>
         )}
      </form>
   )
}
