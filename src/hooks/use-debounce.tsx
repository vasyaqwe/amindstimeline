import { useEffect, useState } from "react"

type UseDebounceArgs<T extends string> = {
   value: T
   delay?: number
   delayFirstLetter?: boolean
}

type DebounceResult<T extends string> = {
   debouncedValue: T
   debounceElapsed: boolean
}

export function useDebounce<T extends string>({
   value,
   delay,
   delayFirstLetter = true,
}: UseDebounceArgs<T>): DebounceResult<T> {
   const [debouncedValue, setDebouncedValue] = useState<T>(value)
   const [debounceElapsed, setDebounceElapsed] = useState(false)

   useEffect(() => {
      let timer: NodeJS.Timeout | null = null

      if (value.length === 0 || (value.length === 1 && !delayFirstLetter)) {
         setDebouncedValue(value)
         setDebounceElapsed(false)
         return
      }

      if (timer) {
         clearTimeout(timer)
      }

      timer = setTimeout(() => {
         setDebouncedValue(value)
         setDebounceElapsed(true)
      }, delay ?? 500)

      return () => {
         if (timer) {
            clearTimeout(timer)
         }
      }
   }, [value, delay, delayFirstLetter])

   return {
      debouncedValue,
      debounceElapsed,
   }
}
