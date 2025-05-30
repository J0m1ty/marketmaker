import { ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export const TableButton = forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    ({ className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                variant="ghost"
                size="icon"
                className={cn(
                    "size-5 rounded-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
                    className
                )}
                {...props}
            >
                <ChevronDown />
            </Button>
        )
    }
)

TableButton.displayName = "TableButton"