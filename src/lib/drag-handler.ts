import { Graphics, Application } from 'pixi.js';

interface DragConfig {
    target: Graphics;
    app: Application;
    direction: 'horizontal' | 'vertical' | 'both';
    bounds: {
        min: number;
        max: number;
        screenMin: number;
        screenMax: number;
    };
    onDrag: (value: number) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    cursor?: string;
}

export const setupDragHandler = (config: DragConfig) => {
    const { target, app, direction, bounds, onDrag, onDragStart, onDragEnd, cursor = 'move' } = config;
    let isDragging = false;

    const onDragMove = (event: any) => {
        if (!isDragging) return;

        const coord = direction === 'vertical' ? event.global.y : event.global.x;
        const clampedCoord = Math.max(bounds.screenMin, Math.min(bounds.screenMax, coord));

        const normalizedPos = (clampedCoord - bounds.screenMin) / (bounds.screenMax - bounds.screenMin);
        const value =
            direction === 'vertical' ?
                bounds.max - normalizedPos * (bounds.max - bounds.min)
            :   bounds.min + normalizedPos * (bounds.max - bounds.min);

        const clampedValue = Math.max(bounds.min, Math.min(bounds.max, value));
        onDrag(clampedValue);
    };

    const handleDragStart = () => {
        target.alpha = 0.7;
        isDragging = true;
        app.stage.cursor = cursor;
        onDragStart?.();
    };

    const handleDragEnd = () => {
        if (isDragging) {
            app.stage.cursor = 'default';
            target.alpha = 1;
            isDragging = false;
            onDragEnd?.();
        }
    };

    // Add all listeners upfront
    target.on('pointerdown', handleDragStart);
    app.stage.on('pointermove', onDragMove);
    app.stage.on('pointerup', handleDragEnd);
    app.stage.on('pointerupoutside', handleDragEnd);

    return () => {
        target.off('pointerdown', handleDragStart);
        app.stage.off('pointermove', onDragMove);
        app.stage.off('pointerup', handleDragEnd);
        app.stage.off('pointerupoutside', handleDragEnd);
    };
};
