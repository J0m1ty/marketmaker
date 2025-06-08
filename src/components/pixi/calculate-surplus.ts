import { createIntegrationFunction } from '@/lib/regression-utils';
import type { CurveFitType } from '@/lib/types';
import { map } from '@/lib/utils';
import { Graphics, type Container } from 'pixi.js';
import type { Result } from 'regression';

interface SurplusParams {
    price: number;
    quantity: number;
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    bounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    demand: {
        points: { x: number; y: number }[];
        result: Result;
        fit: CurveFitType;
        color: string;
        range: {
            priceMin: number;
            priceMax: number;
            quantityMin: number;
            quantityMax: number;
        };
    };
    supply: {
        points: { x: number; y: number }[];
        result: Result;
        fit: CurveFitType;
        color: string;
        range: {
            priceMin: number;
            priceMax: number;
            quantityMin: number;
            quantityMax: number;
        };
    };
    container: Container;
    render: boolean;
}

type SurplusResult = {
    consumerSurplus: number;
    producerSurplus: number;
    totalSurplus: number;
};

export const calculateSurpluses = ({
    price,
    quantity,
    view: { left, right, top, bottom },
    bounds,
    demand,
    supply,
    container,
    render,
}: SurplusParams): SurplusResult => {
    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const consumerSurplus = demandIntegral(0, quantity) - price * quantity;
    const producerSurplus = price * quantity - supplyIntegral(0, quantity);
    const totalSurplus = consumerSurplus + producerSurplus;

    if (render) {
        const equilibriumScreenX = map(quantity, bounds.quantityMin, bounds.quantityMax, left, right);
        const equilibriumScreenY = map(price, bounds.priceMin, bounds.priceMax, bottom, top);

        const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);
        const supplyMinScreenX = map(supply.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

        const relevantDemandPoints = demand.points.filter((point) => point.x <= equilibriumScreenX);

        if (relevantDemandPoints.length >= 2) {
            const consumerSurplusGraphics = new Graphics();

            consumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), equilibriumScreenY);

            for (const point of relevantDemandPoints) {
                consumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            consumerSurplusGraphics.lineTo(equilibriumScreenX, equilibriumScreenY);
            consumerSurplusGraphics.closePath();

            consumerSurplusGraphics.fill({
                color: demand.color,
                alpha: 0.3,
            });

            container.addChild(consumerSurplusGraphics);
        }

        const relevantSupplyPoints = supply.points.filter((point) => point.x <= equilibriumScreenX);

        if (relevantSupplyPoints.length >= 2) {
            const producerSurplusGraphics = new Graphics();

            producerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), equilibriumScreenY);
            producerSurplusGraphics.lineTo(equilibriumScreenX, equilibriumScreenY);

            for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantSupplyPoints[i];
                producerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            producerSurplusGraphics.closePath();

            producerSurplusGraphics.fill({
                color: supply.color,
                alpha: 0.3,
            });

            container.addChild(producerSurplusGraphics);
        }
    }

    return {
        consumerSurplus,
        producerSurplus,
        totalSurplus,
    };
};
