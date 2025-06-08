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

// Helper function to create a shifted demand curve equation
const createShiftedDemandEquation = (originalResult: Result, fitType: CurveFitType, shiftAmount: number) => {
    const originalEquation = createEquationFunction(originalResult, fitType);
    
    // For demand curves, a positive shift means the curve moves right (higher quantity at same price)
    // This is implemented by shifting the quantity parameter in the inverse direction
    return (x: number) => originalEquation(x - shiftAmount);
};

// Helper function to create shifted demand regression result
const createShiftedDemandResult = (originalResult: Result, fitType: CurveFitType, shiftAmount: number): Result => {
    const coefficients = [...originalResult.equation];
    
    // Modify coefficients based on the curve type to represent the shift
    switch (fitType) {
        case 'linear':
            // For linear: y = ax + b, shift means y = a(x - shift) + b = ax - a*shift + b
            // So new intercept is b - a*shift
            coefficients[1] = coefficients[1] - coefficients[0] * shiftAmount;
            break;
        
        case 'exponential':
            // For exponential: y = ae^(bx), shift means y = ae^(b(x - shift)) = ae^(bx - b*shift) = ae^(-b*shift) * e^(bx)
            // So new coefficient a becomes a * e^(-b*shift)
            coefficients[0] = coefficients[0] * Math.exp(-coefficients[1] * shiftAmount);
            break;
            
        case 'logarithmic':
            // For logarithmic: y = a + b*ln(x), shift means y = a + b*ln(x - shift)
            // This is more complex, so we'll use the functional approach
            break;
            
        case 'power':
            // For power: y = ax^b, shift means y = a(x - shift)^b
            // This is also complex, so we'll use the functional approach
            break;
            
        case 'polynomial':
            // For polynomial, this is very complex, so we'll use the functional approach
            break;
    }
    
    return {
        ...originalResult,
        equation: coefficients,
    };
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

    // Create shifted demand curve
    let shiftedDemandResult: Result;
    
    if (demand.fit === 'linear' || demand.fit === 'exponential') {
        // Use coefficient modification for simpler curves
        shiftedDemandResult = createShiftedDemandResult(demand.result, demand.fit, shiftAmount);
    } else {
        // For complex curves, create a new result using the shifted equation
        const shiftedEquation = createShiftedDemandEquation(demand.result, demand.fit, shiftAmount);
        
        // Generate new data points for the shifted curve
        const shiftedData: [number, number][] = [];
        const quantityStep = (range.quantityMax - range.quantityMin) / 20;
        
        for (let q = range.quantityMin; q <= range.quantityMax; q += quantityStep) {
            try {
                const price = shiftedEquation(q);
                if (isFinite(price) && price >= range.priceMin && price <= range.priceMax) {
                    shiftedData.push([q, price]);
                }
            } catch (error) {
                // Skip invalid points
            }
        }
        
        // Create a new regression result
        shiftedDemandResult = {
            ...demand.result,
            points: shiftedData,
        };
    }

    // Find new equilibrium with shifted demand
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

    // Draw new equilibrium point
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

    // Draw the shifted demand curve
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
        } catch (error) {
            // Skip invalid points
        }
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

    // Draw new equilibrium point
    const newEquilibriumPoint = new Graphics()
        .circle(newEquilibriumScreenX, newEquilibriumScreenY, 5)
        .fill({ color: demand.color });
    equilibriumContainer.addChild(newEquilibriumPoint);

    // Draw original equilibrium point for comparison
    const originalEquilibriumScreenX = map(originalQuantity, bounds.quantityMin, bounds.quantityMax, left, right);
    const originalEquilibriumScreenY = map(originalPrice, bounds.priceMin, bounds.priceMax, bottom, top);
    
    const originalEquilibriumPoint = new Graphics()
        .circle(originalEquilibriumScreenX, originalEquilibriumScreenY, 4)
        .fill({ color, alpha: 0.3 });
    equilibriumContainer.addChild(originalEquilibriumPoint);

    // Calculate new surpluses using the shifted demand curve
    const demandIntegral = createIntegrationFunction(shiftedDemandResult, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const newConsumerSurplus = demandIntegral(0, newQuantity) - newPrice * newQuantity;
    const newProducerSurplus = newPrice * newQuantity - supplyIntegral(0, newQuantity);
    const newTotalSurplus = newConsumerSurplus + newProducerSurplus;
    const deadweightLoss = originalSurplus - newTotalSurplus;

    // Draw new surplus areas
    if (demand.points.length >= 2 && supply.points.length >= 2) {
        // Draw new consumer surplus
        const newConsumerSurplusGraphics = new Graphics();
        const demandMinScreenX = map(demand.range.quantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

        // Use the shifted demand curve points (we need to generate them)
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
            } catch (error) {
                // Skip invalid points
            }
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

        // Draw new producer surplus (unchanged supply curve)
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