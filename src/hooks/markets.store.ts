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
}

export const useMarketTabsStore = create<MarketTabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,

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

            const combinedBounds = {
                priceMin: Math.min(...prices),
                priceMax: Math.max(...prices),
                quantityMin: Math.min(...allQuantities),
                quantityMax: Math.max(...allQuantities),
            };

            const newTab: MarketTab = {
                market,
                bounds: {
                    type: 'auto',
                    ...combinedBounds,
                },
                ranges: {
                    demand: {
                        priceMin: Math.min(...prices),
                        priceMax: Math.max(...prices),
                        quantityMin: Math.min(...demandQuantities),
                        quantityMax: Math.max(...demandQuantities),
                    },
                    supply: {
                        priceMin: Math.min(...prices),
                        priceMax: Math.max(...prices),
                        quantityMin: Math.min(...supplyQuantities),
                        quantityMax: Math.max(...supplyQuantities),
                    },
                    combined: combinedBounds,
                },
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
                    : t
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
                                            activeTab?.computed?.intersect ? activeTab.computed.equilibrium_quantity : 0,
                                    };
                                default:
                                    return { mode: 'none' };
                            }
                        })(),
                    }
                    : t
            ),
        })),

    updateBounds: (id, b) =>
        set(({ tabs }) => ({
            tabs: tabs.map((t) => {
                if (t.market.id !== id) return t;

                if (b.type === 'auto' && t.bounds.type !== 'auto') {
                    return {
                        ...t,
                        bounds: {
                            type: 'auto',
                            ...t.ranges.combined,
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
                    : t
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
                    : t
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
                    : t
            ),
        })),

    getTab: (id) => get().tabs.find((tab) => tab.market.id === id),
    getActiveTab: () => get().getTab(get().activeTabId || ''),
}));
