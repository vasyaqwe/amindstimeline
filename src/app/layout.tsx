import { GeistSans } from "geist/font"
import { Carattere } from "next/font/google"
import { JetBrains_Mono } from "next/font/google"
import "@/styles/globals.css"
import "@/styles/github-dark.css"
import { TanstackProvider } from "@/components/tanstack-provider"
import { Toaster } from "sonner"

const defaultUrl = process.env.VERCEL_URL
   ? `https://${process.env.VERCEL_URL}`
   : "http://localhost:3000"

export const metadata = {
   metadataBase: new URL(defaultUrl),
   title: "memento",
   description: "Anything on your mind - note it down here.",
}

const carattere = Carattere({
   subsets: ["latin"],
   variable: "--font-carattere",
   weight: ["400"],
})
const jetBrainsMono = JetBrains_Mono({
   subsets: ["latin"],
   variable: "--font-jet-brains",
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
         className={
            GeistSans.variable +
            " " +
            carattere.variable +
            " " +
            jetBrainsMono.variable
         }
      >
         <body className="bg-background font-primary text-foreground">
            <TanstackProvider>{children}</TanstackProvider>
            <Toaster
               theme="dark"
               toastOptions={{
                  classNames: {
                     title: "!font-normal",
                     actionButton: `bg-foreground transition-colors active:scale-[98%] hover:!bg-foreground/90`,
                  },
                  actionButtonStyle: {
                     borderRadius: ".5rem",
                     padding: "1rem",
                     transition: ".2s ease",
                     fontSize: "13px",
                  },
                  style: {
                     borderRadius: "100vmax",
                     backgroundColor: "hsl(var(--muted))",
                     color: "hsl(var(--foreground))",
                     borderColor: "hsl(var(--border)/.8)",
                  },
               }}
               position="bottom-center"
               style={{ font: "inherit" }}
            />
         </body>
      </html>
   )
}
