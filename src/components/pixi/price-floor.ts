import { Container, Graphics } from 'pixi.js';
import type { MergedUnion } from 'ts-safe-union';
import { createDashedLine } from './dashed-line';
import { findQuantityAtPriceAnalytical } from '@/lib/economics-utils';
import { map } from '@/lib/utils';
import type { Result } from 'regression';
import type { CurveFitType } from '@/lib/types';
import { createIntegrationFunction } from '@/lib/regression-utils';

interface PriceFloorParams {
    price: number;
    quantity: number;
    floor: number;
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
    absoluteBounds: {
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
    view,
    bounds,
    absoluteBounds,
    theme,
    demand,
    supply,
    originalSurplus,
    equilibriumContainer,
    controlContainer,
    updateAdjustmentResult,
}: PriceFloorParams): PriceFloorResult => {
    const { left, right, top, bottom } = view;

    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const floorScreenY = Math.max(
        Math.min(bottom - map(floor, bounds.priceMin, bounds.priceMax, 0, bottom - top), bottom),
        top
    );

    const floorLine = new Graphics().moveTo(left, floorScreenY).lineTo(right, floorScreenY).stroke({
        color,
        width: 2,
    });

    floorLine.eventMode = 'static';
    floorLine.cursor = 'ns-resize';

    controlContainer.addChild(floorLine);

    if (floor <= price) {
        return { intersects: false, floorLine };
    }
    const qd = findQuantityAtPriceAnalytical(floor, demand.result, demand.fit, absoluteBounds);
    const qs = findQuantityAtPriceAnalytical(floor, supply.result, supply.fit, absoluteBounds);

    if (!qd || !qs || qd < 0 || qs < 0) {
        return { intersects: false, floorLine };
    }

    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const consumerSurplus = demandIntegral(0, qd) - floor * qd;
    const producerSurplus = floor * qd - supplyIntegral(0, qd);
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
            const sortedDemandPoints = relevantDemandPoints.sort((a, b) => a.x - b.x);

            consumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), floorScreenY);
            consumerSurplusGraphics.lineTo(Math.max(demandMinScreenX, left), top);

            for (const point of sortedDemandPoints) {
                consumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            consumerSurplusGraphics.lineTo(qdScreenX, floorScreenY);
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
            const sortedSupplyPoints = relevantSupplyPoints.sort((a, b) => a.x - b.x);

            producerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), floorScreenY);
            producerSurplusGraphics.lineTo(qdScreenX, floorScreenY);

            for (let i = sortedSupplyPoints.length - 1; i >= 0; i--) {
                const point = sortedSupplyPoints[i];
                producerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            producerSurplusGraphics.lineTo(Math.max(supplyMinScreenX, left), bottom);
            producerSurplusGraphics.closePath();
        } else {
            producerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), floorScreenY);
            producerSurplusGraphics.lineTo(Math.max(qdScreenX, supplyMinScreenX), floorScreenY);
            producerSurplusGraphics.lineTo(Math.max(qdScreenX, supplyMinScreenX), bottom);
            producerSurplusGraphics.lineTo(Math.max(supplyMinScreenX, left), bottom);
            producerSurplusGraphics.closePath();
        }

        producerSurplusGraphics.fill({
            color: supply.color,
            alpha: 0.3,
        });

        equilibriumContainer.addChild(producerSurplusGraphics);
        if (qd !== qs && qd < quantity) {
            const dwlGraphics = new Graphics();

            const demandPointsInDWL = demand.points.filter((point) => {
                const dataX =
                    ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) +
                    bounds.quantityMin;
                return dataX >= qd && dataX <= quantity;
            });

            const supplyPointsInDWL = supply.points.filter((point) => {
                const dataX =
                    ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) +
                    bounds.quantityMin;
                return dataX >= qd && dataX <= quantity;
            });

            if (demandPointsInDWL.length >= 2 && supplyPointsInDWL.length >= 2) {
                const sortedDemandPoints = demandPointsInDWL.sort((a, b) => a.x - b.x);
                const sortedSupplyPoints = supplyPointsInDWL.sort((a, b) => a.x - b.x);

                dwlGraphics.moveTo(qdScreenX, floorScreenY);

                // Follow demand curve
                for (const point of sortedDemandPoints) {
                    dwlGraphics.lineTo(point.x, point.y);
                }

                // Follow supply curve back
                for (let i = sortedSupplyPoints.length - 1; i >= 0; i--) {
                    const point = sortedSupplyPoints[i];
                    dwlGraphics.lineTo(point.x, point.y);
                }

                dwlGraphics.closePath();

                dwlGraphics.fill({
                    color,
                    alpha: 0.2,
                });
                equilibriumContainer.addChild(dwlGraphics);
            }
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
