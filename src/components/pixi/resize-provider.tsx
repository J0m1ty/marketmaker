import { useApplication } from '@pixi/react';
import { createContext, useContext, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';

interface ResizeState {
    width: number;
    height: number;
}

interface ResizeProviderProps {
    observe: RefObject<HTMLElement | null>;
    children: ReactNode;
}

const ResizeContext = createContext<ResizeState | null>(null);

export const useResize = () => {
    const context = useContext(ResizeContext);
    if (!context) throw new Error('useResize must be used within a ResizeProvider');
    return context;
};

export const ResizeProvider = ({ observe, children }: ResizeProviderProps) => {
    const [size, setSize] = useState<ResizeState>({ width: 0, height: 0 });
    const { app, isInitialised } = useApplication();

    useLayoutEffect(() => {
        if (!isInitialised || !observe.current) return;

        const observer = new ResizeObserver(() => app.resize());
        observer.observe(observe.current);

        const listener = (width: number, height: number) => {
            setSize({ width, height });
        };

        app.renderer.addListener('resize', listener);

        return () => {
            observer.disconnect();
            app.renderer.removeListener('resize', listener);
        };
    }, [app, isInitialised, observe]);

    if (size.width === 0 || size.height === 0) return null;

    return <ResizeContext.Provider value={size}>{children}</ResizeContext.Provider>;
};
