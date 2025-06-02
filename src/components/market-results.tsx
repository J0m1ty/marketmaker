import { useMarketTabsStore } from '@/hooks/markets.store';
import { Skeleton } from './ui/skeleton';
import {
    Building2,
    DollarSign,
    Hash,
    PackagePlus,
    Sigma,
    UserPlus,
    Users,
} from 'lucide-react';

const elasticity = (value: number) => {
    if (value > 1) {
        return 'Elastic';
    } else if (value < 1) {
        return 'Inelastic';
    } else {
        return 'Unit Elastic';
    }
};

export const MarketResults = () => {
    const { getActiveTab } = useMarketTabsStore();

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const resultsData = activeTab.computed ? [
        {
            icon: <DollarSign />,
            title: 'Equilibruim Price',
            value: `$${activeTab.computed.equilibrium_price.toFixed(2)}`,
        },
        {
            icon: <Hash />,
            title: 'Equilibruim Quantity',
            value: activeTab.computed.equilibrium_quantity.toFixed(2),
        },
        {
            icon: <Users />,
            title: 'Arc PED',
            value: `${activeTab.computed.arc_price_elasticity_of_demand.toFixed(2)} (${elasticity(activeTab.computed.arc_price_elasticity_of_demand)})`,
        },
        {
            icon: <Building2 />,
            title: 'Arc PES',
            value: `${activeTab.computed.arc_price_elasticity_of_supply.toFixed(2)} (${elasticity(activeTab.computed.arc_price_elasticity_of_supply)})`,
        },
        {
            icon: <UserPlus />,
            title: 'Consumer Surplus',
            value: `$${activeTab.computed.consumer_surplus.toFixed(2)}`,
        },
        {
            icon: <PackagePlus />,
            title: 'Producer Surplus',
            value: `$${activeTab.computed.producer_surplus.toFixed(2)}`,
        },
        {
            icon: <Sigma />,
            title: 'Total Surplus',
            value: `$${activeTab.computed.total_surplus.toFixed(2)}`,
        },
    ] : [];

    return (
        <div className='w-full lg:w-full lg:h-full'>
            {activeTab.computed ? (
                <div className='w-full lg:h-full lg:overflow-y-auto'>
                    <div className='flex w-full p-2 gap-2 flex-row lg:flex-col'>
                        <div className='flex-1 lg:flex-none'>
                            <span className='text-lg font-semibold'>Analysis</span>
                            <div className='flex flex-col w-full space-y-2 lg:space-y-4 mt-2'>
                                {resultsData.map((item, index) => (
                                    <div
                                        key={index}
                                        className='h-12 w-full rounded-md flex flex-row items-center gap-3 px-3 border-1'
                                    >
                                        {item.icon}
                                        <div className='flex flex-col items-start'>
                                            <span className='text-xs'>
                                                {item.title}
                                            </span>
                                            <span className='text-sm'>
                                                {item.value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {activeTab.adjustment.mode !== 'none' && (
                            <div className='flex-1 lg:flex-none lg:pt-3'>
                                <span className='text-lg font-semibold'>Intervention</span>
                                {/* Intervention content will go here */}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className='flex flex-col w-full h-full p-2 space-y-4'>
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                </div>
            )}
        </div>
    );
};
