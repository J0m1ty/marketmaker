import { Container, Graphics } from 'pixi.js';
import { createDashedLine } from './dashed-line';
import { findQuantityAtPriceAnalytical } from '@/lib/economics-utils';
import { constrain, map } from '@/lib/utils';
import type { Result } from 'regression';
import type { CurveFitType } from '@/lib/types';
import { createIntegrationFunction } from '@/lib/regression-utils';

interface PriceFloorParams {
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
    range: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    theme: 'light' | 'dark';
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
    floor: number;
    originalSurplus: number;
    equilibriumContainer: Container;
    controlContainer: Container;
    updateAdjustmentResult: (result: {
        price: number;
        quantity_demanded: number;
        quantity_supplied: number;
        consumer_surplus: number;
        producer_surplus: number;
        total_surplus: number;
        deadweight_loss: number;
    }) => void;
}

type PriceFloorResult = {
    intersects: boolean;
    floorLine: Graphics;
};

export const createPriceFloor = ({
    price,
    quantity,
    floor,
    view: { left, right, top, bottom },
    bounds,
    range,
    theme,
    demand,
    supply,
    originalSurplus,
    equilibriumContainer,
    controlContainer,
    updateAdjustmentResult,
}: PriceFloorParams): PriceFloorResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const floorScreenY = constrain(bottom - map(floor, bounds.priceMin, bounds.priceMax, 0, bottom - top), top, bottom);

    const floorLine = new Graphics()
        .moveTo(left, floorScreenY)
        .lineTo(right, floorScreenY)
        .stroke({
            color,
            width: 2,
        })
        .rect(left, floorScreenY - 10, right - left, 20)
        .fill({
            alpha: 0,
        });

    floorLine.eventMode = 'static';
    floorLine.cursor = 'ns-resize';

    controlContainer.addChild(floorLine);

    if (floor <= price) {
        return { intersects: false, floorLine };
    }
    const qd = findQuantityAtPriceAnalytical(floor, demand.result, demand.fit, range);
    const qs = findQuantityAtPriceAnalytical(floor, supply.result, supply.fit, range);

    if (!qd || !qs || qd < 0 || qs < 0) {
        return { intersects: false, floorLine };
    }

    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const consumerSurplus = demandIntegral(demand.range.quantityMin, qd) - floor * (qd - demand.range.quantityMin);
    const producerSurplus = floor * (qd - supply.range.quantityMin) - supplyIntegral(supply.range.quantityMin, qd);
    const totalSurplus = consumerSurplus + producerSurplus;
    const deadweightLoss = originalSurplus - totalSurplus;

    const qdScreenX = map(qd, bounds.quantityMin, bounds.quantityMax, left, right);
    if (qdScreenX > left && qdScreenX < right) {
        const demandLine = createDashedLine({
            startX: qdScreenX,
            startY: bottom,
            endX: qdScreenX,
            endY: floorScreenY,
            color,
            alpha: 0.5,
        });
        equilibriumContainer.addChild(demandLine);

        const demandIntersection = new Graphics().circle(qdScreenX, floorScreenY, 4).fill({ color });
        controlContainer.addChild(demandIntersection);
    }

    const qsScreenX = map(qs, bounds.quantityMin, bounds.quantityMax, left, right);
    if (qsScreenX > left && qsScreenX < right) {
        const supplyLine = createDashedLine({
            startX: qsScreenX,
            startY: bottom,
            endX: qsScreenX,
            endY: floorScreenY,
            color,
            alpha: 0.5,
        });
        equilibriumContainer.addChild(supplyLine);

        const supplyIntersection = new Graphics().circle(qsScreenX, floorScreenY, 4).fill({ color });
        controlContainer.addChild(supplyIntersection);
    }

    const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);
    const supplyMinScreenX = map(supply.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

    if (demand.points.length >= 2) {
        const consumerSurplusGraphics = new Graphics();

        const relevantDemandPoints = demand.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX <= qd;
        });

        if (relevantDemandPoints.length >= 2) {
            consumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), floorScreenY);

            for (const point of relevantDemandPoints) {
                consumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            consumerSurplusGraphics.closePath();

            consumerSurplusGraphics.fill({
                color: demand.color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(consumerSurplusGraphics);
        }
    }

    if (supply.points.length >= 2) {
        const producerSurplusGraphics = new Graphics();

        const relevantSupplyPoints = supply.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX <= qd;
        });

        if (relevantSupplyPoints.length >= 2) {
            producerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), floorScreenY);
            producerSurplusGraphics.lineTo(qdScreenX, floorScreenY);

            for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantSupplyPoints[i];
                producerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            producerSurplusGraphics.closePath();

            producerSurplusGraphics.fill({
                color: supply.color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(producerSurplusGraphics);
        }
    }

    if (qd !== qs && qd < quantity) {
        const dwlGraphics = new Graphics();

        const demandPointsInDWL = demand.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX >= qd && dataX <= quantity;
        });

        const supplyPointsInDWL = supply.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX >= qd && dataX <= quantity;
        });

        if (demandPointsInDWL.length >= 2 && supplyPointsInDWL.length >= 2) {
            dwlGraphics.moveTo(qdScreenX, floorScreenY);

            for (const point of demandPointsInDWL) {
                dwlGraphics.lineTo(point.x, Math.min(bottom, Math.max(top, point.y)));
            }

            for (let i = supplyPointsInDWL.length - 1; i >= 0; i--) {
                const point = supplyPointsInDWL[i];
                dwlGraphics.lineTo(point.x, Math.min(bottom, Math.max(top, point.y)));
            }

            dwlGraphics.closePath();

            dwlGraphics.fill({
                color,
                alpha: 0.2,
            });
            equilibriumContainer.addChild(dwlGraphics);
        }
    }

    updateAdjustmentResult({
        price: floor,
        quantity_demanded: qd,
        quantity_supplied: qs,
        consumer_surplus: consumerSurplus,
        producer_surplus: producerSurplus,
        total_surplus: totalSurplus,
        deadweight_loss: deadweightLoss,
    });

    return {
        intersects: true,
        floorLine,
    };
};
