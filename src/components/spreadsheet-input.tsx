import * as React from "react"
import { cn } from "@/lib/utils"

function SpreadsheetInput({
    className,
    ...props
}: React.ComponentProps<"input">) {
    return (
        <input
            type="text"
            className={cn(
                "h-full w-full outline-none bg-transparent px-2 py-0.5 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "border-none focus:border-none",
                className
            )}
            {...props}
        />
    )
}

export { SpreadsheetInput }