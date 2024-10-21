import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type StoreType = {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
}

const StorageContext = createContext<StoreType | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
    return (
        <StorageContext.Provider value={window.electron.store}>
            { children }
        </StorageContext.Provider>
    );
}

export function useStorage() {
    const context = useContext(StorageContext);

    if (!context) {
        throw new Error('useStorage must be used within a StorageProvider');
    }

    return context;
}