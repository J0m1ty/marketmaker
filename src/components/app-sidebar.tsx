import { useLocation, useNavigate } from 'react-router';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from './ui/sidebar';
import { BookOpenText, ChartSpline, CirclePlus, CopyX, ExternalLink, FilePlus2, FileUp, FolderOpen, SquareX } from 'lucide-react';
import { useDataStore } from '@/hooks/data.store';
import { useState } from 'react';
import { ClearDialog } from './clear-dialog';
import { uploadFile } from '@/lib/data-upload';
import { toast } from 'sonner';
import { hasUserData } from '@/lib/sheet';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { handleMarketFileUpload } from '@/lib/market-upload';
import { PresetSelector } from './preset-selector';

export const AppSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const { data, setFilename, setData, resetData } = useDataStore();
    const { tabs, activeTabId, closeTab, closeAllTabs, openTab } = useMarketTabsStore();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleUpload = async () => {
        try {
            const { filename, data } = await uploadFile();
            setData(data);
            setFilename(filename);

            toast.success(`File uploaded successfully!`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload file');
        }
    };

    const handleMarketUpload = async () => {
        await handleMarketFileUpload(openTab);
    };

    return (
        <>
            <Sidebar variant='inset' collapsible='icon'>
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size='lg'>
                                <img src='/favicon-32x32.png' alt='Logo' className='dark:invert-100' />
                                <span className='translate-y-[2px] font-bold'>Market Maker</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Pages</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => navigate('/')}
                                        isActive={location.pathname === '/'}
                                    >
                                        <ChartSpline />
                                        <span className='translate-y-[1px]'>Interact</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => navigate('/create')}
                                        isActive={location.pathname === '/create'}
                                    >
                                        <FilePlus2 />
                                        <span className='translate-y-[1px]'>Create</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => navigate('/learn')}
                                        isActive={location.pathname === '/learn'}
                                    >
                                        <BookOpenText />
                                        <span className='translate-y-[1px]'>Learn</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={() => window.open('https://jomity.net', '_blank')}>
                                        <ExternalLink />
                                        <span className='translate-y-[1px]'>More</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    {location.pathname === '/' && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Actions</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <PresetSelector onPresetLoad={openTab}>
                                        <SidebarMenuButton>
                                            <FolderOpen />
                                            <span className='translate-y-[1px]'>Open Preset</span>
                                        </SidebarMenuButton>
                                    </PresetSelector>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={handleMarketUpload}>
                                        <FileUp />
                                        <span className='translate-y-[1px]'>Upload</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        disabled={activeTabId === null}
                                        onClick={() => {
                                            if (activeTabId) {
                                                closeTab(activeTabId);
                                            }
                                        }}
                                    >
                                        <SquareX />
                                        <span className='translate-y-[1px]'>Close</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        disabled={tabs.length === 0}
                                        onClick={() => {
                                            if (tabs.length > 0) {
                                                closeAllTabs();
                                            }
                                        }}
                                    >
                                        <CopyX />
                                        <span className='translate-y-[1px]'>Close All</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                    {location.pathname === '/create' && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Actions</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton onClick={handleUpload}>
                                        <FileUp />
                                        <span className='translate-y-[1px]'>Upload</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => setShowConfirmDialog(true)}
                                        disabled={!hasUserData(data)}
                                    >
                                        <CirclePlus />
                                        <span className='translate-y-[1px]'>New</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size='sm'>
                                <span className='text-sm opacity-50'>
                                    {state === 'expanded' ? 'Jonathan Schultz @ RIT' : ''}
                                </span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <ClearDialog
                confirmSource='new'
                showConfirmDialog={showConfirmDialog}
                setShowConfirmDialog={setShowConfirmDialog}
                resetData={resetData}
            />
        </>
    );
};
