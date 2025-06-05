import type { Market } from '@/lib/types';
import { parseFileContent, uploadFile } from '@/lib/data-upload';
import { toast } from 'sonner';

/**
 * Creates a deterministic hash from file content
 */
export const hashFileContent = (filename: string, data: any): string => {
    const content = JSON.stringify({ filename, data });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
};

export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
};

export const createMarketFromFile = (file: File, data: any): Market => {
    const filename = file.name.replace(/\.[^/.]+$/, '') || 'Untitled';
    return {
        id: hashFileContent(filename, data),
        name: filename,
        file: {
            createdAt: new Date().toISOString(),
            rows: data,
        },
    };
};

export const handleDropzoneUpload = async (
    file: File,
    onSuccess: (market: Market) => boolean | void
): Promise<void> => {
    try {
        const data = await (parseFileContent(file) as Promise<any>);
        const market = createMarketFromFile(file, data);
        const wasAlreadyOpen = onSuccess(market);

        if (wasAlreadyOpen) {
            toast.info(`File is already open`);
        } else {
            toast.success(`Successfully loaded ${file.name} (${formatFileSize(file.size)})`);
        }
    } catch (error) {
        console.error('Error parsing file:', error);
        toast.error(`Failed to load ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const handleMarketFileUpload = async (onSuccess: (market: Market) => boolean | void): Promise<void> => {
    try {
        const { filename, data, fileSize } = await uploadFile();
        const mockFile = new File([], filename);
        const market = createMarketFromFile(mockFile, data);
        const wasAlreadyOpen = onSuccess(market);

        if (wasAlreadyOpen) {
            toast.info(`File is already open`);
        } else {
            toast.success(`Successfully loaded ${filename}.csv (${formatFileSize(fileSize)})`);
        }
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            console.error('Error uploading file:', error);
            toast.error(error.message);
        }
    }
};
