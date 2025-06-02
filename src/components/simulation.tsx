import { Application, useExtend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useRef } from 'react';
import { ResizeProvider } from './pixi/resize-provider';
import { Graph } from './pixi/graph';

export function Simulation() {
    useExtend({ Container, Graphics, Text });

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            className='w-full aspect-square min-w-0 relative lg:aspect-auto lg:h-full'
            ref={containerRef}
        >
            <Application
                className="absolute inset-0"
                autoStart
                antialias
                autoDensity
                preference='webgpu'
                backgroundAlpha={0}
                resizeTo={containerRef}
                defaultTextStyle={{
                    fontFamily: ['Comfortaa', 'sans-serif'],
                    fontSize: 16,
                }}
                onInit={() => {
                    console.log('pixi.js application initialized');
                }}
            >
                <ResizeProvider observe={containerRef}>
                    <Graph />
                </ResizeProvider>
            </Application>
        </div>
    );
}
