"use client"

import { EditorContent, type Editor as CoreEditor } from "@tiptap/react"
import { Toggle, toggleVariants } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { Hint } from "@/components/hint"
import {
   useState,
   useRef,
   type ComponentProps,
   type ClipboardEvent,
   type ChangeEvent,
} from "react"
import { FileButton } from "@/components/ui/file-button"
import {
   Bold,
   Code2,
   Heading1,
   Heading2,
   ImageIcon,
   Italic,
   List,
   ListOrdered,
   Redo,
   SquareCode,
   Strikethrough,
   Undo,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

type EditorProps = {
   className?: string
   editor: CoreEditor | null
   onImagePaste: (e: ClipboardEvent<HTMLDivElement>) => void
   onImageChange: (e: ChangeEvent<HTMLInputElement>) => void
   onSubmit: () => void
   isPending: boolean
} & Omit<ComponentProps<"form">, "onChange">

export const Editor = ({
   onSubmit,
   onImagePaste,
   onImageChange,
   editor,
   isPending,
   children,
   className,
   ...props
}: EditorProps) => {
   const [isAnyTooltipVisible, setIsAnyTooltipVisible] = useState(false)

   const formRef = useRef<HTMLFormElement>(null)

   if (!editor)
      return (
         <Skeleton className="min-h-[164px] rounded-2xl md:min-h-[194.5px]" />
      )

   function isMobile() {
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

   return (
      <form
         ref={formRef}
         className={cn(
            `flex min-h-[164px] flex-col rounded-2xl border border-border/60 bg-muted transition focus-within:border-border focus-within:outline-none
          hover:border-border md:min-h-[194.5px]`,
            className
         )}
         {...props}
         onKeyDown={async (e) => {
            const isEmpty =
               !editor.state.doc.textContent.trim().length &&
               !editor.getJSON().content?.some((i) => i.type === "image")

            if (isEmpty || isPending || isMobile()) return

            if (
               e.key === "Enter" &&
               !e.shiftKey &&
               !e.ctrlKey &&
               !isEmpty &&
               !editor.isActive("bulletList") &&
               !editor.isActive("orderedList") &&
               !editor.isActive("codeBlock") &&
               !isPending
            ) {
               editor.commands.deleteCurrentNode()
               formRef.current?.requestSubmit()
            }
         }}
         onSubmit={async (e) => {
            e.preventDefault()
            onSubmit()
         }}
      >
         <EditorContent
            onPaste={onImagePaste}
            editor={editor}
         />
         <div className="scroll-x mt-auto flex items-end overflow-x-auto p-3 pt-1">
            <Hint
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <Heading1 className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <Heading2 className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <Bold className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <Italic className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <Strikethrough className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <ListOrdered className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
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
                  <List className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
               content={"Image"}
            >
               <FileButton
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn("text-foreground")}
                  onChange={onImageChange}
                  accept="image/*"
               >
                  <ImageIcon className="size-[22px] opacity-60" />
               </FileButton>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
               content={"Code"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("code")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleCode().run()
                  }
               >
                  <Code2 className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
               content={"Code block"}
            >
               <Toggle
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  size={"sm"}
                  pressed={editor.isActive("codeBlock")}
                  onPressedChange={() =>
                     editor.chain().focus().toggleCodeBlock().run()
                  }
               >
                  <SquareCode className="size-[22px] opacity-60" />
               </Toggle>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
               content={"Undo"}
            >
               <button
                  type="button"
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn(
                     toggleVariants({ size: "sm" }),
                     "text-foreground"
                  )}
                  disabled={!editor.can().undo()}
                  onClick={() => editor.chain().focus().undo().run()}
               >
                  <Undo className="size-[22px] opacity-60" />
               </button>
            </Hint>
            <Hint
               onMouseOver={() => setIsAnyTooltipVisible(true)}
               onMouseLeave={() => setIsAnyTooltipVisible(false)}
               className="px-0.5"
               delayDuration={isAnyTooltipVisible ? 0 : 350}
               content={"Redo"}
            >
               <button
                  type="button"
                  onMouseOver={() => setIsAnyTooltipVisible(true)}
                  onMouseLeave={() => setIsAnyTooltipVisible(false)}
                  className={cn(
                     toggleVariants({ size: "sm" }),
                     "text-foreground"
                  )}
                  disabled={!editor.can().redo()}
                  onClick={() => editor.chain().focus().redo().run()}
               >
                  <Redo className="size-[22px] opacity-60" />
               </button>
            </Hint>
            {children}
         </div>
      </form>
   )
}
