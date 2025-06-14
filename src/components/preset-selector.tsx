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
import { FileText, FolderOpen, Copy } from 'lucide-react';
import { PRESET_FILES, type PresetFile, handlePresetLoad, getUrlKeyFromPresetFile } from '@/lib/preset-loader';
import type { Market } from '@/lib/types';
import { toast } from 'sonner';

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

    const handleCopyLink = async (presetName: PresetFile) => {
        const urlKey = getUrlKeyFromPresetFile(presetName);
        const url = `${window.location.origin}/?preset=${urlKey}`;
        
        try {
            await navigator.clipboard.writeText(url);
            toast.success(`Link copied to clipboard!`);
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant='outline' className='w-full justify-start'>
                        <FolderOpen className='mr-2 h-4 w-4' />
                        Open Preset
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className='sm:max-w-md pr-4'>
                <DialogHeader>
                    <DialogTitle>Open Preset</DialogTitle>
                    <DialogDescription>
                        Choose from the available market presets to get started quickly. Or copy to share with others.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className='max-h-96 pr-2' type='hover'>
                    <div className='space-y-2'>
                        {PRESET_FILES.map((presetName) => (
                            <div key={presetName} className='flex items-center flex-row p-3'>
                                <div className='flex items-center flex-1 min-w-0'>
                                    <FileText className='mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground' />
                                    <div className='flex-1 min-w-0'>
                                        <div className='font-medium'>{presetName.replace('.csv', '')}</div>
                                        <div className='text-xs text-muted-foreground'>{presetName}</div>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 ml-3'>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        className='h-8 w-8 p-0 flex-shrink-0'
                                        onClick={() => handleCopyLink(presetName)}
                                        title='Copy link to preset'
                                    >
                                        <Copy className='h-3 w-3' />
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='flex-shrink-0'
                                        onClick={() => handleSelectPreset(presetName)}
                                        disabled={loading === presetName}
                                    >
                                        {loading === presetName ? (
                                            <div className='h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                                        ) : (
                                            'Open'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
