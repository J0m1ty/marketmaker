import { Dropzone } from '@/components/dropzone';
import { Simulation } from '@/components/simulation';
import { MarketOptions } from '@/components/market-options';
import { MarketResults } from '@/components/market-results';
import { TabGroup } from '@/components/tab-group';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { handleDropzoneUpload } from '@/lib/market-upload';
import { ScrollArea } from '@radix-ui/react-scroll-area';

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
                    <ScrollArea>
                        <div className='flex flex-col lg:flex-row'>
                            <Simulation />
                            <MarketResults />
                        </div>
                        <MarketOptions />
                    </ScrollArea>
                </>
            ) : (
                <Dropzone className='m-5' onDrop={handleDrop} />
            )}
        </div>
    );
};
