import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export function extractFileNameFromStorageUrl(url: string) {
   const path = url?.split("/public/files/")?.[1]

   return path
}
