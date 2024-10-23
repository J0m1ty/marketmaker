import { contextBridge, ipcRenderer, webUtils } from 'electron';

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
            return ipcRenderer.invoke('set-theme', theme);
        }
    },
    selectFile: () => ipcRenderer.invoke('dialog:openFile'),
    getFilePath: (file: File, callback: (path: string) => void) => callback(webUtils.getPathForFile(file)),
    readFile: (path: string) => ipcRenderer.invoke('file:read', path),
    quit: () => ipcRenderer.invoke('app:quit')
}

contextBridge.exposeInMainWorld('electron', electronHandler);