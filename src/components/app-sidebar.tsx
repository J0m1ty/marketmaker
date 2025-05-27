import { useLocation, useNavigate } from "react-router"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar"
import { BookOpenText, ChartSpline, ExternalLink } from "lucide-react";

export const AppSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = useSidebar();

    return (
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg">
                            <img src="/favicon-32x32.png" alt="Logo" className="dark:invert-100" />
                            <span className="translate-y-[2px] font-bold">Market Maker</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Pages
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => navigate("/")} isActive={location.pathname === "/"}>
                                    <ChartSpline />
                                    <span className="translate-y-[1px]">Simulate</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => navigate("/learn")} isActive={location.pathname === "/learn"}>
                                    <BookOpenText />
                                    <span className="translate-y-[1px]">Learn</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => window.open("https://jomity.net", "_blank")}>
                                    <ExternalLink />
                                    <span className="translate-y-[1px]">More</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="sm">
                            <span className="text-sm opacity-50">{ state === "expanded" ? "Made by Jonathan Schultz" : ""}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}