import { Dropzone } from '@/components/dropzone';
import { MarketOptions } from '@/components/market-options';
import { MarketResults } from '@/components/market-results';
import { TabGroup } from '@/components/tab-group';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { handleDropzoneUpload } from '@/lib/market-upload';
import { lazy, Suspense } from 'react';

const Simulation = lazy(() => import('@/components/simulation').then(module => ({ default: module.Simulation })));

export const Interact = () => {
    const { tabs, openTab } = useMarketTabsStore();

    const handleDrop = async (file: File) => {
        await handleDropzoneUpload(file, openTab);
    };

    return (
        <div className='flex flex-col w-full h-full pt-2 overflow-hidden'>
            {tabs.length > 0 ?
                <>
                    <TabGroup />
                    <div className='flex-1 min-h-0 overflow-auto lg:overflow-hidden lg:flex lg:flex-col'>
                        <div className='flex flex-col lg:flex-row lg:flex-1 lg:min-h-0'>
                            <div className='w-full lg:flex-1 lg:min-w-0'>
                                <Suspense fallback={
                                    <div className='w-full aspect-square min-w-0 relative lg:aspect-auto lg:h-full flex items-center justify-center'>
                                        <div className='text-center'>
                                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 text-black dark:text-white mx-auto mb-2'></div>
                                            <p className='text-sm text-muted-foreground'>Loading simulation...</p>
                                        </div>
                                    </div>
                                }>
                                    <Simulation />
                                </Suspense>
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
            :   <Dropzone className='m-5' onDrop={handleDrop} />}
        </div>
    );
};
