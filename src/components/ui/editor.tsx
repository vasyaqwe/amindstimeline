"use client"

import { EditorContent, type Editor as CoreEditor } from "@tiptap/react"
import { Toggle, toggleVariants } from "@/components/ui/toggle"
import { cn, isMobile } from "@/lib/utils"
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
   AArrowDown,
   Bold,
   Code2,
   Command,
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
import { flushSync } from "react-dom"
import { Button } from "@/components/ui/button"
import { useEventListener } from "@/hooks/use-event-listener"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"

type EditorProps = {
   className?: string
   editor: CoreEditor | null
   onImagePaste: (e: ClipboardEvent<HTMLDivElement>) => void
   onImageChange: (e: ChangeEvent<HTMLInputElement>) => void
   onSubmit: () => void
   isPending: boolean
   toolbarStyle?: "floating" | "default"
} & Omit<ComponentProps<"form">, "onChange">

export const Editor = ({
   onSubmit,
   onImagePaste,
   onImageChange,
   editor,
   isPending,
   children,
   className,
   toolbarStyle = "default",
   ...props
}: EditorProps) => {
   const [isToolbarVisible, setIsToolbarVisible] = useState(false)
   const [isAnyTooltipVisible, setIsAnyTooltipVisible] = useState(false)
   const [isToolbarShortcutPressed, setIsToolbarShortcutPressed] =
      useState(false)

   const formRef = useRef<HTMLFormElement>(null)
   const toolbarRef = useRef<HTMLDivElement>(null)

   useEventListener("keydown", (e) => {
      if (e.key === "Escape") setIsToolbarVisible(false)

      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
         e.preventDefault()

         let timeout: NodeJS.Timeout | null = null

         if (timeout) {
            clearTimeout(timeout)
         }

         setIsToolbarShortcutPressed(true)
         timeout = setTimeout(() => {
            setIsToolbarShortcutPressed(false)
         }, 250)

         setIsToolbarVisible(!isToolbarVisible)

         if (!isToolbarVisible) editor?.commands.focus()
      }
   })

   useOnClickOutside(toolbarRef, (e) => {
      if ((e.target as HTMLElement)?.id !== "toolbar-trigger")
         setIsToolbarVisible(false)
   })

   if (!editor)
      return <Skeleton className="min-h-[var(--editor-height)] rounded-2xl" />

   return (
      <form
         ref={formRef}
         className={cn(
            `group grid min-h-[var(--editor-height)] grid-cols-1 grid-rows-[1fr,min-content]
             rounded-2xl border border-border/60 bg-muted focus-within:border-border
             focus-within:outline-none hover:border-border data-[hovered=true]:border-border`,
            toolbarStyle !== "floating" ? "relative" : "overflow-hidden",
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
               flushSync(() => editor.commands.deleteCurrentNode())
               formRef.current?.requestSubmit()
               setIsToolbarVisible(false)
            }
         }}
         onSubmit={async (e) => {
            e.preventDefault()
            onSubmit()
         }}
      >
         <EditorContent
            spellCheck={false}
            onPaste={onImagePaste}
            editor={editor}
         />
         <div
            className={cn(
               "mt-auto flex items-end",
               toolbarStyle !== "floating" ? "p-3" : ""
            )}
         >
            {toolbarStyle !== "floating" && (
               <Hint
                  aria-label="Create note"
                  content={
                     <div className="flex items-center">
                        Formatting <Command className="ml-2 mr-1 size-4" />{" "}
                        <span className="mt-[1px] text-base">F</span>
                     </div>
                  }
                  className="mr-auto flex"
               >
                  <Button
                     id="toolbar-trigger"
                     onClick={() => {
                        if (!isToolbarVisible) {
                           setIsToolbarVisible(true)
                           editor.commands.focus()
                        } else {
                           setIsToolbarVisible(false)
                        }
                     }}
                     type="button"
                     variant={"ghost"}
                     className={cn(
                        isToolbarShortcutPressed ? "bg-border/50" : ""
                     )}
                     size={"icon"}
                  >
                     <AArrowDown
                        strokeWidth={1.75}
                        className="pointer-events-none size-7 opacity-70"
                     />
                  </Button>
               </Hint>
            )}
            <div
               ref={toolbarRef}
               data-visible={isToolbarVisible}
               className={cn(
                  "absolute -bottom-[68px] left-0 z-50 max-w-full rounded-2xl border border-border bg-muted p-2",
                  toolbarStyle !== "floating"
                     ? "pointer-events-none -translate-y-1 opacity-0 shadow-2xl transition data-[visible=true]:pointer-events-auto data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 "
                     : ""
               )}
            >
               <div className={cn("scroll-x flex overflow-x-auto")}>
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
                           editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 1 })
                              .run()
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
                           editor
                              .chain()
                              .focus()
                              .toggleHeading({ level: 2 })
                              .run()
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
               </div>
            </div>

            {children}
         </div>
      </form>
   )
}
