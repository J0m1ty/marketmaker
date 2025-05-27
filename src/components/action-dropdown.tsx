import { ChevronDown } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu"

export const ActionDropdown = () => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Actions
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
        </DropdownMenu>
    )
}