import { Dropzone } from '@/components/dropzone';
import { Simulation } from '@/components/simulation';
import { MarketOptions } from '@/components/market-options';
import { MarketTable } from '@/components/market-table';
import { TabGroup } from '@/components/tab-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { handleDropzoneUpload } from '@/lib/market-upload';

export const Interact = () => {
    const { tabs, openTab } = useMarketTabsStore();

    const handleDrop = async (file: File) => {
        await handleDropzoneUpload(file, openTab);
    };

    return (
        <div className='flex flex-col w-full h-full pt-2 overflow-x-clip'>
            {tabs.length > 0 ? (
                <>
                    <TabGroup />
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel className="flex flex-row">
                            <Simulation />
                            <MarketTable />
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel maxSize={20} minSize={15} collapsible={true}>
                            <MarketOptions />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </>
            ) : (
                <Dropzone className='m-5' onDrop={handleDrop} />
            )}
        </div>
    );
};
