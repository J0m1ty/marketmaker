import { useMarketTabsStore } from '@/hooks/markets.store';
import { Card, CardContent, CardHeader } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { HelpCircle, Minus } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { ColorSelect } from './color-select';
import { AdjustmentModes, CurveFits, groupedAdjustments, type CurveFitType } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Toggle } from './ui/toggle';

const HelpIcon = ({ title, children }: { title: string; children: React.ReactNode }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant='ghost' size='sm' className='h-4 w-4 p-0 ml-2 opacity-85 hover:opacity-100'>
                    <HelpCircle className='h-3 w-3' />
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <DialogDescription className='text-sm'>{children}</DialogDescription>
            </DialogContent>
        </Dialog>
    );
};

export const MarketOptions = () => {
    const {
        getActiveTab,
        updateBounds,
        updateCurveColor,
        updateCurves,
        updateCurveFit,
        updateAdjustment,
        setAdjustmentMode,
    } = useMarketTabsStore();
    const [activeInput, setActiveInput] = useState(0);
    const [editingOption, setEditingOption] = useState(false);

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const formatModeName = (mode: (typeof AdjustmentModes)[number]) => {
        return mode.charAt(0).toUpperCase() + mode.slice(1).replace(/_/g, ' ');
    };

    const formatGroupName = (group: string) => {
        switch (group) {
            case 'none':
                return '';
            case 'intervention':
                return 'Government Controls';
            case 'change':
                return 'Market Shocks';
            case 'calculation':
                return 'Calculations';
            default:
                return 'Other';
        }
    };

    const analysisInput = () => {
        const { mode, price, amount, side, quantity } = activeTab.adjustment;

        switch (mode) {
            case 'none':
                return (
                    <div className='border-1 border-dashed rounded-md py-4 px-2 flex items-center justify-center text-center text-muted-foreground text-sm flex-1'>
                        Select an effect to see options
                    </div>
                );
            case 'price_ceiling':
            case 'price_floor':
                return (
                    <div className='flex flex-col gap-1'>
                        <Label htmlFor='price_input' className='text-[12px] text-muted-foreground'>
                            Value
                        </Label>
                        <Input
                            id='price_input'
                            value={`$${
                                editingOption && price === 0 ? ''
                                : editingOption ? price
                                : price.toFixed(2)
                            }`}
                            onChange={(e) => {
                                const value = parseFloat(e.currentTarget.value.replace('$', ''));
                                const clean = isNaN(value) ? 0 : value;
                                updateAdjustment(activeTab.market.id, {
                                    price: clean,
                                });
                            }}
                            onFocus={() => setEditingOption(true)}
                            onBlur={() => setEditingOption(false)}
                        />
                    </div>
                );
            case 'per_unit_tax':
            case 'per_unit_subsidy':
                return (
                    <div className='flex flex-col gap-1'>
                        <Label htmlFor='amount_input' className='text-[12px] text-muted-foreground'>
                            Applied to...
                        </Label>
                        <div className='flex flex-row gap-1'>
                            <Select
                                value={side}
                                onValueChange={(value) => {
                                    updateAdjustment(activeTab.market.id, {
                                        side: value as 'supplier' | 'consumer',
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='supplier'>Suppliers</SelectItem>
                                    <SelectItem value='consumer'>Consumers</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                id='amount_input'
                                value={`$${
                                    editingOption && amount === 0 ? ''
                                    : editingOption ? amount
                                    : amount.toFixed(2)
                                }`}
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value.replace('$', ''));
                                    const clean = isNaN(value) ? 0 : value;
                                    updateAdjustment(activeTab.market.id, {
                                        amount: clean,
                                    });
                                }}
                                onFocus={() => setEditingOption(true)}
                                onBlur={() => setEditingOption(false)}
                            />
                        </div>
                    </div>
                );
            case 'demand_shift':
            case 'supply_shift':
                return (
                    <div className='flex flex-col gap-1'>
                        <Label htmlFor='amount_input' className='text-[12px] text-muted-foreground'>
                            Value
                        </Label>
                        <Input
                            id='amount_input'
                            type='number'
                            className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                            value={editingOption && amount === 0 ? '' : amount}
                            onChange={(e) => {
                                const value = parseFloat(e.currentTarget.value);
                                const clean = isNaN(value) ? 0 : value;
                                updateAdjustment(activeTab.market.id, {
                                    amount: clean,
                                });
                            }}
                            onFocus={() => setEditingOption(true)}
                            onBlur={() => setEditingOption(false)}
                        />
                    </div>
                );
            case 'point_elasticity':
                return (
                    <div className='flex flex-col gap-1'>
                        <Label htmlFor='quantity_input' className='text-[12px] text-muted-foreground'>
                            At quantity...
                        </Label>
                        <Input
                            id='quantity_input'
                            value={editingOption && quantity === 0 ? '' : quantity}
                            onChange={(e) => {
                                const value = parseFloat(e.currentTarget.value);
                                const clean = Math.max(isNaN(value) ? 0 : value, 0);
                                updateAdjustment(activeTab.market.id, {
                                    quantity: clean,
                                });
                            }}
                            onFocus={() => setEditingOption(true)}
                            onBlur={() => setEditingOption(false)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className='flex flex-col lg:flex-row justify-evenly gap-2 p-3'>
            <Card className='gap-1 flex-1 dark:bg-neutral-900'>
                <CardHeader className='text-center text-sm flex flex-row items-center justify-center mb-2'>
                    <span className='translate-y-[1px]'>Window Options</span>
                    <HelpIcon title='Window Options'>
                        This section allows you to control the display boundaries of your market graph. Adjust the
                        x-axis (quantity) and y-axis (price) ranges to zoom in on specific areas of interest or to
                        better fit your data visualization needs.
                        <Separator className='my-2' />
                        <span className='font-bold text-primary/80'>Usage:</span> Toggle 'auto' on or off to switch
                        between automatic scaling and manual input. When 'auto' is off, you can set the minimum and
                        maximum values for both axes.
                    </HelpIcon>
                </CardHeader>
                <CardContent className='flex flex-col gap-4 h-full px-2 sm:px-6'>
                    <div className='flex flex-col gap-2'>
                        <div className='flex flex-row gap-2 items-center'>
                            <span className='text-muted-foreground'>x:</span>
                            <Input
                                type='number'
                                className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                value={
                                    activeInput === 1 && activeTab.bounds.quantityMin === 0 ?
                                        ''
                                    :   activeTab.bounds.quantityMin
                                }
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        quantityMin: clean,
                                        quantityMax: Math.max(clean + 1, activeTab.bounds.quantityMax),
                                    });
                                }}
                                onFocus={() => setActiveInput(1)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === 'auto'}
                            />
                            <Minus className='hidden sm:block' />
                            <Input
                                type='number'
                                className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                value={
                                    activeInput === 2 && activeTab.bounds.quantityMax === 0 ?
                                        ''
                                    :   activeTab.bounds.quantityMax
                                }
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        quantityMax: clean,
                                        quantityMin: Math.min(clean - 1, activeTab.bounds.quantityMin),
                                    });
                                }}
                                onFocus={() => setActiveInput(2)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === 'auto'}
                            />
                        </div>
                        <div className='flex flex-row gap-2 items-center'>
                            <span className='text-muted-foreground'>y:</span>
                            <Input
                                type='number'
                                className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                value={
                                    activeInput === 3 && activeTab.bounds.priceMin === 0 ?
                                        ''
                                    :   activeTab.bounds.priceMin
                                }
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        priceMin: clean,
                                        priceMax: Math.max(clean + 1, activeTab.bounds.priceMax),
                                    });
                                }}
                                onFocus={() => setActiveInput(3)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === 'auto'}
                            />
                            <Minus className='hidden sm:block' />
                            <Input
                                type='number'
                                className='[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                value={
                                    activeInput === 4 && activeTab.bounds.priceMax === 0 ?
                                        ''
                                    :   activeTab.bounds.priceMax
                                }
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        priceMax: clean,
                                        priceMin: Math.min(clean - 1, activeTab.bounds.priceMin),
                                    });
                                }}
                                onFocus={() => setActiveInput(4)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === 'auto'}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='flex flex-row items-center gap-2 justify-center sm:justify-start'>
                            <Checkbox
                                className='bg-neutral-200 border-neutral-400'
                                checked={activeTab.bounds.type === 'auto'}
                                onCheckedChange={(checked) =>
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        type: checked ? 'auto' : 'manual',
                                    })
                                }
                            />
                            <span className='text-sm translate-y-[1px]'>Auto scale</span>
                        </div>
                        <div className='flex flex-row items-center gap-2 justify-center sm:justify-start'>
                            <Checkbox
                                className='bg-neutral-200 border-neutral-400'
                                checked={activeTab.bounds.clip}
                                disabled={activeTab.bounds.type === 'manual'}
                                onCheckedChange={(checked) =>
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        clip: checked ? true : false,
                                    })
                                }
                            />
                            <span
                                className={`text-sm translate-y-[1px] ${activeTab.bounds.type === 'manual' ? 'text-muted-foreground' : ''}`}
                            >
                                Clip to square
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className='gap-1 flex-1 dark:bg-neutral-900'>
                <CardHeader className='text-center text-sm flex flex-row items-center justify-center'>
                    <span>Market Analysis</span>
                    <HelpIcon title='Market Analysis'>
                        Use these tools to analyze various market scenarios including government interventions (price
                        floors, ceilings, taxes), market shocks (supply/demand shifts), and economic calculations
                        (consumer surplus, producer surplus, elasticity).
                        <Separator className='my-2' />
                        <span className='font-bold text-primary/80'>Usage:</span> Select a scenario type and input the
                        relevant parameters. Sometimes you can drag the effect on the graph to adjust it.
                    </HelpIcon>
                </CardHeader>
                <CardContent className='px-2 sm:px-6 flex flex-col gap-2 h-full'>
                    <Select
                        value={activeTab.adjustment.mode}
                        onValueChange={(value) => {
                            setAdjustmentMode(activeTab.market.id, value as (typeof AdjustmentModes)[number]);
                        }}
                    >
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select effect' />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(groupedAdjustments).map(([type, modes]) => (
                                <SelectGroup key={type}>
                                    {type != 'none' && <SelectLabel>{formatGroupName(type)}</SelectLabel>}
                                    {modes.map((mode) => (
                                        <SelectItem key={mode} value={mode}>
                                            {formatModeName(mode)}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                    {analysisInput()}
                </CardContent>
            </Card>
            <Card className='gap-1 flex-1 dark:bg-neutral-900'>
                <CardHeader className='text-center text-sm flex flex-row items-center justify-center'>
                    <span>Curve Options</span>
                    <HelpIcon title='Curve Options'>
                        Customize the appearance and behavior of your supply and demand curves. Switch between curve
                        types, choose different fitting methods (linear, logarithmic, power, etc.), and adjust colors to
                        create the better visualization for your market analysis.
                        <Separator className='my-2' />
                        <span className='font-bold text-primary/80'>Usage:</span> Select the curve type (demand or
                        supply) and adjust the fitting method and color as needed.
                    </HelpIcon>
                </CardHeader>
                <CardContent className='px-2 sm:px-6'>
                    <div className='flex flex-col gap-2'>
                        <Tabs
                            value={activeTab.curves.selected}
                            onValueChange={(value) => {
                                updateCurves(activeTab.market.id, {
                                    ...activeTab.curves,
                                    selected: value as 'demand' | 'supply',
                                });
                            }}
                        >
                            <TabsList className='w-full'>
                                <TabsTrigger value='demand'>Demand</TabsTrigger>
                                <TabsTrigger value='supply'>Supply</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className='flex flex-row items-center gap-2'>
                            <Select
                                value={activeTab.curves[activeTab.curves.selected].fit}
                                onValueChange={(value) => {
                                    updateCurveFit(
                                        activeTab.market.id,
                                        activeTab.curves.selected,
                                        value as CurveFitType
                                    );
                                }}
                            >
                                <SelectTrigger className='w-full flex-1'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CurveFits.map((fit) => (
                                        <SelectItem key={fit} value={fit}>
                                            {fit.charAt(0).toUpperCase() + fit.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Toggle
                                variant='outline'
                                pressed={activeTab.curves.bold}
                                onPressedChange={(pressed) => {
                                    updateCurves(activeTab.market.id, {
                                        ...activeTab.curves,
                                        bold: pressed,
                                    });
                                }}
                            >
                                Bold
                            </Toggle>
                        </div>
                        <ColorSelect
                            curve={activeTab.curves.selected}
                            hex={activeTab.curves[activeTab.curves.selected].color}
                            setHex={(hex) => {
                                console.log(activeTab.curves.selected, hex);
                                updateCurveColor(activeTab.market.id, activeTab.curves.selected, hex as `#${string}`);
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
