import { create } from 'zustand';
import type { MarketRow } from '../lib/types';

const createInitialData = () =>
    Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        price: 0,
        qd: 0,
        qs: 0,
    }));

interface DataStore {
    data: Partial<MarketRow>[];
    filename: string;
    setData: (data: Partial<MarketRow>[]) => void;
    setFilename: (filename: string) => void;
    resetData: () => void;
    updateData: (updater: (prevData: Partial<MarketRow>[]) => Partial<MarketRow>[]) => void;
}

export const useDataStore = create<DataStore>((set) => ({
    data: createInitialData(),
    filename: '',
    setData: (data) => set({ data }),
    setFilename: (filename) => set({ filename }),
    resetData: () => set({ data: createInitialData() }),
    updateData: (updater) => set((state) => ({ data: updater(state.data) })),
}));
