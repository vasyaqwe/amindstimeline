"use client"

import {
   useEditor,
   EditorContent,
   type Editor as CoreEditor,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Toggle, toggleVariants } from "@/components/ui/toggle"

import { cn } from "@/lib/utils"
import { Hint } from "@/components/hint"
import {
   type ChangeEvent,
   // type ClipboardEvent,
   useState,
   useEffect,
   useRef,
   type Dispatch,
   type SetStateAction,
   type ComponentProps,
} from "react"
import { FileButton } from "@/components/ui/file-button"
// import { useUploadThing } from "@/lib/uploadthing"
// import { toast } from "sonner"
import {
   Bold,
   Heading1,
   Heading2,
   ImageIcon,
   Italic,
   List,
   ListOrdered,
   Redo,
   Strikethrough,
   Undo,
} from "lucide-react"

type EditorProps<T extends boolean> = {
   value: string
   onChange: (value: string) => void
   className?: string
} & (T extends true
   ? {
        shouldSetImages: true
        setImages: Dispatch<SetStateAction<string[]>>
        setImagesToDeleteFromServer: Dispatch<SetStateAction<string[]>>
     }
   : {
        shouldSetImages?: false
        setImages?: Dispatch<SetStateAction<string[]>>
        setImagesToDeleteFromServer?: Dispatch<SetStateAction<string[]>>
     }) &
   Omit<ComponentProps<"div">, "onChange">

type Node = {
   attrs: Record<string, string>
   type: {
      name: string
   }
}

export const Editor = <T extends boolean>({
   value,
   onChange,
   className,
   shouldSetImages = false,
   setImages,
   onKeyDown,
   setImagesToDeleteFromServer,
   ...props
}: EditorProps<T>) => {
   const [isAnyTooltipVisible, setIsAnyTooltipVisible] = useState(false)
   const [isMounted, setIsMounted] = useState(false)

   const editor = useEditor({
      extensions: [
         StarterKit,
         Link,
         Image.configure({
            HTMLAttributes: {
               class: "rounded-md mb-5",
            },
         }),
         Placeholder.configure({
            placeholder: "Anything on your mind...",
         }),
      ],
      content: value,
      editorProps: {
         attributes: {
            id: "editor",
            class: cn(
               "w-full py-3 px-4 min-h-[120px] focus:outline-none prose prose-invert",
               className
            ),
         },
      },
      onUpdate({ editor: _editor }) {
         const editor = _editor as CoreEditor
         onChange(editor.getHTML() === "<p></p>" ? "" : editor.getHTML())
         onImageNodesAddDelete({ editor })
      },
   })
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const previousState = useRef<any>()

   useEffect(() => {
      if (!isMounted && editor && shouldSetImages) {
         onImageNodesAddDelete({ editor })
         setIsMounted(true)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [editor, isMounted])

   const onImageNodesAddDelete = ({ editor }: { editor: CoreEditor }) => {
      if (!shouldSetImages) return

      // Compare previous/current nodes to detect deleted ones
      const prevNodesById: Record<string, Node> = {}
      previousState.current?.doc.forEach((node: Node) => {
         if (node.attrs.src) {
            prevNodesById[node.attrs.src] = node
         }
      })

      const nodesById: Record<string, Node> = {}
      editor.state.doc.forEach((node) => {
         if (node.attrs.src) {
            nodesById[node.attrs.src] = node
         }
      })

      previousState.current = editor.state

      for (const [id, node] of Object.entries(prevNodesById)) {
         const imageSrc = node.attrs.src ?? ""
         //return if no src
         if (imageSrc?.length < 1) return

         if (nodesById[id] === undefined && node.type.name === "image") {
            setImages?.((prev) => prev.filter((src) => src !== imageSrc))
            setImagesToDeleteFromServer?.((prev) =>
               prev.includes(imageSrc) ? prev : [...prev, imageSrc]
            )
         } else {
            setImagesToDeleteFromServer?.((prev) =>
               prev.filter((src) => src !== imageSrc)
            )
            setImages?.((prev) =>
               prev.includes(imageSrc) ? prev : [...prev, imageSrc]
            )
         }
      }
   }

   if (!editor) return null

   async function onImageChange(e: ChangeEvent<HTMLInputElement>) {
      if (e.target.files?.[0]) {
         // uploadImage(e.target.files[0])
      }
   }

   async function onImagePaste() {
      //   e: ClipboardEvent<HTMLDivElement>
      // if (isUploading) return
      // if (e.clipboardData.files?.[0]) {
      //    uploadImage(e.clipboardData.files[0])
      // }
   }

   // function uploadImage(file:File) {
   //    const upload = async (files: File[]) => {
   //       try {
   //          const response = await startUpload(files)
   //          if (!response) {
   //             throw new Error("Error")
   //          }
   //          return response
   //       } catch (error) {
   //          throw error
   //       }
   //    }
   //    editor?.setOptions({ editable: false })
   //    toast.promise(upload([file]), {
   //       loading: t("uploading"),
   //       success: (uploadedImage) => {
   //          if (uploadedImage?.[0]?.url) {
   //             setImages?.((prev) => [...prev, uploadedImage[0]!.url])
   //             editor
   //                ?.chain()
   //                .focus()
   //                .setImage({ src: uploadedImage[0].url })
   //                .run()
   //          }
   //          editor?.setOptions({ editable: true })
   //          return t("uploaded")
   //       },
   //       error: t("upload-error"),
   //    })
   // }

   return (
      <div
         className="rounded-2xl border border-border/60 bg-muted transition focus-within:border-border
          focus-within:outline-none hover:border-border"
         {...props}
         onKeyDown={(e) => {
            if (
               e.key === "Enter" &&
               !e.shiftKey &&
               !e.ctrlKey &&
               editor.getText().length > 0 &&
               !editor.isActive("bulletList") &&
               !editor.isActive("orderedList")
            ) {
               onKeyDown?.(e)
               editor?.commands.clearContent()
            }
         }}
      >
         <div className="scroll-x flex overflow-x-auto border-b-2 border-dotted border-input p-2">
            <Hint
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="pr-0.5"
               content={"Heading (level 1)"}
            >
               <Toggle
                  size={"sm"}
                  content={"Heading (level 1)"}
                  pressed={editor.isActive("heading", { level: 1 })}
                  onPressedChange={() =>
                     editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
               >
                  <Heading1 />
               </Toggle>
            </Hint>
            <Hint
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               content={"Heading (level 2)"}
               className="px-0.5"
            >
               <Toggle
                  size={"sm"}
                  pressed={editor.isActive("heading", { level: 2 })}
                  onPressedChange={() =>
                     editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
               >
                  <Heading2 />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Bold"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("bold")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleBold().run()
                  }
               >
                  <Bold />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Italic"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("italic")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleItalic().run()
                  }
               >
                  <Italic />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Strikethrough"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("strike")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleStrike().run()
                  }
               >
                  <Strikethrough />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Ordered list"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("orderedList")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleOrderedList().run()
                  }
               >
                  <ListOrdered />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Unordered list"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("bulletList")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleBulletList().run()
                  }
               >
                  <List />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Image"}
            >
               <FileButton
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn("text-foreground")}
                  // disabled={isUploading}
                  onChange={onImageChange}
                  accept="image/*"
               >
                  <ImageIcon />
               </FileButton>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Undo"}
            >
               <button
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn(
                     toggleVariants({ size: "sm" }),
                     "text-foreground"
                  )}
                  onClick={() => editor.chain().focus().undo().run()}
               >
                  <Undo />
               </button>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 300}
               content={"Redo"}
            >
               <button
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn(
                     toggleVariants({ size: "sm" }),
                     "text-foreground"
                  )}
                  onClick={() => editor.chain().focus().redo().run()}
               >
                  <Redo />
               </button>
            </Hint>
         </div>
         <EditorContent
            onPaste={onImagePaste}
            editor={editor}
         />
      </div>
   )
}

// eslint-disable-next-line react/display-name
export const EditorOutput = ({
   html,
   className,
   ...props
}: ComponentProps<"div"> & { html: string }) => {
   return (
      <div
         className={cn("p-5", className)}
         dangerouslySetInnerHTML={{
            __html: html,
         }}
         {...props}
      />
   )
}
