import { findIntersectionAnalytical } from '@/lib/economics-utils';
import { createIntegrationFunction, createEquationFunction } from '@/lib/regression-utils';
import type { CurveFitType } from '@/lib/types';
import { map } from '@/lib/utils';
import { Graphics, type Container } from 'pixi.js';
import type { Result } from 'regression';
import { createCurve } from './create-curve';

interface SupplyShiftParams {
    originalPrice: number;
    originalQuantity: number;
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
    bold: boolean;
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
    shiftAmount: number;
    originalSurplus: number;
    equilibriumContainer: Container;
    updateAdjustmentResult: (result: {
        equilibrium_price: number;
        equilibrium_quantity: number;
        consumer_surplus: number;
        producer_surplus: number;
        total_surplus: number;
        deadweight_loss: number;
    }) => void;
}

type SupplyShiftResult = {
    intersects: boolean;
};

const createShiftedSupplyEquation = (originalResult: Result, fitType: CurveFitType, shiftAmount: number) => {
    const originalEquation = createEquationFunction(originalResult, fitType);
    return (x: number) => originalEquation(x - shiftAmount);
};

export const createSupplyShift = ({
    originalPrice,
    originalQuantity,
    view: { left, right, top, bottom },
    bounds,
    range,
    theme,
    bold,
    demand,
    supply,
    shiftAmount,
    originalSurplus,
    equilibriumContainer,
    updateAdjustmentResult,
}: SupplyShiftParams): SupplyShiftResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;

    const shiftedEquation = createShiftedSupplyEquation(supply.result, supply.fit, shiftAmount);

    const shiftedData = supply.result.points.map(([x, _]) => {
        return [x, shiftedEquation(x)] as [number, number];
    });

    const { success, result, points } = createCurve({
        view: { left, right, top, bottom },
        bounds,
        range,
        curve: {
            bold,
            data: shiftedData,
            fit: supply.fit,
            color: supply.color,
        },
        container: equilibriumContainer,
        render: true,
        passive: false,
    });

    if (!success) {
        return { intersects: false };
    }

    const newEquilibrium = findIntersectionAnalytical(demand.result, demand.fit, result, supply.fit, range);

    if (!newEquilibrium) {
        return { intersects: false };
    }

    const { x: newQuantity, y: newPrice } = newEquilibrium;

    const newEquilibriumScreenX = map(newQuantity, bounds.quantityMin, bounds.quantityMax, left, right);
    const newEquilibriumScreenY = map(newPrice, bounds.priceMin, bounds.priceMax, bottom, top);
    
    const newPriceLine = new Graphics()
        .moveTo(left, newEquilibriumScreenY)
        .lineTo(newEquilibriumScreenX, newEquilibriumScreenY)
        .stroke({
            color,
            width: 2,
            alpha: 0.7,
        });
    equilibriumContainer.addChild(newPriceLine);

    const newQuantityLine = new Graphics()
        .moveTo(newEquilibriumScreenX, newEquilibriumScreenY)
        .lineTo(newEquilibriumScreenX, bottom)
        .stroke({
            color,
            width: 2,
            alpha: 0.7,
        });
    equilibriumContainer.addChild(newQuantityLine);

    const newEquilibriumPoint = new Graphics()
        .circle(newEquilibriumScreenX, newEquilibriumScreenY, 5)
        .fill({ color: supply.color });
    equilibriumContainer.addChild(newEquilibriumPoint);

    const originalEquilibriumScreenX = map(originalQuantity, bounds.quantityMin, bounds.quantityMax, left, right);
    const originalEquilibriumScreenY = map(originalPrice, bounds.priceMin, bounds.priceMax, bottom, top);

    const originalEquilibriumPoint = new Graphics()
        .circle(originalEquilibriumScreenX, originalEquilibriumScreenY, 4)
        .fill({ color, alpha: 0.3 });
    equilibriumContainer.addChild(originalEquilibriumPoint);

    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(result, supply.fit);

    const newConsumerSurplus =
        demandIntegral(demand.range.quantityMin, newQuantity) - newPrice * (newQuantity - demand.range.quantityMin);
    const newProducerSurplus =
        newPrice * (newQuantity - supply.range.quantityMin) - supplyIntegral(supply.range.quantityMin, newQuantity);
    const newTotalSurplus = newConsumerSurplus + newProducerSurplus;
    const deadweightLoss = originalSurplus - newTotalSurplus;

    if (demand.points.length >= 2 && supply.points.length >= 2) {
        const newConsumerSurplusGraphics = new Graphics();
        const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

        const relevantDemandPoints = demand.points.filter((point) => point.x <= newEquilibriumScreenX);

        if (relevantDemandPoints.length >= 2) {
            newConsumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), newEquilibriumScreenY);

            for (const point of relevantDemandPoints) {
                newConsumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            newConsumerSurplusGraphics.lineTo(newEquilibriumScreenX, newEquilibriumScreenY);
            newConsumerSurplusGraphics.closePath();

            newConsumerSurplusGraphics.fill({
                color: demand.color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(newConsumerSurplusGraphics);
        }

        const newProducerSurplusGraphics = new Graphics();
        const supplyMinScreenX = map(supply.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

        const relevantShiftedSupplyPoints = points.filter((point) => point.x <= newEquilibriumScreenX);

        if (relevantShiftedSupplyPoints.length >= 2) {
            newProducerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), newEquilibriumScreenY);
            newProducerSurplusGraphics.lineTo(newEquilibriumScreenX, newEquilibriumScreenY);

            for (let i = relevantShiftedSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantShiftedSupplyPoints[i];
                newProducerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            newProducerSurplusGraphics.closePath();

            newProducerSurplusGraphics.fill({
                color: supply.color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(newProducerSurplusGraphics);
        }
    }

    updateAdjustmentResult({
        equilibrium_price: newPrice,
        equilibrium_quantity: newQuantity,
        consumer_surplus: newConsumerSurplus,
        producer_surplus: newProducerSurplus,
        total_surplus: newTotalSurplus,
        deadweight_loss: deadweightLoss,
    });

    return {
        intersects: true,
    };
};
