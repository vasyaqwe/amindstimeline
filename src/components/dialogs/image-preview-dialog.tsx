/* eslint-disable @next/next/no-img-element */
"use client"

import { useEventListener } from "@/hooks/use-event-listener"
import { useGlobalStore } from "@/stores/use-global-store"
import { AnimatePresence, motion } from "framer-motion"
import { createPortal } from "react-dom"

export const ImagePreviewDialog = ({ image }: { image: string }) => {
   const { closeDialog, dialogs } = useGlobalStore()

   useEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDialog("imagePreview")
   })

   return createPortal(
      <AnimatePresence>
         {dialogs.imagePreview && (
            <>
               <motion.div
                  onClick={() => closeDialog("imagePreview")}
                  animate={{ opacity: 1 }}
                  initial={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] h-full w-full bg-muted/60 backdrop-blur-sm "
               />
               <motion.dialog
                  className="fixed inset-0 z-[100] bg-transparent"
                  onClick={() => closeDialog("imagePreview")}
                  animate={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.98 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: "just" }}
                  open
               >
                  <div className="mx-auto">
                     <img
                        className="max-h-[90svh] rounded-lg border border-border/75"
                        src={image}
                        alt={""}
                     />
                  </div>
               </motion.dialog>
            </>
         )}
      </AnimatePresence>,
      document.body
   )
}
