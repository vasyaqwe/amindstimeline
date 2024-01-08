import { type Note } from "@/types/supabase"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toHtml } from "hast-util-to-html"
import { createLowlight } from "lowlight"
import { decode } from "html-entities"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import css from "highlight.js/lib/languages/css"
import xml from "highlight.js/lib/languages/xml"

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

function formatDate(timestamp: string) {
   const date = new Date(timestamp)

   return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
   }).format(date)
}

export const groupByDate = (notes: Note[]) => {
   return notes.reduce((acc: Record<string, Note[]>, curr) => {
      const key = getDisplayKey(curr)

      if (!acc[key]) acc[key] = []

      acc[key]?.push(curr)

      return acc
   }, {})
}

function getDisplayKey(note: Note) {
   const date = new Date(note.created_at)

   const now = new Date()
   const yesterday = new Date(now)

   yesterday.setDate(now.getDate() - 1)

   const beforeYesterday = new Date(now)
   beforeYesterday.setDate(now.getDate() - 2)

   if (date.toDateString() === now.toDateString()) {
      return "Today"
   } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
   }

   return formatDate(note.created_at)
}

export function isMobile() {
   if (typeof window === "undefined") return false

   // Check for touch screen capability
   const hasTouchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0

   // Check the user agent string
   const userAgent = navigator.userAgent.toLowerCase()
   const isMobileUserAgent =
      /mobile|android|touch|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
         userAgent
      )

   return hasTouchScreen && isMobileUserAgent
}

export function parseCodeBlocks({ content }: { content: string }) {
   const splitChunks = content.split(/(<pre><code>[\s\S]*?<\/code><\/pre>)/g)
   const lowlight = createLowlight({
      javascript,
      typescript,
      xml,
      css,
   })

   for (let i = 0; i < splitChunks.length; i++) {
      if (splitChunks[i]?.startsWith("<pre><code>")) {
         const codeBlockContent = decode(splitChunks[i])
            ?.replace("<pre><code>", "")
            .replace("</code></pre>", "")

         const highlightedCode = toHtml(
            lowlight.highlightAuto(codeBlockContent ?? "")
         )

         const decodedCode = highlightedCode

         const updated = `<pre><code>${decodedCode}</code></pre>`

         splitChunks[i] = updated
      }
   }
   return splitChunks.join("")
}
