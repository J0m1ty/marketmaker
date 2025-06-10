import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, FolderOpen } from 'lucide-react';
import { PRESET_FILES, type PresetFile, handlePresetLoad } from '@/lib/preset-loader';
import type { Market } from '@/lib/types';

interface PresetSelectorProps {
    onPresetLoad: (market: Market) => boolean | void;
    children?: React.ReactNode;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onPresetLoad, children }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelectPreset = async (presetName: PresetFile) => {
        setLoading(presetName);
        try {
            await handlePresetLoad(presetName, onPresetLoad);
            setOpen(false);
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="w-full justify-start">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open Preset
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Open Preset</DialogTitle>
                    <DialogDescription>
                        Choose from the available market presets to get started quickly.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96" type='always'>
                    <div className="space-y-2">
                        {PRESET_FILES.map((presetName) => (
                            <Button
                                key={presetName}
                                variant="ghost"
                                className="w-full justify-start h-auto p-3 text-left"
                                onClick={() => handleSelectPreset(presetName)}
                                disabled={loading === presetName}
                            >
                                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium">
                                        {presetName.replace('.csv', '')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {presetName}
                                    </div>
                                </div>
                                {loading === presetName && (
                                    <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                )}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
