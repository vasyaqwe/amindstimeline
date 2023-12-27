import * as React from "react"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { cva } from "class-variance-authority"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
   invalid?: string | undefined
}

export const inputVariants = cva(
   `flex h-[39px] w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-ring ring-offset-2 ring-offset-background  file:border-0 
               file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                 data-[invalid=true]:ring-2 data-[invalid=true]:ring-destructive`
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
   ({ className, type, invalid, ...props }, ref) => {
      return (
         <input
            data-invalid={Boolean(invalid)}
            type={type}
            className={cn(inputVariants(), className)}
            ref={ref}
            {...props}
         />
      )
   }
)
Input.displayName = "Input"

type ErrorMessageProps = {
   error:
      | {
           message: string
           dynamicParams: Record<string, string | number>
        }
      | undefined
} & React.ComponentProps<"p">

function ErrorMessage({ error, className, ...props }: ErrorMessageProps) {
   const t = useTranslations("common")

   type TranslationKeys = Parameters<typeof t>[0]

   return error?.message ? (
      <p
         className={cn("mt-2 text-sm text-destructive", className)}
         {...props}
      >
         {t(error.message as TranslationKeys, error.dynamicParams)}
      </p>
   ) : null
}

export { Input, ErrorMessage }
