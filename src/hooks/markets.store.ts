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

    updateIntervention: (id: string, i: MarketTab['adjustment']) => void;
    updateBounds: (id: string, b: MarketTab['bounds']) => void;
    updateCurves: (
        id: string,
        curves: MarketTab['curves']
    ) => void;
    updateCurveFit: (
        id: string,
        side: 'demand' | 'supply',
        fit: MarketTab['curves']['demand']['fit']
    ) => void;
    updateCurveColor: (
        id: string,
        side: 'demand' | 'supply',
        color: `#${string}`
    ) => void;
    updateComputed: (id: string, computed: Partial<MarketData>) => void;

    getTab: (id: string) => MarketTab | undefined;
    getActiveTab: () => MarketTab | undefined;
}

export const useMarketTabsStore = create<MarketTabsStore>((set, get) => ({
    tabs: [],
    activeTabId: null,

    openTab: market => {
        let wasAlreadyOpen = false;

        set(state => {
            const exists = state.tabs.find(tab => tab.market.id === market.id);
            if (exists) {
                wasAlreadyOpen = true;
                return { activeTabId: market.id };
            }

            const newTab: MarketTab = {
                market,
                bounds: {
                    type: 'auto',
                    priceMin: 0,
                    priceMax: 10,
                    quantityMin: 0,
                    quantityMax: 10,
                },
                curves: {
                    selected: 'demand',
                    demand: { fit: 'linear', color: '#e91e63' },
                    supply: { fit: 'linear', color: '#3f51b5' },
                },
                adjustment: { mode: 'none' },
                computed: {
                    equilibrium_price: 3.3,
                    equilibrium_quantity: 2.3,
                    arc_price_elasticity_of_demand: -2.8,
                    arc_price_elasticity_of_supply: 1.2,
                    consumer_surplus: 3.1,
                    producer_surplus: 2.6,
                    total_surplus: 5.8,
                },
            };

            return {
                tabs: [...state.tabs, newTab],
                activeTabId: market.id,
            };
        });

        return wasAlreadyOpen;
    },

    closeTab: id => {
        set(state => {
            const remaining = state.tabs.filter(tab => tab.market.id !== id);
            const newActive =
                state.activeTabId === id
                    ? (remaining[0]?.market.id ?? null)
                    : state.activeTabId;
            return {
                tabs: remaining,
                activeTabId: newActive,
            };
        });
    },

    closeAllTabs: () => set(() => ({ tabs: [], activeTabId: null })),

    setActiveTab: id => set(() => ({ activeTabId: id })),

    reorderTabs: (activeId, overId) => {
        set(({ tabs }) => {
            const activeIndex = tabs.findIndex(
                tab => tab.market.id === activeId
            );
            const overIndex = tabs.findIndex(tab => tab.market.id === overId);

            if (activeIndex === -1 || overIndex === -1) return {};

            const newTabs = [...tabs];
            const [movedTab] = newTabs.splice(activeIndex, 1);
            newTabs.splice(overIndex, 0, movedTab);

            return { tabs: newTabs };
        });
    },

    updateIntervention: (id, i) =>
        set(({ tabs }) => ({
            tabs: tabs.map(t =>
                t.market.id === id ? { ...t, adjustment: i } : t
            ),
        })),

    updateBounds: (id, b) =>
        set(({ tabs }) => ({
            tabs: tabs.map(t => (t.market.id === id ? { ...t, bounds: b } : t)),
        })),

    updateCurves: (id, curves) =>
        set(({ tabs }) => ({
            tabs: tabs.map(t =>
                t.market.id === id
                    ? { ...t, curves }
                    : t
            ),
        })),

    updateCurveFit: (id, side, fit) =>
        set(({ tabs }) => ({
            tabs: tabs.map(t =>
                t.market.id === id
                    ? {
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
            tabs: tabs.map(t =>
                t.market.id === id
                    ? {
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
            tabs: tabs.map(t =>
                t.market.id === id
                    ? {
                          ...t,
                          computed: {
                              ...(t.computed || {}),
                              ...computed,
                          } as MarketData,
                      }
                    : t
            ),
        })),

    getTab: id => get().tabs.find(tab => tab.market.id === id),
    getActiveTab: () => get().getTab(get().activeTabId || ''),
}));
