"use client"

import { useIsClient } from "@/hooks/use-is-client"
import { useTheme } from "next-themes"
import { Toaster as Sonner_Toaster } from "sonner"

export function Toaster() {
   const { resolvedTheme: _resolvedTheme } = useTheme()
   const resolvedTheme = _resolvedTheme as "light" | "dark"

   const { isClient } = useIsClient()

   if (!isClient) return null

   return (
      <Sonner_Toaster
         richColors={resolvedTheme === "light"}
         toastOptions={{
            style: {
               borderRadius: "var(--radius)",
               backgroundColor:
                  resolvedTheme === "light" ? undefined : "hsl(var(--popover))",
            },
         }}
         theme={resolvedTheme}
         position="top-center"
         style={{ font: "inherit" }}
      />
   )
}
