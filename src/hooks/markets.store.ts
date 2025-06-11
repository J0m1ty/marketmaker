import type { Market, MarketData, MarketTab } from '@/lib/types';
import { create } from 'zustand';

interface MarketTabsStore {
    tabs: MarketTab[];
    activeTabId: string | null;

    openTab: (market: Market) => boolean;
    closeTab: (id: string) => void;
    closeAllTabs: () => void;
    setActiveTab: (id: string) => void;
    reorderTabs: (activeId: string, overId: string) => void;

    updateAdjustment: (id: string, i: Partial<MarketTab['adjustment']>) => void;
    updateAdjustmentResult: (id: string, result: MarketTab['adjustment']['result']) => void;
    setAdjustmentMode: (id: string, mode: MarketTab['adjustment']['mode']) => void;
    updateBounds: (id: string, b: MarketTab['bounds']) => void;
    updateCurves: (id: string, curves: MarketTab['curves']) => void;
    updateCurveFit: (id: string, side: 'demand' | 'supply', fit: MarketTab['curves']['demand']['fit']) => void;
    updateCurveColor: (id: string, side: 'demand' | 'supply', color: `#${string}`) => void;
    updateComputed: (id: string, computed: Partial<MarketData>) => void;

    getTab: (id: string) => MarketTab | undefined;
    getActiveTab: () => MarketTab | undefined;
    updateClippedBounds: (id: string) => void;
}

const getClippedBounds = (ranges: MarketTab['ranges']) => {
    const { demand, supply, combined } = ranges;

    const priceMin = Math.min(demand.priceMin, supply.priceMin, combined.priceMin);
    const priceMax = Math.max(demand.priceMax, supply.priceMax, combined.priceMax);
    const quantityMin = Math.min(demand.quantityMin, supply.quantityMin, combined.quantityMin);
    const quantityMax = Math.max(demand.quantityMax, supply.quantityMax, combined.quantityMax);

    const priceRange = priceMax - priceMin;
    const quantityRange = quantityMax - quantityMin;

    const squareRange = Math.min(priceRange, quantityRange);

    return {
        priceMin: priceMin,
        priceMax: priceMin + squareRange,
        quantityMin: quantityMin,
        quantityMax: quantityMin + squareRange,
    };
};

export const useMarketTabsStore = create<MarketTabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,

    updateClippedBounds: (id) => {
        set((state) => {
            const tab = state.tabs.find((t) => t.market.id === id);
            if (!tab) return state;

            const clippedBounds = tab.bounds.clip ? getClippedBounds(tab.ranges) : tab.ranges.combined;

            return {
                tabs: state.tabs.map((t) =>
                    t.market.id === id ?
                        {
                            ...t,
                            bounds: {
                                ...t.bounds,
                                ...clippedBounds,
                            },
                        }
                    :   t
                ),
            };
        });
    },

    openTab: (market) => {
        let wasAlreadyOpen = false;

        set((state) => {
            const exists = state.tabs.find((tab) => tab.market.id === market.id);
            if (exists) {
                wasAlreadyOpen = true;
                return { activeTabId: market.id };
            }

            const rows = market.file.rows;

            const prices = rows.map((row) => row.price);
            const demandQuantities = rows.map((row) => row.qd);
            const supplyQuantities = rows.map((row) => row.qs);
            const allQuantities = [...demandQuantities, ...supplyQuantities];

            const nonZeroDemand = rows.filter((row) => row.qd > 0);
            const nonZeroSupply = rows.filter((row) => row.qs > 0);

            const demandPrices = nonZeroDemand.map((row) => row.price);
            const demandQs = nonZeroDemand.map((row) => row.qd);

            const supplyPrices = nonZeroSupply.map((row) => row.price);
            const supplyQs = nonZeroSupply.map((row) => row.qs);

            const combinedBounds = {
                priceMin: Math.min(...prices),
                priceMax: Math.max(...prices),
                quantityMin: Math.min(...allQuantities),
                quantityMax: Math.max(...allQuantities),
            };

            const ranges = {
                demand: {
                    priceMin: demandPrices.length > 0 ? Math.min(...demandPrices) : combinedBounds.priceMin,
                    priceMax: demandPrices.length > 0 ? Math.max(...demandPrices) : combinedBounds.priceMax,
                    quantityMin: demandQs.length > 0 ? Math.min(...demandQs) : 0,
                    quantityMax: demandQs.length > 0 ? Math.max(...demandQs) : 0,
                },
                supply: {
                    priceMin: supplyPrices.length > 0 ? Math.min(...supplyPrices) : combinedBounds.priceMin,
                    priceMax: supplyPrices.length > 0 ? Math.max(...supplyPrices) : combinedBounds.priceMax,
                    quantityMin: supplyQs.length > 0 ? Math.min(...supplyQs) : 0,
                    quantityMax: supplyQs.length > 0 ? Math.max(...supplyQs) : 0,
                },
                combined: combinedBounds,
            };

            const clippedBounds = getClippedBounds(ranges);

            const newTab: MarketTab = {
                market,
                bounds: {
                    type: 'auto',
                    clip: true,
                    ...clippedBounds,
                },
                ranges,
                curves: {
                    selected: 'demand',
                    demand: { fit: 'linear', color: '#e91e63' },
                    supply: { fit: 'linear', color: '#3f51b5' },
                },
                adjustment: { mode: 'none' },
                computed: {
                    intersect: false,
                },
            };

            return {
                tabs: [...state.tabs, newTab],
                activeTabId: market.id,
            };
        });

        return wasAlreadyOpen;
    },

    closeTab: (id) => {
        set((state) => {
            const remaining = state.tabs.filter((tab) => tab.market.id !== id);
            const newActive = state.activeTabId === id ? (remaining[0]?.market.id ?? null) : state.activeTabId;
            return {
                tabs: remaining,
                activeTabId: newActive,
            };
        });
    },

    closeAllTabs: () => set(() => ({ tabs: [], activeTabId: null })),

    setActiveTab: (id) => set(() => ({ activeTabId: id })),

    reorderTabs: (activeId, overId) => {
        set(({ tabs }) => {
            const activeIndex = tabs.findIndex((tab) => tab.market.id === activeId);
            const overIndex = tabs.findIndex((tab) => tab.market.id === overId);

            if (activeIndex === -1 || overIndex === -1) return {};

            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(activeIndex, 1);
            newTabs.splice(overIndex, 0, movedTab);

            return { tabs: newTabs };
        });
    },

    updateAdjustment: (id, i) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ? { ...t, adjustment: { ...t.adjustment, ...i } as MarketTab['adjustment'] } : t
            ),
        })),

    updateAdjustmentResult: (id, result) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ?
                    {
                        ...t,
                        adjustment: {
                            ...t.adjustment,
                            result: { ...(t.adjustment.result || {}), ...result },
                        } as MarketTab['adjustment'],
                    }
                :   t
            ),
        })),

    setAdjustmentMode: (id, mode) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ?
                    {
                        ...t,
                        adjustment: (() => {
                            const activeTab = get().getActiveTab();

                            switch (mode) {
                                case 'none':
                                    return { mode: 'none' };
                                case 'price_floor':
                                    return {
                                        mode: 'price_floor',
                                        type: 'intervention',
                                        price:
                                            activeTab?.computed?.intersect ? activeTab.computed.equilibrium_price : 0,
                                    };
                                case 'price_ceiling':
                                    return {
                                        mode: 'price_ceiling',
                                        type: 'intervention',
                                        price:
                                            activeTab?.computed?.intersect ? activeTab.computed.equilibrium_price : 0,
                                    };
                                case 'per_unit_tax':
                                    return {
                                        mode: 'per_unit_tax',
                                        type: 'intervention',
                                        amount: 0,
                                        side: 'supplier',
                                    };
                                case 'per_unit_subsidy':
                                    return {
                                        mode: 'per_unit_subsidy',
                                        type: 'intervention',
                                        amount: 0,
                                        side: 'supplier',
                                    };
                                case 'demand_shift':
                                    return {
                                        mode: 'demand_shift',
                                        type: 'change',
                                        amount: 0,
                                    };
                                case 'supply_shift':
                                    return {
                                        mode: 'supply_shift',
                                        type: 'change',
                                        amount: 0,
                                    };
                                case 'point_elasticity':
                                    return {
                                        mode: 'point_elasticity',
                                        type: 'calculation',
                                        quantity:
                                            activeTab?.computed?.intersect ?
                                                activeTab.computed.equilibrium_quantity
                                            :   0,
                                    };
                                default:
                                    return { mode: 'none' };
                            }
                        })(),
                    }
                :   t
            ),
        })),

    updateBounds: (id, b) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) => {
                if (t.market.id !== id) return t;

                if (b.type === 'auto' && t.bounds.type !== 'auto') {
                    const boundsToUse = b.clip ? getClippedBounds(t.ranges) : t.ranges.combined;

                    return {
                        ...t,
                        bounds: {
                            type: 'auto',
                            clip: b.clip,
                            ...boundsToUse,
                        },
                    };
                }

                if (b.clip !== t.bounds.clip) {
                    const boundsToUse = b.clip ? getClippedBounds(t.ranges) : t.ranges.combined;

                    return {
                        ...t,
                        bounds: {
                            ...b,
                            ...boundsToUse,
                        },
                    };
                }

                return { ...t, bounds: b };
            }),
        })),

    updateCurves: (id, curves) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) => (t.market.id === id ? { ...t, curves } : t)),
        })),

    updateCurveFit: (id, side, fit) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ?
                    {
                        ...t,
                        curves: {
                            ...t.curves,
                            [side]: { ...t.curves[side], fit },
                        },
                    }
                :   t
            ),
        })),

    updateCurveColor: (id, side, color) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ?
                    {
                        ...t,
                        curves: {
                            ...t.curves,
                            [side]: { ...t.curves[side], color },
                        },
                    }
                :   t
            ),
        })),

    updateComputed: (id, computed) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) =>
                t.market.id === id ?
                    {
                        ...t,
                        computed: {
                            ...(t.computed || {}),
                            ...computed,
                        } as MarketData,
                    }
                :   t
            ),
        })),

    getTab: (id) => get().tabs.find((tab) => tab.market.id === id),
    getActiveTab: () => get().getTab(get().activeTabId || ''),
}));
