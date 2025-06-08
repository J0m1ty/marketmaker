import { findIntersectionAnalytical } from '@/lib/economics-utils';
import { map } from '@/lib/utils';
import { Container, Graphics } from 'pixi.js';
import type { MergedUnion } from 'ts-safe-union';
import { createDashedLine } from './dashed-line';
import type { Result } from 'regression';
import type { CurveFitType } from '@/lib/types';

interface EquilibrumParams {
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
    bounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    range: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    theme: 'dark' | 'light';
    demand: { result: Result, fit: CurveFitType };
    supply: { result: Result, fit: CurveFitType };
    container: Container;
    render: boolean;
    passive: boolean;
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
    bounds,
    range,
    theme,
    demand,
    supply,
    container,
    render,
    passive,
}: EquilibrumParams): EquilibriumResult => {
    const intersection = findIntersectionAnalytical(demand.result, demand.fit, supply.result, supply.fit, range);

    if (intersection && render) {
        const color = theme === 'dark' ? 0xffffff : 0x000000;

        const screenX = map(intersection.x, bounds.quantityMin, bounds.quantityMax, left, right);
        const screenY = map(intersection.y, bounds.priceMin, bounds.priceMax, bottom, top);

        const intersectionGraphic = new Graphics();
        intersectionGraphic.circle(screenX, screenY, 4).fill({ color, alpha: passive ? 0.6 : 1 });
        container.addChild(intersectionGraphic);

        if (passive) {
            const priceLine = createDashedLine({
                startX: left,
                startY: screenY,
                endX: screenX,
                endY: screenY,
                color,
                alpha: 0.5
            });
            container.addChild(priceLine);

            const quantityLine = createDashedLine({
                startX: screenX,
                startY: screenY,
                endX: screenX,
                endY: bottom,
                color,
                alpha: 0.5
            });
            container.addChild(quantityLine);
        } else {
            const equilibriumPriceLine = new Graphics();
            equilibriumPriceLine
                .moveTo(left, screenY)
                .lineTo(screenX, screenY)
                .stroke({ color, width: 2, alpha: 0.5 });
            container.addChild(equilibriumPriceLine);

            const equilibriumQuantityLine = new Graphics();
            equilibriumQuantityLine
                .moveTo(screenX, screenY)
                .lineTo(screenX, bottom)
                .stroke({ color, width: 2, alpha: 0.5 });
            container.addChild(equilibriumQuantityLine);
        }
    }

    if (intersection) {
        return {
            intersect: true,
            price: intersection.y,
            quantity: intersection.x,
        };
    }

    return { intersect: false };
};
