import { useMarketTabsStore } from '@/hooks/markets.store';
import { Skeleton } from './ui/skeleton';
import {
    BanknoteArrowDown,
    BanknoteArrowUp,
    Building2,
    DollarSign,
    Factory,
    Frown,
    Hash,
    HeartHandshake,
    HelpCircle,
    Landmark,
    MoveRight,
    OctagonAlert,
    Sigma,
    Skull,
    Smile,
    Spline,
    Store,
    TrendingDown,
    TrendingUp,
    Users,
    Weight,
} from 'lucide-react';
import { groupedAdjustments } from '@/lib/types';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';

const BasicAnalysisHelp = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-2 opacity-85 hover:opacity-100">
                    <HelpCircle className="h-3 w-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Basic Analysis</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-sm space-y-3">
                    <div>
                        <strong>Market Price:</strong> The equilibrium price where supply equals demand. This is where buyers and sellers agree to trade.
                    </div>
                    <div>
                        <strong>Quantity Traded:</strong> The equilibrium quantity of goods bought and sold at the market price.
                    </div>
                    <div>
                        <strong>Consumer Benefit (Consumer Surplus):</strong> The difference between what consumers are willing to pay and what they actually pay. It represents the net benefit consumers receive from participating in the market.
                    </div>
                    <div>
                        <strong>Producer Benefit (Producer Surplus):</strong> The difference between what producers receive and the minimum they're willing to accept. It represents the net benefit producers receive from participating in the market.
                    </div>
                    <div>
                        <strong>Total Benefit (Total Surplus):</strong> The sum of consumer and producer surplus. It represents the total economic welfare created by the market.
                    </div>
                    <div>
                        <strong>Arc PED (Arc Price Elasticity of Demand):</strong> Measures how responsive quantity demanded is to price changes over a range of prices (calculated using +/- 10% of the equilibrium price). Values between 0 and -1 indicate inelastic demand, while values less than -1 indicate elastic demand.
                    </div>
                    <div>
                        <strong>Arc PES (Arc Price Elasticity of Supply):</strong> Measures how responsive quantity supplied is to price changes over a range of prices (calculated using +/- 10% of the equilibrium price). Higher positive values indicate more elastic (responsive) supply.
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
};

interface MarketResultProps {
    icon: ReactNode;
    title: string;
    value: number;
    extra?: string;
    currency?: boolean;
    units?: boolean;
    override?: number;
    effect?: 'good' | 'bad' | 'neutral';
}

const MarketResult = ({
    icon,
    title,
    value,
    extra = '',
    currency = false,
    units = false,
    override = value,
}: MarketResultProps) => {
    if (value === undefined || value === null) {
        return (
            <div className='h-12 w-full rounded-md flex flex-row items-center justify-between px-3 border-1'>
                <div className='flex flex-row items-center gap-3'>
                    {icon}
                    <div className='flex flex-col items-start'>
                        <span className='text-xs text-muted-foreground'>{title}</span>
                        <span className='text-sm'>N/A</span>
                    </div>
                </div>
            </div>
        );
    }
    const diff = override - value;

    const formatNumber = (num: number) => {
        const decimals = num < 100 ? 1 : 0;
        return num.toFixed(decimals);
    };

    const valueFormatted = `${currency ? `$${formatNumber(value)}` : Number(formatNumber(value))}${units ? ' units' : ''}`;

    const overrideFormatted =
        override !== undefined && override !== value ?
            `${currency ? `$${formatNumber(override)}` : Number(formatNumber(override))}${units ? ' units' : ''}`
        :   undefined;

    return (
        <div className='h-12 w-full rounded-md flex flex-row items-center justify-between px-3 border-1'>
            <div className='flex flex-row items-center gap-3'>
                {icon}
                <div className='flex flex-col items-start'>
                    <span className='text-xs text-muted-foreground'>{title}</span>
                    <div className='flex flex-row gap-2 items-center'>
                        <span className='text-sm'>
                            {valueFormatted} {extra}
                        </span>
                        {overrideFormatted && (
                            <MoveRight
                                size={14}
                                className='text-neutral-700 dark:text-neutral-300 -translate-y-[1px]'
                            />
                        )}
                        <span className='text-sm'>{overrideFormatted}</span>
                    </div>
                </div>
            </div>
            {diff > 0 ?
                <TrendingUp />
            : diff < 0 ?
                <TrendingDown />
            :   null}
        </div>
    );
};

export const MarketResults = () => {
    const { getActiveTab } = useMarketTabsStore();

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const resultsData: MarketResultProps[] =
    activeTab.computed && activeTab.computed.intersect ?
        [
            ...(activeTab.adjustment.mode !== 'per_unit_tax' && activeTab.adjustment.mode !== 'per_unit_subsidy' ? [{
                icon: <DollarSign />,
                title: 'Market Price',
                value: activeTab.computed.equilibrium_price,
                currency: true,
                override:
                    activeTab.adjustment.result ?
                        (
                            activeTab.adjustment.mode === 'price_floor' ||
                            activeTab.adjustment.mode === 'price_ceiling'
                        ) ?
                            activeTab.adjustment.result.price
                        : (
                            activeTab.adjustment.mode === 'demand_shift' ||
                            activeTab.adjustment.mode === 'supply_shift'
                        ) ?
                            activeTab.adjustment.result.equilibrium_price
                        :   undefined
                    :   undefined,
            }] : []),
            ...(activeTab.adjustment.mode === 'per_unit_tax' || activeTab.adjustment.mode === 'per_unit_subsidy' ? 
                activeTab.adjustment.result ? [{
                    icon: <DollarSign />,
                    title: 'Buyer Price',
                    value: activeTab.computed.equilibrium_price,
                    currency: true,
                    override: activeTab.adjustment.result.buyer_price,
                    effect: (activeTab.adjustment.mode === 'per_unit_subsidy' ? 'good' : 'bad') as 'good' | 'bad'
                }] : [] : []),
            ...(activeTab.adjustment.mode === 'per_unit_tax' || activeTab.adjustment.mode === 'per_unit_subsidy' ? 
                activeTab.adjustment.result ? [{
                    icon: <DollarSign />,
                    title: 'Seller Price',
                    value: activeTab.computed.equilibrium_price,
                    currency: true,
                    override: activeTab.adjustment.result.seller_price,
                    effect: (activeTab.adjustment.mode === 'per_unit_subsidy' ? 'good' : 'bad') as 'good' | 'bad'
                }] : [] : []),
            {
                icon: <Hash />,
                title: 'Quantity Traded',
                value: activeTab.computed.equilibrium_quantity,
                currency: false,
                override:
                    activeTab.adjustment.result ?
                        (
                            activeTab.adjustment.mode === 'price_floor' ||
                            activeTab.adjustment.mode === 'price_ceiling'
                        ) ?
                            activeTab.adjustment.result.quantity_demanded
                        : (
                            activeTab.adjustment.mode === 'demand_shift' ||
                            activeTab.adjustment.mode === 'supply_shift'
                        ) ?
                            activeTab.adjustment.result.equilibrium_quantity
                        :   (
                            activeTab.adjustment.mode === 'per_unit_tax' ||
                            activeTab.adjustment.mode === 'per_unit_subsidy'
                        ) ? 
                            activeTab.adjustment.result.quantity_traded
                        :   undefined
                    :   undefined,
            },
            {
                icon: <Users />,
                title: 'Consumer Benefit',
                value: activeTab.computed.consumer_surplus,
                currency: true,
                override:
                    activeTab.adjustment.result ?
                        (
                            activeTab.adjustment.mode === 'price_floor' ||
                            activeTab.adjustment.mode === 'price_ceiling' ||
                            activeTab.adjustment.mode === 'per_unit_tax' ||
                            activeTab.adjustment.mode === 'per_unit_subsidy' ||
                            activeTab.adjustment.mode === 'demand_shift' ||
                            activeTab.adjustment.mode === 'supply_shift'
                        ) ?
                            activeTab.adjustment.result.consumer_surplus
                        :   undefined
                    :   undefined,
                effect: 'good',
            },
            {
                icon: <Building2 />,
                title: 'Producer Benefit',
                value: activeTab.computed.producer_surplus,
                currency: true,
                override:
                    activeTab.adjustment.result ?
                        (
                            activeTab.adjustment.mode === 'price_floor' ||
                            activeTab.adjustment.mode === 'price_ceiling' ||
                            activeTab.adjustment.mode === 'per_unit_tax' ||
                            activeTab.adjustment.mode === 'per_unit_subsidy' ||
                            activeTab.adjustment.mode === 'demand_shift' ||
                            activeTab.adjustment.mode === 'supply_shift'
                        ) ?
                            activeTab.adjustment.result.producer_surplus
                        :   undefined
                    :   undefined,
                effect: 'good',
            },
            {
                icon: <Sigma />,
                title: 'Total Benefit',
                value: activeTab.computed.total_surplus,
                currency: true,
                override:
                    activeTab.adjustment.result ?
                        (
                            activeTab.adjustment.mode === 'price_floor' ||
                            activeTab.adjustment.mode === 'price_ceiling' ||
                            activeTab.adjustment.mode === 'per_unit_tax' ||
                            activeTab.adjustment.mode === 'per_unit_subsidy' ||
                            activeTab.adjustment.mode === 'demand_shift' ||
                            activeTab.adjustment.mode === 'supply_shift'
                        ) ?
                            activeTab.adjustment.result.total_surplus
                        :   undefined
                    :   undefined,
                effect: 'good',
            },
            {
                icon: <Spline />,
                title: 'Arc PED',
                value: activeTab.computed.arc_price_elasticity_of_demand,
                currency: false,
            },
            {
                icon: <Spline />,
                title: 'Arc PES',
                value: activeTab.computed.arc_price_elasticity_of_supply,
                currency: false,
            },
        ]
    :   [];

    const formatGroupName = (group: string) => {
        switch (group) {
            case 'intervention':
                return 'Policy Impact';
            case 'calculation':
                return 'Economic Metrics';
            default:
                return '';
        }
    };

    const adjustmentResults = () => {
        if (!activeTab.adjustment.result) return null;
        if (!activeTab.computed || !activeTab.computed.intersect) return null;

        switch (activeTab.adjustment.mode) {
            case 'price_floor':
            case 'price_ceiling':
                return (
                    <>
                        <MarketResult
                            icon={<OctagonAlert />}
                            title={activeTab.adjustment.mode === 'price_floor' ? 'Surplus' : 'Shortage'}
                            value={
                                activeTab.adjustment.mode === 'price_floor' ?
                                    activeTab.adjustment.result.quantity_supplied -
                                    activeTab.adjustment.result.quantity_demanded
                                :   activeTab.adjustment.result.quantity_demanded -
                                    activeTab.adjustment.result.quantity_supplied
                            }
                            units
                        />
                        {activeTab.adjustment.mode === 'price_floor' && (
                            <MarketResult
                                icon={<Landmark />}
                                title='Government Purchase'
                                value={
                                    (activeTab.adjustment.result.quantity_supplied -
                                        activeTab.adjustment.result.quantity_demanded) *
                                    activeTab.computed.equilibrium_price
                                }
                                currency
                            />
                        )}
                        <MarketResult
                            icon={<Skull />}
                            title='Deadweight Loss'
                            value={activeTab.adjustment.result.deadweight_loss}
                            currency
                        />
                    </>
                );
            case 'per_unit_tax':
                return (
                    <>
                        <MarketResult
                            icon={<BanknoteArrowUp />}
                            title='Tax Revenue'
                            value={activeTab.adjustment.result.tax_revenue}
                            currency
                        />
                        <MarketResult
                            icon={<Frown />}
                            title='Consumer Tax Burden'
                            value={activeTab.adjustment.result.consumer_tax_burden}
                            currency
                        />
                        <MarketResult
                            icon={<Weight />}
                            title='Producer Tax Burden'
                            value={activeTab.adjustment.result.producer_tax_burden}
                            currency
                        />

                        <MarketResult
                            icon={<Skull />}
                            title='Deadweight Loss'
                            value={activeTab.adjustment.result.deadweight_loss}
                            currency
                        />
                    </>
                );
            case 'per_unit_subsidy':
                return (
                    <>
                        <MarketResult
                            icon={<BanknoteArrowDown />}
                            title='Subsidy Cost'
                            value={activeTab.adjustment.result.subsidy_cost}
                            currency
                        />
                        <MarketResult
                            icon={<Smile />}
                            title='Consumer Subsidy Benefit'
                            value={activeTab.adjustment.result.consumer_subsidy_benefit}
                            currency
                        />
                        <MarketResult
                            icon={<HeartHandshake />}
                            title='Producer Subsidy Benefit'
                            value={activeTab.adjustment.result.producer_subsidy_benefit}
                            currency
                        />
                        <MarketResult
                            icon={<Skull />}
                            title='Deadweight Loss'
                            value={activeTab.adjustment.result.deadweight_loss}
                            currency
                        />
                    </>
                );
            case 'point_elasticity':
                return (
                    <>
                        <MarketResult
                            icon={<Store />}
                            title='Point PED'
                            value={activeTab.adjustment.result.point_price_elasticity_of_demand}
                        />
                        <MarketResult
                            icon={<Factory />}
                            title='Point PES'
                            value={activeTab.adjustment.result.point_price_elasticity_of_supply}
                        />
                    </>
                );
        }
    };

    return (
        <div className='w-full lg:w-full lg:h-full'>
            {activeTab.computed && activeTab.computed.intersect ?
                <div className='w-full lg:h-full lg:overflow-y-auto'>
                    <div className='flex w-full p-2 gap-2 flex-row lg:flex-col lg:gap-6'>
                        {activeTab.adjustment.mode !== 'none' &&
                            activeTab.adjustment.mode !== 'demand_shift' &&
                            activeTab.adjustment.mode !== 'supply_shift' &&
                            activeTab.adjustment.result !== undefined && (
                                <div className='flex-1 lg:flex-none'>
                                    <span className='text-lg font-semibold'>
                                        {formatGroupName(
                                            Object.keys(groupedAdjustments).find((key) =>
                                                groupedAdjustments[key].includes(activeTab.adjustment.mode)
                                            ) || 'Other'
                                        )}
                                    </span>
                                    <div className='flex flex-col w-full space-y-2 lg:space-y-4 mt-2'>
                                        {adjustmentResults()}
                                    </div>
                                </div>
                            )}

                        <div className='flex-1 lg:flex-none'>
                            <div className="flex items-center">
                                <span className='text-lg font-semibold'>Basic Analysis</span>
                                <BasicAnalysisHelp />
                            </div>
                            <div className='flex flex-col w-full space-y-2 lg:space-y-4 mt-2'>
                                {resultsData.map((item, index) => (
                                    <MarketResult
                                        key={index}
                                        icon={item.icon}
                                        title={item.title}
                                        value={item.value}
                                        extra={item.extra}
                                        currency={item.currency}
                                        units={item.units}
                                        override={item.override}
                                        effect={item.effect}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            :   <div className='flex flex-col w-full h-full p-2 space-y-4'>
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                    <Skeleton className='h-12 w-full' />
                </div>
            }
        </div>
    );
};
