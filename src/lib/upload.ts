import type { MarketRow } from "@/model/market.schema";
import { sanitizeMarketRow } from "./download";

export const parseFileContent = (content: string): MarketRow[] => {
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Filter out comments and empty lines

    // Skip header row if it exists
    const dataLines = lines[0]?.includes('id,price,qd,qs') ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
        const [id, price, qd, qs] = line.split(',').map(val => val?.trim() || "0");
        return sanitizeMarketRow({
            id: parseInt(id) || undefined,
            price,
            qd,
            qs
        }, index);
    });
};

export const uploadFile = (): Promise<{ filename: string, data: MarketRow[] }> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.txt,.market';

        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = parseFileContent(content);
                    const filename = file.name.replace(/\.[^/.]+$/, "") || "Untitled";
                    resolve({
                        filename,
                        data
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        };

        input.click();
    });
};