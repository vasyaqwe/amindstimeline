import { type Note } from "@/types/supabase"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toHtml } from "hast-util-to-html"
import { common, createLowlight } from "lowlight"

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
   const lowlight = createLowlight(common)

   const regex = /<code>([\s\S]*?)<\/code>/gm
   let m
   let outputHtml = content
   while ((m = regex.exec(content)) !== null) {
      // Extract the unescaped innerText of the <code> tag
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = m[0]
      const codeText = (tempDiv?.firstChild as HTMLElement)?.innerText

      // Replace the <code> block with the processed version
      const processedCodeText = toHtml(lowlight.highlightAuto(codeText))

      const newCodeTag = `<code>${processedCodeText}</code>`
      outputHtml =
         outputHtml.substring(0, m.index) +
         newCodeTag +
         outputHtml.substring(regex.lastIndex)
      regex.lastIndex += newCodeTag.length - m[0].length

      // Replace escaped characters back to "<" and ">"
      outputHtml = outputHtml.replace(/</g, "<").replace(/&gt;/g, ">")
   }
   return outputHtml
}
