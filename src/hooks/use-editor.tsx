import {
   useEditor as _useEditor,
   type Editor as CoreEditor,
   Extension,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { nanoid } from "nanoid"
import { cn, getFileNameFromStorageUrl } from "@/lib/utils"
import {
   type ChangeEvent,
   type ClipboardEvent,
   useState,
   useEffect,
   useRef,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import js from "highlight.js/lib/languages/javascript"
import jsx from "highlight.js/lib/languages/javascript"
import ts from "highlight.js/lib/languages/typescript"
import html from "highlight.js/lib/languages/xml"
import css from "highlight.js/lib/languages/css"
import { createLowlight } from "lowlight"

const lowlight = createLowlight()

lowlight.register("html", html)
lowlight.register("css", css)
lowlight.register("js", js)
lowlight.register("ts", ts)
lowlight.register("jsx", jsx)

type UseEditorArgs = {
   value: string
   isPending: boolean
   onChange: (html: string) => void
   shouldInitNewEditorOnReset?: boolean
}

const ShiftEnterCreateExtension = Extension.create({
   addKeyboardShortcuts() {
      return {
         "Shift-Enter": ({ editor }) => {
            editor.commands.enter()
            return true
         },
      }
   },
})

export function useEditor({
   value,
   isPending,
   shouldInitNewEditorOnReset = true,
   onChange,
}: UseEditorArgs) {
   const [isMounted, setIsMounted] = useState(false)
   const [imagesToDeleteFromBucket, setImagesToDeleteFromBucket] = useState<
      string[]
   >([])
   const editor = _useEditor({
      extensions: [
         StarterKit.configure({
            codeBlock: false,
            code: {
               HTMLAttributes: {
                  class: "font-code font-normal !text-[#ff837f] bg-[#ff837f]/25 py-1 px-2 rounded-sm before:hidden after:hidden",
               },
            },
         }),
         Link,
         ShiftEnterCreateExtension,
         CodeBlockLowlight.configure({
            lowlight,
         }),
         Image.configure({
            HTMLAttributes: {
               class: "rounded-md my-5",
            },
         }),
         Placeholder.configure({
            placeholder: "Anything on your mind...",
            showOnlyWhenEditable: false,
         }),
      ],
      content: value,
      editorProps: {
         attributes: {
            id: nanoid(),
            class: cn(
               "w-full p-4 min-h-[80px] md:min-h-[100px] focus:outline-none prose prose-invert"
            ),
         },
      },
      onUpdate({ editor: _editor }) {
         const editor = _editor as CoreEditor

         onChange(editor.getHTML() === "<p></p>" ? "" : editor.getHTML())
         onImageNodesAddDelete({ editor })
      },
   })

   const previousImages = useRef<HTMLImageElement[]>([])

   useEffect(() => {
      if (!editor) return

      if (isPending) {
         editor.setOptions({ editable: false })
      } else {
         editor.setOptions({ editable: true })
      }
   }, [isPending, editor])

   useEffect(() => {
      if (!isMounted && editor) {
         onImageNodesAddDelete({ editor })
         setIsMounted(true)
         editor.commands.focus("end")
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [editor, isMounted])

   function onImageNodesAddDelete({ editor }: { editor: CoreEditor }) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(editor.getHTML(), "text/html")

      // Get all img elements in the document
      const images = [...doc.querySelectorAll("img")]

      // Compare previous/current nodes to detect deleted ones
      const prevNodesById: Record<string, HTMLImageElement> = {}
      previousImages.current.forEach((node: HTMLImageElement) => {
         if (node.src) {
            prevNodesById[node.src] = node
         }
      })

      const nodesById: Record<string, HTMLImageElement> = {}
      images.forEach((node) => {
         if (node.src) {
            nodesById[node.src] = node
         }
      })

      previousImages.current = images

      for (const [id, node] of Object.entries(prevNodesById)) {
         const imageUrl = node.src
         if (!imageUrl) return

         const fileName = getFileNameFromStorageUrl(imageUrl)
         if (!fileName) return

         if (nodesById[id] === undefined) {
            setImagesToDeleteFromBucket?.((prev) =>
               prev.includes(fileName) ? prev : [...prev, fileName]
            )
         } else {
            setImagesToDeleteFromBucket?.((prev) =>
               prev.filter((prevFileName) => prevFileName !== fileName)
            )
         }
      }
   }

   async function onImageChange(e: ChangeEvent<HTMLInputElement>) {
      if (e.target.files?.[0]) {
         uploadImage(e.target.files[0])
      }
   }

   async function onImagePaste(e: ClipboardEvent<HTMLDivElement>) {
      if (e.clipboardData.files?.[0]) {
         uploadImage(e.clipboardData.files[0])
      }
   }

   const supabase = createClient()

   function uploadImage(file: File) {
      const upload = async () => {
         try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const editorId = (editor?.options.editorProps.attributes as any).id

            const { data, error } = await supabase.storage
               .from("files")
               .upload(`${editorId}-${file.name}`, file, { upsert: true })

            if (error) {
               throw new Error("Error")
            }
            return data
         } catch (error) {
            throw error
         }
      }
      editor?.setOptions({ editable: false })

      toast.promise(upload(), {
         loading: "Uploading your image...",
         success: (uploadedImage) => {
            const src = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${uploadedImage.path}`

            if (uploadedImage.path) {
               editor?.chain().focus().setImage({ src }).run()
               editor?.setOptions({ editable: true })
               editor?.chain().focus("end").run()
               editor?.commands.createParagraphNear()
               return "Image is uploaded"
            }
         },
         error: () => {
            editor?.setOptions({ editable: true })
            editor?.chain().focus("end").run()

            return "Failed to upload image, something went wrong"
         },
      })
   }

   async function removeImages() {
      if (imagesToDeleteFromBucket.length < 1) return

      await supabase.storage.from("files").remove(imagesToDeleteFromBucket)
   }

   async function resetEditor() {
      await removeImages()
      setImagesToDeleteFromBucket([])
      previousImages.current = []

      if (shouldInitNewEditorOnReset) {
         editor?.setOptions({
            editorProps: {
               attributes: {
                  ...editor.options.editorProps.attributes,
                  id: nanoid(),
               },
            },
         })
      }
   }

   return {
      onImageChange,
      onImagePaste,
      removeImages,
      editor,
      resetEditor,
   }
}
