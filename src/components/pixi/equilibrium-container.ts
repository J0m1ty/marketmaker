import { findIntersection } from '@/lib/economics-utils';
import { Container, Graphics } from 'pixi.js';
import type { MergedUnion } from 'ts-safe-union';
import { createDashedLine } from './dashed-line';

interface EquilibrumParams {
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
    theme: 'dark' | 'light';
    demandEquation: (x: number) => number;
    supplyEquation: (x: number) => number;
    bounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    absoluteBounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    render: boolean;
    passive: boolean;
    equilibriumContainer: Container;
}

type EquilibriumResult = MergedUnion<
    {
        intersect: false;
    },
    {
        intersect: true;
        price: number;
        quantity: number;
    }
>;



export const createEquilibrium = ({
    view: { left, right, top, bottom },
    theme,
    demandEquation,
    supplyEquation,
    bounds,
    absoluteBounds,
    render,
    passive,
    equilibriumContainer,
}: EquilibrumParams): EquilibriumResult => {
    const intersection = findIntersection(demandEquation, supplyEquation, absoluteBounds);

    if (intersection) {
        if (
            render
            && intersection.x >= bounds.quantityMin
            && intersection.x <= bounds.quantityMax
            && intersection.y >= bounds.priceMin
            && intersection.y <= bounds.priceMax
        ) {
            const color = theme === 'dark' ? 0xffffff : 0x000000;

            const intersectionGraphic = new Graphics();
            const screenX =
                left + ((intersection.x - bounds.quantityMin) / (bounds.quantityMax - bounds.quantityMin)) * (right - left);
            const screenY =
                bottom - ((intersection.y - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * (bottom - top);

            intersectionGraphic.circle(screenX, screenY, 4).fill({ color, alpha: passive ? 0.6 : 1 });
            equilibriumContainer.addChild(intersectionGraphic);

            if (passive) {
                const priceLine = createDashedLine({
                    startX: left,
                    startY: screenY,
                    endX: screenX,
                    endY: screenY,
                    color,
                    alpha: 0.5
                });
                equilibriumContainer.addChild(priceLine);
                
                const quantityLine = createDashedLine({
                    startX: screenX,
                    startY: screenY,
                    endX: screenX,
                    endY: bottom,
                    color,
                    alpha: 0.5
                });
                equilibriumContainer.addChild(quantityLine);
            } else {

                const equilibriumPriceLine = new Graphics();
                equilibriumPriceLine
                    .moveTo(left, screenY)
                    .lineTo(screenX, screenY)
                    .stroke({ color, width: 2, alpha: 0.5 });
                equilibriumContainer.addChild(equilibriumPriceLine);

                const equilibriumQuantityLine = new Graphics();
                equilibriumQuantityLine
                    .moveTo(screenX, screenY)
                    .lineTo(screenX, bottom)
                    .stroke({ color, width: 2, alpha: 0.5 });
                equilibriumContainer.addChild(equilibriumQuantityLine);
            }
        }

        return {
            intersect: true,
            price: intersection.y,
            quantity: intersection.x,
        };
    }

    return { intersect: false };
};
