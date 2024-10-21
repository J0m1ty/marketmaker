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
            readFile: (path: string) => Promise<string | null>;
        }
    }
}