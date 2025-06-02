import type { MarketFile, MarketRow } from '@/lib/types';

export const sanitizeNumber = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '0';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue) || numValue < 0) return '0';

    return numValue.toString();
};

export const sanitizeMarketRow = (
    row: Partial<MarketRow>,
    index: number
): MarketRow => {
    return {
        id: row.id ?? index + 1,
        price: parseFloat(sanitizeNumber(row.price)),
        qd: parseFloat(sanitizeNumber(row.qd)),
        qs: parseFloat(sanitizeNumber(row.qs)),
    };
};

export const convertToMarketFile = (data: Partial<MarketRow>[]): MarketFile => {
    const sanitizedRows = data.map((row, index) =>
        sanitizeMarketRow(row, index)
    );

    return {
        createdAt: new Date().toISOString(),
        rows: sanitizedRows,
    };
};

export const convertToCSV = (marketFile: MarketFile): string => {
    const headers = ['id', 'price', 'qd', 'qs'];
    const csvRows = [
        `# Created: ${marketFile.createdAt}`,
        headers.join(','),
        ...marketFile.rows.map(
            row => `${row.id},${row.price},${row.qd},${row.qs}`
        ),
    ];
    return csvRows.join('\n');
};

export const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    const cleanFilename = filename.replace(/\.[^/.]+$/, '') || 'Untitled';
    link.download = `${cleanFilename}.csv`;

    link.click();

    URL.revokeObjectURL(url);
};
