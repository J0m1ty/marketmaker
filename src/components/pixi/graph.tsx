import { useApplication } from '@pixi/react';
import { useResolvedTheme } from '../theme-provider';
import { useResize } from './resize-provider';
import { useCallback, useEffect } from 'react';
import { Container, Graphics, Text } from 'pixi.js';
import { useMarketTabsStore } from '@/hooks/markets.store';

export const Graph = () => {
    const { width, height } = useResize();
    const theme = useResolvedTheme();
    const { getActiveTab } = useMarketTabsStore();
    const { app, isInitialised } = useApplication();

    if (!isInitialised) return null;

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const display = useCallback(() => {
        if (!app) return;
        console.log('display');

        app.stage.removeChildren();
        
        const margin = 35;
        const ticks = 9;
        const tickLength = 5;
        const left = margin;
        const right = width - margin;
        const top = margin;
        const bottom = height - margin;
        const color = theme === 'dark' ? 0xffffff : 0x000000;
        
        const axisContainer = new Container();
        
        // X-axis
        const xAxis = new Graphics();
        xAxis.moveTo(left, bottom).lineTo(right + 1, bottom).stroke({ 
            color, 
            width: 2 
        });

        // X-axis ticks
        const xTicks = new Graphics();
        for (let i = 0; i <= ticks; i++) {
            const x = left + (i / ticks) * (right - left);
            xTicks.moveTo(x, bottom).lineTo(x, bottom + tickLength).stroke({
                color,
                width: 2
            });
        }

        // Y-axis
        const yAxis = new Graphics();
        yAxis.moveTo(left, top - 1).lineTo(left, bottom).stroke({ 
            color, 
            width: 2 
        });

        // Y-axis ticks
        const yTicks = new Graphics();
        for (let i = 0; i <= ticks; i++) {
            const y = bottom - (i / ticks) * (bottom - top);
            yTicks.moveTo(left - tickLength, y).lineTo(left, y).stroke({
                color,
                width: 2
            });
        }

        // Axis labels
        const quantityLabel = new Text({
            text: 'Quantity',
            style: {
                fontFamily: 'Comfortaa',
                fontSize: 14,
                fill: color,
            }
        });
        quantityLabel.anchor.set(0.5, 0);
        quantityLabel.x = (left + right) / 2;
        quantityLabel.y = bottom + tickLength + 10;

        const priceLabel = new Text({
            text: 'Price',
            style: {
                fontFamily: 'Comfortaa',
                fontSize: 14,
                fill: color,
            }
        });
        priceLabel.anchor.set(0.5, 0.5);
        priceLabel.angle = -90;
        priceLabel.x = left - tickLength - 15;
        priceLabel.y = (top + bottom) / 2;

        axisContainer.addChild(xAxis);
        axisContainer.addChild(yAxis);
        axisContainer.addChild(xTicks);
        axisContainer.addChild(yTicks);
        axisContainer.addChild(quantityLabel);
        axisContainer.addChild(priceLabel);

        app.stage.addChild(axisContainer);
    }, [app, width, height, theme, activeTab]);

    useEffect(() => {
        display();
    }, [display]);

    return null;
};
