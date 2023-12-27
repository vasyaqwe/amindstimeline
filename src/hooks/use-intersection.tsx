import { type RefObject, useEffect, useRef, useState } from "react"

export function useIntersection({ threshold = 0, root = null }): {
   ref: RefObject<HTMLDivElement>
   entry: IntersectionObserverEntry | undefined
} {
   const [entry, setEntry] = useState<IntersectionObserverEntry>()

   const ref = useRef<HTMLDivElement>(null)

   function updateEntry([entry]: IntersectionObserverEntry[]) {
      setEntry(entry)
   }

   useEffect(() => {
      const node = ref?.current
      const supports = !!window.IntersectionObserver

      if (!supports || !node) return

      const observerParams = { threshold, root }
      const observer = new IntersectionObserver(updateEntry, observerParams)
      observer.observe(node)

      return () => observer.disconnect()

      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [ref?.current, root])

   return { ref, entry }
}
