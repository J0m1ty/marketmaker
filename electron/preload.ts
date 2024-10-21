import { contextBridge, ipcRenderer } from 'electron';

const electronHandler = {
    store: {
        async get<T>(key: string): Promise<T | null> {
            return ipcRenderer.invoke('get-store', key);
        },
        async set<T>(key: string, value: T): Promise<void> {
            return ipcRenderer.invoke('set-store', key, value);
        }
    },
    theme: {
        async send(theme: any): Promise<void> {
            return ipcRenderer.invoke('set-theme', theme);  // Use invoke to return a promise
        }
    },
    selectFile: () => ipcRenderer.invoke('dialog:openFile'),
    readFile: (path: string) => ipcRenderer.invoke('file:read', path),
}

contextBridge.exposeInMainWorld('electron', electronHandler);