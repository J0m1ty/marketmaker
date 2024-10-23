export { };

/*
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
    getFilePath: (file: File, callback: (path: string) => void) => callback(webUtils.getPathForFile(file)),
    readFile: (path: string) => ipcRenderer.invoke('file:read', path),
}

*/
declare global {
    interface Window {
        electron: {
            store: {
                get<T>(key: string): Promise<T | null>;
                set<T>(key: string, value: T): Promise<void>;
            },
            theme: {
                send(theme: any): Promise<void>;
            },
            selectFile: () => Promise<string | null>;
            getFilePath: (file: File, callback: (path: string) => void) => void;
            readFile: (path: string) => Promise<string | null>;
            quit: () => void;
        }
    }
}