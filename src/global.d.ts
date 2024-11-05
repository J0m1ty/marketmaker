export { };

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