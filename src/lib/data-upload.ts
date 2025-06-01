import type { MarketRow } from '@/lib/types';
import { sanitizeMarketRow } from './download';

export function parseFileContent(
    input: string | File
): MarketRow[] | Promise<MarketRow[]> {
    if (typeof input === 'string') {
        return parseStringContent(input);
    } else {
        return parseFileObject(input);
    }
}

const parseStringContent = (content: string): MarketRow[] => {
    const lines = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    const dataLines = lines[0]?.includes('id,price,qd,qs')
        ? lines.slice(1)
        : lines;

    return dataLines.map((line, index) => {
        const [id, price, qd, qs] = line
            .split(',')
            .map(val => val?.trim() || '0');
        return sanitizeMarketRow(
            {
                id: parseInt(id) || undefined,
                price,
                qd,
                qs,
            },
            index
        );
    });
};

const parseFileObject = (file: File): Promise<MarketRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const content = e.target?.result as string;
                const data = parseStringContent(content);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

export const uploadFile = (): Promise<{
    filename: string;
    data: MarketRow[];
    fileSize: number;
}> => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = event => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const content = e.target?.result as string;
                    const data = parseStringContent(content);
                    const filename =
                        file.name.replace(/\.[^/.]+$/, '') || 'Untitled';
                    resolve({
                        filename,
                        data,
                        fileSize: file.size,
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
