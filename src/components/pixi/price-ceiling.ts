import { Container, Graphics } from 'pixi.js';
import { createDashedLine } from './dashed-line';
import { findQuantityAtPriceAnalytical } from '@/lib/economics-utils';
import { map } from '@/lib/utils';
import type { Result } from 'regression';
import type { CurveFitType } from '@/lib/types';
import { createIntegrationFunction } from '@/lib/regression-utils';

interface PriceCeilingParams {
    price: number;
    quantity: number;
    ceiling: number;
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

type PriceCeilingResult = {
    intersects: boolean;
    ceilingLine: Graphics;
};

export const createPriceCeiling = ({
    price,
    quantity,
    ceiling,
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
}: PriceCeilingParams): PriceCeilingResult => {
    const { left, right, top, bottom } = view;

    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const ceilingScreenY = Math.max(
        Math.min(bottom - map(ceiling, bounds.priceMin, bounds.priceMax, 0, bottom - top), bottom),
        top
    );

    const ceilingLine = new Graphics().moveTo(left, ceilingScreenY).lineTo(right, ceilingScreenY).stroke({
        color,
        width: 2,
    }).rect(left, ceilingScreenY - 10, right - left, 20).fill({
        alpha: 0
    });

    ceilingLine.eventMode = 'static';
    ceilingLine.cursor = 'ns-resize';

    controlContainer.addChild(ceilingLine);

    if (ceiling >= price) {
        return { intersects: false, ceilingLine };
    }

    const qd = findQuantityAtPriceAnalytical(ceiling, demand.result, demand.fit, absoluteBounds);
    const qs = findQuantityAtPriceAnalytical(ceiling, supply.result, supply.fit, absoluteBounds);

    if (!qd || !qs || qd < 0 || qs < 0) {
        return { intersects: false, ceilingLine };
    }

    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const consumerSurplus = demandIntegral(0, qs) - ceiling * qs;
    const producerSurplus = ceiling * qs - supplyIntegral(0, qs);
    const totalSurplus = consumerSurplus + producerSurplus;
    const deadweightLoss = originalSurplus - totalSurplus;

    const qdScreenX = map(qd, bounds.quantityMin, bounds.quantityMax, left, right);
    if (qdScreenX > left && qdScreenX < right) {
        const demandLine = createDashedLine({
            startX: qdScreenX,
            startY: bottom,
            endX: qdScreenX,
            endY: ceilingScreenY,
            color,
            alpha: 0.5,
        });
        equilibriumContainer.addChild(demandLine);

        const demandIntersection = new Graphics().circle(qdScreenX, ceilingScreenY, 4).fill({ color });
        controlContainer.addChild(demandIntersection);
    }

    const qsScreenX = map(qs, bounds.quantityMin, bounds.quantityMax, left, right);
    if (qsScreenX > left && qsScreenX < right) {
        const supplyLine = createDashedLine({
            startX: qsScreenX,
            startY: bottom,
            endX: qsScreenX,
            endY: ceilingScreenY,
            color,
            alpha: 0.5,
        });
        equilibriumContainer.addChild(supplyLine);

        const supplyIntersection = new Graphics().circle(qsScreenX, ceilingScreenY, 4).fill({ color });
        controlContainer.addChild(supplyIntersection);
    }

    const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);
    const supplyMinScreenX = map(supply.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

    if (demand.points.length >= 2) {
        const consumerSurplusGraphics = new Graphics();

        const relevantDemandPoints = demand.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX <= qs;
        });

        if (relevantDemandPoints.length >= 2) {
            consumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), ceilingScreenY);

            for (const point of relevantDemandPoints) {
                consumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            consumerSurplusGraphics.lineTo(qsScreenX, ceilingScreenY);
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
            return dataX <= qs;
        });

        if (relevantSupplyPoints.length >= 2) {
            const quantityTransactedScreenX = map(qs, bounds.quantityMin, bounds.quantityMax, left, right);
            
            producerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), ceilingScreenY);
            producerSurplusGraphics.lineTo(quantityTransactedScreenX, ceilingScreenY);

            for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantSupplyPoints[i];
                producerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            producerSurplusGraphics.lineTo(Math.max(supplyMinScreenX, left), bottom);
            producerSurplusGraphics.closePath();

            producerSurplusGraphics.fill({
                color: supply.color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(producerSurplusGraphics);
        }
    }

    if (qd !== qs && qs < quantity) {
        const dwlGraphics = new Graphics();

        const demandPointsInDWL = demand.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) +
                bounds.quantityMin;
            return dataX >= qs && dataX <= quantity;
        });

        const supplyPointsInDWL = supply.points.filter((point) => {
            const dataX =
                ((point.x - left) / (right - left)) * (bounds.quantityMax - bounds.quantityMin) +
                bounds.quantityMin;
            return dataX >= qs && dataX <= quantity;
        });

        if (demandPointsInDWL.length >= 2 && supplyPointsInDWL.length >= 2) {
            const quantityTransactedScreenX = map(qs, bounds.quantityMin, bounds.quantityMax, left, right);
            dwlGraphics.moveTo(quantityTransactedScreenX, ceilingScreenY);

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
        price: ceiling,
        quantity_demanded: qd,
        quantity_supplied: qs,
        consumer_surplus: consumerSurplus,
        producer_surplus: producerSurplus,
        total_surplus: totalSurplus,
        deadweight_loss: deadweightLoss,
    });

    return {
        intersects: true,
        ceilingLine,
    };
};