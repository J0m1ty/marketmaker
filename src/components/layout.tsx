import { AppSidebar } from './app-sidebar';
import { Header } from './header';
import { SidebarInset, SidebarProvider } from './ui/sidebar';
import { Toaster } from './ui/sonner';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className='h-[calc(100svh-1rem)] overflow-x-hidden'>
                <Header />
                {children}
                <Toaster />
            </SidebarInset>
        </SidebarProvider>
    );
};
