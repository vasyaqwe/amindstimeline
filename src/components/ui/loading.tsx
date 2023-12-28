import { cn } from "@/lib/utils"

type LoadingProps = React.ComponentProps<"div">

export function Loading({ className, ...props }: LoadingProps) {
   // stole a spinner from sonner lol
   return (
      <div
         data-visible={true}
         className={cn("sonner-loading-wrapper !relative", className)}
         {...props}
      >
         <div className="sonner-spinner [--size:1.3rem]">
            {Array(12)
               .fill(0)
               .map((_, idx) => (
                  <div
                     // style={{
                     //    animationDelay: `${-1.2 - idx}s`,
                     //    transform: `rotate(${idx * 30}) translate(146%)`,
                     // }}
                     // className={
                     //    " absolute left-[-10%] top-[-3.9%] h-[8%] w-[24%] rounded-sm bg-muted"
                     // }
                     style={{ background: "unset" }}
                     className="sonner-loading-bar !bg-foreground"
                     key={idx}
                  />
               ))}
         </div>
      </div>
   )
}
