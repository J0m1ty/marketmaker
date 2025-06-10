import type { Market } from '@/lib/types';
import { parseFileContent } from '@/lib/data-upload';
import { hashFileContent } from '@/lib/market-upload';
import { toast } from 'sonner';

// Available preset files
export const PRESET_FILES = [
    'Basic (Linear).csv',
    'Elastic Supply (Linear).csv',
    'Elastic Supply (Power).csv',
    'Inelastic Demand (Linear).csv',
    'Inelastic Demand (Log).csv',
    'Inelastic Supply (Linear).csv',
    'Noisy (Linear).csv',
] as const;

export type PresetFile = typeof PRESET_FILES[number];

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
