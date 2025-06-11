import { Application } from '@pixi/react';
import { useRef, useState } from 'react';
import { ResizeProvider } from './pixi/resize-provider';
import { Graph } from './pixi/graph';
import { Camera } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export function Simulation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [appInstance, setAppInstance] = useState<any>(null);

    const handleSaveImage = async () => {
        if (!appInstance) {
            toast.error('Canvas not ready for export');
            return;
        }

        try {
            const canvas = await appInstance.renderer.extract.canvas(appInstance.stage);
            const link = document.createElement('a');
            link.download = `market-graph-${new Date().getTime()}.png`;
            link.href = canvas.toDataURL();
            link.click();
            toast.success('Graph saved successfully!');
        } catch (error) {
            console.error('Error saving image:', error);
            toast.error('Failed to save graph');
        }
    };

    return (
        <div
            className='w-full aspect-square min-w-0 relative lg:aspect-auto lg:h-full'
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Application
                className='absolute inset-0'
                autoStart
                antialias={false}
                autoDensity
                resolution={2}
                preference='webgpu'
                resizeTo={containerRef}
                defaultTextStyle={{
                    fontFamily: ['Comfortaa', 'sans-serif'],
                    fontSize: 16,
                }}
                onInit={(app) => {
                    console.log('pixi.js application initialized');
                    setAppInstance(app);
                }}
            >
                <ResizeProvider observe={containerRef}>
                    <Graph />
                </ResizeProvider>
            </Application>

            {isHovered && (
                <div className='absolute top-5 right-5 z-10'>
                    <Button
                        variant='secondary'
                        size='sm'
                        onClick={handleSaveImage}
                        className='size-10 bg-muted/10 backdrop-blur-sm border shadow-lg hover:bg-background/100 transition-all duration-200'
                    >
                        <Camera className='h-4 w-4' />
                    </Button>
                </div>
            )}
        </div>
    );
}
