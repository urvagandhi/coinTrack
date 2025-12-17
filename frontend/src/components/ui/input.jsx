import { cn } from "@/lib/utils"
import * as React from "react"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-base ring-offset-background transition-all duration-200",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "placeholder:text-gray-400",
                "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
