import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export function getFileNameFromStorageUrl(url: string | null) {
   if (!url) return

   const path = url?.split("/public/files/")?.[1]

   return path
}

export function getFileNamesFromHTML(html: string | null): string[] {
   if (!html || typeof window === "undefined") return []

   const parser = new DOMParser()
   const doc = parser.parseFromString(html, "text/html")

   const ids = [...doc.querySelectorAll("img")]
      .map((img) => getFileNameFromStorageUrl(img.getAttribute("src")))
      .filter(Boolean)

   return ids as string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function chunk(arr: any[], chunkSize: number) {
   const chunkedArr = []
   for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize)
      chunkedArr.push(chunk)
   }
   return chunkedArr
}
