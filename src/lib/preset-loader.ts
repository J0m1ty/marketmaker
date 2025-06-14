import type { Market } from '@/lib/types';
import { parseFileContent } from '@/lib/data-upload';
import { hashFileContent } from '@/lib/market-upload';
import { toast } from 'sonner';

export const PRESET_FILES = [
    'Basic (Linear).csv',
    'Elastic Supply (Linear).csv',
    'Elastic Supply (Power).csv',
    'Inelastic Demand (Linear).csv',
    'Inelastic Demand (Log).csv',
    'Inelastic Supply (Linear).csv',
    'Noisy (Linear).csv',
] as const;

export type PresetFile = (typeof PRESET_FILES)[number];

export const PRESET_URL_MAP: Record<string, PresetFile> = {
    'basic-linear': 'Basic (Linear).csv',
    'elastic-supply-linear': 'Elastic Supply (Linear).csv',
    'elastic-supply-power': 'Elastic Supply (Power).csv',
    'inelastic-demand-linear': 'Inelastic Demand (Linear).csv',
    'inelastic-demand-log': 'Inelastic Demand (Log).csv',
    'inelastic-supply-linear': 'Inelastic Supply (Linear).csv',
    'noisy-linear': 'Noisy (Linear).csv',
} as const;

export type PresetUrlKey = keyof typeof PRESET_URL_MAP;

export const PRESET_FILE_TO_URL_MAP: Record<PresetFile, PresetUrlKey> = Object.fromEntries(
    Object.entries(PRESET_URL_MAP).map(([key, value]) => [value, key])
) as Record<PresetFile, PresetUrlKey>;

export const getPresetFileFromUrl = (urlKey: string): PresetFile | null => {
    return PRESET_URL_MAP[urlKey as PresetUrlKey] || null;
};

export const getUrlKeyFromPresetFile = (presetFile: PresetFile): PresetUrlKey => {
    return PRESET_FILE_TO_URL_MAP[presetFile];
};

export const isValidPresetUrlKey = (urlKey: string): urlKey is PresetUrlKey => {
    return urlKey in PRESET_URL_MAP;
};

export const loadPreset = async (presetName: PresetFile): Promise<Market> => {
    try {
        const response = await fetch(`/presets/${presetName}`);
        if (!response.ok) {
            throw new Error(`Failed to load preset: ${response.statusText}`);
        }

        const content = await response.text();
        const data = parseFileContent(content) as any[];
        const filename = presetName.replace(/\.[^/.]+$/, '') || 'Untitled';

        return {
            id: hashFileContent(filename, data),
            name: filename,
            file: {
                createdAt: new Date().toISOString(),
                rows: data,
            },
        };
    } catch (error) {
        console.error('Error loading preset:', error);
        throw new Error(`Failed to load preset "${presetName}"`);
    }
};

export const handlePresetLoad = async (
    presetName: PresetFile,
    onSuccess: (market: Market) => boolean | void
): Promise<void> => {
    try {
        const market = await loadPreset(presetName);
        const wasAlreadyOpen = onSuccess(market);

        if (wasAlreadyOpen) {
            toast.info(`Preset "${presetName}" is already open`);
        } else {
            toast.success(`Successfully loaded preset "${presetName}"`);
        }
    } catch (error) {
        console.error('Error loading preset:', error);
        toast.error(error instanceof Error ? error.message : `Failed to load preset "${presetName}"`);
    }
};
