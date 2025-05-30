import { useLocation, useNavigate } from "react-router"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar"
import { BookOpenText, ChartSpline, CirclePlus, CopyX, ExternalLink, FilePlus2, FileUp, SquareX } from "lucide-react";
import { hasUserData, useCreateStore } from "@/model/market.data";
import { useState } from "react";
import { ClearDialog } from "./clear-dialog";

export const AppSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const { data, resetData } = useCreateStore();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    return (
        <>
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
                                        <span className="translate-y-[1px]">Interact</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={() => navigate("/create")} isActive={location.pathname === "/create"}>
                                        <FilePlus2 />
                                        <span className="translate-y-[1px]">Create</span>
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
                    {location.pathname === "/" && (
                        <SidebarGroup>
                            <SidebarGroupLabel>
                                Actions
                            </SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton>
                                        <FileUp />
                                        <span className="translate-y-[1px]">Upload</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <SquareX />
                                        <span className="translate-y-[1px]">Close</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton disabled>
                                        <CopyX />
                                        <span className="translate-y-[1px]">Close All</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                    {location.pathname === "/create" && (
                        <SidebarGroup>
                            <SidebarGroupLabel>
                                Actions
                            </SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton>
                                        <FileUp />
                                        <span className="translate-y-[1px]">Upload & Edit</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={() => setShowConfirmDialog(true)} disabled={!hasUserData(data)}>
                                        <CirclePlus />
                                        <span className="translate-y-[1px]">New</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="sm">
                                <span className="text-sm opacity-50">{state === "expanded" ? "Jonathan Schultz @ RIT" : ""}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <ClearDialog
                showConfirmDialog={showConfirmDialog}
                setShowConfirmDialog={setShowConfirmDialog}
                resetData={resetData}
            />
        </>
    )
}