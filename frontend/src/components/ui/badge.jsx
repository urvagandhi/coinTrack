import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-200",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
                secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
                destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm",
                success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm",
                warning: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm",
                outline: "border-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
