import { type MotionProps } from "framer-motion"

export const NOTES_LIMIT = 11

export const notesQueryKey = ["notes"]

export const notesMutationKey = ["add-note"]

export const motionProps: MotionProps = {
   initial: {
      height: 0,
      opacity: 0,
   },
   exit: {
      height: 0,
      opacity: 0,
   },
   transition: {
      type: "spring",
      bounce: 0,
      opacity: { duration: 0.2 },
   },
   animate: {
      opacity: 1,
      height: "auto",
      transition: {
         type: "spring",
         bounce: 0,
         opacity: { duration: 0.2, delay: 0.1 },
      },
   },
}
