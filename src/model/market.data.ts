import { create } from 'zustand';
import type { MarketRow } from './market.schema';

const createInitialData = () =>
    Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        price: "0",
        qd: "0",
        qs: "0"
    }));

interface DataStore {
    data: Partial<MarketRow>[];
    setData: (data: Partial<MarketRow>[]) => void;
    resetData: () => void;
    updateData: (updater: (prevData: Partial<MarketRow>[]) => Partial<MarketRow>[]) => void;
}

export const useCreateStore = create<DataStore>((set) => ({
    data: createInitialData(),
    setData: (data) => set({ data }),
    resetData: () => set({ data: createInitialData() }),
    updateData: (updater) => set((state) => ({ data: updater(state.data) })),
}));

export const hasUserData = (data: Partial<MarketRow>[]) => {
    return data.length > 20 || data.some(row => {
        const price = Number(row.price ?? '0');
        const qd = Number(row.qd ?? '0');
        const qs = Number(row.qs ?? '0');

        return (!isNaN(price) && price !== 0 && `${price}` === row.price) ||
            (!isNaN(qd) && qd !== 0 && `${qd}` === row.qd) ||
            (!isNaN(qs) && qs !== 0 && `${qs}` === row.qs);
    });
};