import { findIntersectionAnalytical } from '@/lib/economics-utils';
import { createIntegrationFunction, createEquationFunction } from '@/lib/regression-utils';
import type { CurveFitType } from '@/lib/types';
import { map } from '@/lib/utils';
import { Graphics, type Container } from 'pixi.js';
import type { Result } from 'regression';

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
    demand,
    supply,
    shiftAmount,
    originalSurplus,
    equilibriumContainer,
    updateAdjustmentResult,
}: SupplyShiftParams): SupplyShiftResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;

    const shiftedEquation = createShiftedSupplyEquation(supply.result, supply.fit, shiftAmount);

    const shiftedData: [number, number][] = [];
    const quantityStep = (range.quantityMax - range.quantityMin) / 20;

    for (let q = range.quantityMin; q <= range.quantityMax; q += quantityStep) {
        try {
            const price = shiftedEquation(q);
            if (isFinite(price) && price >= range.priceMin && price <= range.priceMax) {
                shiftedData.push([q, price]);
            }
        } catch (ignored) { }
    }

    const shiftedSupplyResult = {
        ...supply.result,
        points: shiftedData,
    };
    
    const newEquilibrium = findIntersectionAnalytical(
        demand.result,
        demand.fit,
        shiftedSupplyResult,
        supply.fit,
        range
    );

    if (!newEquilibrium) {
        return { intersects: false };
    }

    const { x: newQuantity, y: newPrice } = newEquilibrium;

    const newEquilibriumScreenX = map(newQuantity, bounds.quantityMin, bounds.quantityMax, left, right);
    const newEquilibriumScreenY = map(newPrice, bounds.priceMin, bounds.priceMax, bottom, top);    // Draw solid lines to new equilibrium
    const newPriceLine = new Graphics()
        .moveTo(left, newEquilibriumScreenY)
        .lineTo(newEquilibriumScreenX, newEquilibriumScreenY)
        .stroke({
            color,
            width: 2,
            alpha: 0.7
        });
    equilibriumContainer.addChild(newPriceLine);

    const newQuantityLine = new Graphics()
        .moveTo(newEquilibriumScreenX, newEquilibriumScreenY)
        .lineTo(newEquilibriumScreenX, bottom)
        .stroke({
            color,
            width: 2,
            alpha: 0.7
        });
    equilibriumContainer.addChild(newQuantityLine);

    const shiftedSupplyCurve = new Graphics();
    const viewportWidth = right - left;
    const stepSize = 2;
    const shiftedSupplyPoints: { x: number; y: number }[] = [];

    for (let pixelX = 0; pixelX <= viewportWidth; pixelX += stepSize) {
        const screenX = left + pixelX;
        const dataQuantity = map(pixelX, 0, viewportWidth, bounds.quantityMin, bounds.quantityMax);

        try {
            const shiftedEquation = createShiftedSupplyEquation(supply.result, supply.fit, shiftAmount);
            const dataPrice = shiftedEquation(dataQuantity);

            if (isFinite(dataPrice) && dataQuantity >= supply.range.quantityMin && dataQuantity <= supply.range.quantityMax && dataPrice >= bounds.priceMin && dataPrice <= bounds.priceMax) {
                const screenY = map(dataPrice, bounds.priceMin, bounds.priceMax, bottom, top);
                shiftedSupplyPoints.push({ x: screenX, y: screenY });
            }
        } catch (ignored) {}
    }

    if (shiftedSupplyPoints.length >= 2) {
        shiftedSupplyCurve.moveTo(shiftedSupplyPoints[0].x, shiftedSupplyPoints[0].y);
        for (let i = 1; i < shiftedSupplyPoints.length; i++) {
            shiftedSupplyCurve.lineTo(shiftedSupplyPoints[i].x, shiftedSupplyPoints[i].y);
        }
        shiftedSupplyCurve.stroke({
            color: supply.color,
            width: 2,
            alpha: 0.8,
        });
        equilibriumContainer.addChild(shiftedSupplyCurve);
    }
    
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
    const supplyIntegral = createIntegrationFunction(shiftedSupplyResult, supply.fit);

    const newConsumerSurplus = demandIntegral(demand.range.quantityMin, newQuantity) - newPrice * (newQuantity - demand.range.quantityMin);
    const newProducerSurplus = newPrice * (newQuantity - supply.range.quantityMin) - supplyIntegral(supply.range.quantityMin, newQuantity);
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

        const shiftedSupplyPoints: { x: number; y: number }[] = [];
        const viewportWidth = right - left;
        const stepSize = 2;

        for (let pixelX = 0; pixelX <= viewportWidth; pixelX += stepSize) {
            const screenX = left + pixelX;
            const dataQuantity = map(pixelX, 0, viewportWidth, bounds.quantityMin, bounds.quantityMax);

            try {
                const shiftedEquation = createShiftedSupplyEquation(supply.result, supply.fit, shiftAmount);
                const dataPrice = shiftedEquation(dataQuantity);

                if (isFinite(dataPrice) && dataQuantity >= supply.range.quantityMin && dataQuantity <= supply.range.quantityMax) {
                    const screenY = map(dataPrice, bounds.priceMin, bounds.priceMax, bottom, top);
                    shiftedSupplyPoints.push({ x: screenX, y: screenY });
                }
            } catch (ignored) {}
        }

        const relevantShiftedSupplyPoints = shiftedSupplyPoints.filter((point) => point.x <= newEquilibriumScreenX);

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
