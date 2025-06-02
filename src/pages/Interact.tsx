import { Dropzone } from '@/components/dropzone';
import { Simulation } from '@/components/simulation';
import { MarketOptions } from '@/components/market-options';
import { MarketResults } from '@/components/market-results';
import { TabGroup } from '@/components/tab-group';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { handleDropzoneUpload } from '@/lib/market-upload';

export const Interact = () => {
    const { tabs, openTab } = useMarketTabsStore();

    const handleDrop = async (file: File) => {
        await handleDropzoneUpload(file, openTab);
    };

    return (
        <div className='flex flex-col w-full h-full pt-2 overflow-hidden'>
            {tabs.length > 0 ? (
                <>
                    <TabGroup />
                    <div className='flex-1 min-h-0 overflow-auto lg:overflow-hidden lg:flex lg:flex-col'>
                        <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0">
                            <div className="w-full lg:flex-1 lg:min-w-0">
                                <Simulation />
                            </div>

                            <div className='flex-shrink-0 lg:min-w-60'>
                                <MarketResults />
                            </div>
                        </div>

                        <div className='flex-shrink-0'>
                            <MarketOptions />
                        </div>
                    </div>
                </>
            ) : (
                <Dropzone className='m-5' onDrop={handleDrop} />
            )}
        </div>
    );
};
