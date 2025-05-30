import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { SidebarInset, SidebarProvider } from "./ui/sidebar"

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-[calc(100svh-1rem)]">
                <Header />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}