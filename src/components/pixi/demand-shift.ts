import { findIntersectionAnalytical } from '@/lib/economics-utils';
import { createIntegrationFunction, createEquationFunction } from '@/lib/regression-utils';
import type { CurveFitType } from '@/lib/types';
import { map } from '@/lib/utils';
import { Graphics, type Container } from 'pixi.js';
import type { Result } from 'regression';

interface DemandShiftParams {
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

type DemandShiftResult = {
    intersects: boolean;
};

const createShiftedDemandEquation = (originalResult: Result, fitType: CurveFitType, shiftAmount: number) => {
    const originalEquation = createEquationFunction(originalResult, fitType);
    return (x: number) => originalEquation(x - shiftAmount);
};

export const createDemandShift = ({
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
}: DemandShiftParams): DemandShiftResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;

    const shiftedEquation = createShiftedDemandEquation(demand.result, demand.fit, shiftAmount);

    const shiftedData: [number, number][] = [];
    const quantityStep = (range.quantityMax - range.quantityMin) / 20;

    for (let q = range.quantityMin; q <= range.quantityMax; q += quantityStep) {
        try {
            const price = shiftedEquation(q);
            if (isFinite(price) && price >= range.priceMin && price <= range.priceMax) {
                shiftedData.push([q, price]);
            }
        } catch (ignored) { };
    }

    const shiftedDemandResult = {
        ...demand.result,
        points: shiftedData,
    };

    const newEquilibrium = findIntersectionAnalytical(
        shiftedDemandResult,
        demand.fit,
        supply.result,
        supply.fit,
        range
    );

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

    const shiftedDemandCurve = new Graphics();
    const viewportWidth = right - left;
    const stepSize = 2;
    const shiftedDemandPoints: { x: number; y: number }[] = [];

    for (let pixelX = 0; pixelX <= viewportWidth; pixelX += stepSize) {
        const screenX = left + pixelX;
        const dataQuantity = map(pixelX, 0, viewportWidth, bounds.quantityMin, bounds.quantityMax);

        try {
            const shiftedEquation = createShiftedDemandEquation(demand.result, demand.fit, shiftAmount);
            const dataPrice = shiftedEquation(dataQuantity);

            if (isFinite(dataPrice) && dataQuantity >= demand.range.quantityMin && dataQuantity <= demand.range.quantityMax && dataPrice >= bounds.priceMin && dataPrice <= bounds.priceMax) {
                const screenY = map(dataPrice, bounds.priceMin, bounds.priceMax, bottom, top);
                shiftedDemandPoints.push({ x: screenX, y: screenY });
            }
        } catch (ignored) {}
    }

    if (shiftedDemandPoints.length >= 2) {
        shiftedDemandCurve.moveTo(shiftedDemandPoints[0].x, shiftedDemandPoints[0].y);
        for (let i = 1; i < shiftedDemandPoints.length; i++) {
            shiftedDemandCurve.lineTo(shiftedDemandPoints[i].x, shiftedDemandPoints[i].y);
        }
        shiftedDemandCurve.stroke({
            color: demand.color,
            width: 2,
            alpha: 0.8,
        });
        equilibriumContainer.addChild(shiftedDemandCurve);
    }
    
    const newEquilibriumPoint = new Graphics()
        .circle(newEquilibriumScreenX, newEquilibriumScreenY, 5)
        .fill({ color: demand.color });
    equilibriumContainer.addChild(newEquilibriumPoint);
    
    const originalEquilibriumScreenX = map(originalQuantity, bounds.quantityMin, bounds.quantityMax, left, right);
    const originalEquilibriumScreenY = map(originalPrice, bounds.priceMin, bounds.priceMax, bottom, top);

    const originalEquilibriumPoint = new Graphics()
        .circle(originalEquilibriumScreenX, originalEquilibriumScreenY, 4)
        .fill({ color, alpha: 0.3 });
    equilibriumContainer.addChild(originalEquilibriumPoint);
    
    const demandIntegral = createIntegrationFunction(shiftedDemandResult, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const newConsumerSurplus = demandIntegral(0, newQuantity) - newPrice * newQuantity;
    const newProducerSurplus = newPrice * newQuantity - supplyIntegral(0, newQuantity);
    const newTotalSurplus = newConsumerSurplus + newProducerSurplus;
    const deadweightLoss = originalSurplus - newTotalSurplus;
    
    if (demand.points.length >= 2 && supply.points.length >= 2) {
        const newConsumerSurplusGraphics = new Graphics();
        const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);
        
        const shiftedDemandPoints: { x: number; y: number }[] = [];
        const viewportWidth = right - left;
        const stepSize = 2;

        for (let pixelX = 0; pixelX <= viewportWidth; pixelX += stepSize) {
            const screenX = left + pixelX;
            const dataQuantity = map(pixelX, 0, viewportWidth, bounds.quantityMin, bounds.quantityMax);

            try {
                const shiftedEquation = createShiftedDemandEquation(demand.result, demand.fit, shiftAmount);
                const dataPrice = shiftedEquation(dataQuantity);

                if (isFinite(dataPrice) && dataQuantity >= demand.range.quantityMin && dataQuantity <= demand.range.quantityMax) {
                    const screenY = map(dataPrice, bounds.priceMin, bounds.priceMax, bottom, top);
                    shiftedDemandPoints.push({ x: screenX, y: screenY });
                }
            } catch (ignored) {}
        }

        const relevantShiftedDemandPoints = shiftedDemandPoints.filter((point) => point.x <= newEquilibriumScreenX);

        if (relevantShiftedDemandPoints.length >= 2) {
            newConsumerSurplusGraphics.moveTo(Math.max(demandMinScreenX, left), newEquilibriumScreenY);

            for (const point of relevantShiftedDemandPoints) {
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

        const relevantSupplyPoints = supply.points.filter((point) => point.x <= newEquilibriumScreenX);

        if (relevantSupplyPoints.length >= 2) {
            newProducerSurplusGraphics.moveTo(Math.max(supplyMinScreenX, left), newEquilibriumScreenY);
            newProducerSurplusGraphics.lineTo(newEquilibriumScreenX, newEquilibriumScreenY);

            for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantSupplyPoints[i];
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