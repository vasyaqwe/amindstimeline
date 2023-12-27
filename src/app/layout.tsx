import { GeistSans } from "geist/font"
import { Carattere } from "next/font/google"
import "@/styles/globals.css"
import { TanstackProvider } from "@/components/tanstack-provider"

const defaultUrl = process.env.VERCEL_URL
   ? `https://${process.env.VERCEL_URL}`
   : "http://localhost:3000"

export const metadata = {
   metadataBase: new URL(defaultUrl),
   title: "a mind's timeline",
   description: "Anything on your mind - place it here.",
}

const carattere = Carattere({
   subsets: ["latin"],
   variable: "--font-carattere",
   weight: ["400"],
})

export default function RootLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <html
         lang="en"
         className={GeistSans.variable + " " + carattere.variable}
      >
         <body className="bg-background font-primary text-foreground">
            <TanstackProvider>{children}</TanstackProvider>
         </body>
      </html>
   )
}
