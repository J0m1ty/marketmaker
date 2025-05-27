import { ExternalLink, Menu } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useLocation, useNavigate } from "react-router"

type MenuItem = {
    label: string,
    to: string
}

type NavDropdownProps = {
    menuItems: MenuItem[]
}

export const NavDropdown = ({ menuItems }: NavDropdownProps) => {
    let location = useLocation();
    let navigate = useNavigate();

    const handleClick = (to: string) => (e: React.MouseEvent) => {
        if (to.startsWith("http")) return;
        e.preventDefault();
        navigate(to);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {menuItems.map(item => (
                    <DropdownMenuItem
                        key={item.to}
                        className={`cursor-pointer ${location.pathname === item.to ? 'opacity-100' : 'opacity-80'}`}
                        asChild
                    >
                        {item.to.startsWith("http") ? (
                            <a
                                href={item.to}
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={-1}
                                className="flex items-center gap-2 w-full translate-y-[1px]"
                            >
                                <ExternalLink className="h-[1rem] w-[1rem]" />
                                {item.label}
                            </a>
                        ) : (
                            <button
                                onClick={handleClick(item.to)}
                                tabIndex={-1}
                                className="flex items-center gap-2 w-full bg-transparent border-none outline-none p-0"
                                type="button"
                            >
                                {item.label}
                            </button>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}