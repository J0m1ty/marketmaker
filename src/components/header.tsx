import { useLocation, useNavigate } from "react-router";
import { ModeToggle } from "./mode-toggle";
import { NavDropdown } from "./nav-dropdown";
import { ActionDropdown } from "./action-dropdown";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";

export const Header = () => {
    let location = useLocation();
    let navigate = useNavigate();

    const menuItems = [
        { label: "Simulate", to: "/" },
        { label: "Learn", to: "/about" },
        { label: "More", to: "https://jomity.net" },
    ];

    const handleNav = (to: string) => (e: React.MouseEvent) => {
        if (to.startsWith("http")) return;
        e.preventDefault();
        navigate(to);
    };

    return (
        <div className="px-1 w-full border-b-1 border-dashed flex flex-row justify-between relative">
            <div className="flex flex-row items-center gap-4 p-3">
                <SidebarTrigger />
                <div className="flex flex-row items-center gap-2">
                    <div className="translate-y-[1px] font-bold text-base hidden lg:block">
                        Market Maker
                    </div>
                </div>
                {menuItems.map(item =>
                    item.to.startsWith("http") ? (
                        <a
                            key={item.to}
                            className="translate-y-[1px] opacity-80 cursor-pointer text-[15px] hidden md:block"
                            href={item.to}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {item.label}
                        </a>
                    ) : (
                        <button
                            key={item.to}
                            className={`translate-y-[1px] opacity-${location.pathname === item.to ? "100" : "80"} cursor-pointer text-[15px] hidden md:block bg-transparent border-none outline-none p-0`}
                            onClick={handleNav(item.to)}
                            type="button"
                        >
                            {item.label}
                        </button>
                    )
                )}
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <ActionDropdown />
            </div>
            <div className="flex flex-row p-2 items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => window.open("https://jomity.net", "_blank")}>
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </Button>
                <ModeToggle />
            </div>
        </div>
    )
}