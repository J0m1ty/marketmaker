import type { Result } from "regression";
import type { CurveFitType } from "./types";
import { createDerivativeFunction, createEquationFunction } from "./regression-utils";

export const findQuantityAtPriceAnalytical = (
    targetPrice: number,
    regressionResult: Result,
    fitType: CurveFitType,
    bounds: { priceMin: number, priceMax: number, quantityMin: number, quantityMax: number }
) => {
    const coefficients = regressionResult.equation;

    try {
        let quantity: number;

        switch (fitType) {
            case 'linear':
                // p = ax + b -> x = (p - b) / a
                if (coefficients[0] === 0) return null;
                quantity = (targetPrice - coefficients[1]) / coefficients[0];
                break;

            case 'exponential':
                // p = ae^(bx) -> x = ln(p/a) / b
                if (coefficients[0] <= 0 || coefficients[1] === 0 || targetPrice <= 0) return null;
                quantity = Math.log(targetPrice / coefficients[0]) / coefficients[1];
                break;

            case 'logarithmic':
                // p = a + b*ln(x) -> x = e^((p - a) / b)
                if (coefficients[1] === 0) return null;
                quantity = Math.exp((targetPrice - coefficients[0]) / coefficients[1]);
                break;

            case 'power':
                // p = ax^b -> x = (p/a)^(1/b)
                if (coefficients[0] === 0 || coefficients[1] === 0 || targetPrice <= 0) return null;
                quantity = Math.pow(targetPrice / coefficients[0], 1 / coefficients[1]);
                break;

            case 'polynomial':
                // For polynomials, we need numerical methods (Newton-Raphson or binary search)
                return findQuantityAtPriceNumerical(targetPrice, regressionResult, fitType, bounds);

            default:
                return null;
        }

        if (quantity >= bounds.quantityMin && quantity <= bounds.quantityMax) {
            return quantity;
        }
        return null;

    } catch (error) {
        return null;
    }
};

const findQuantityAtPriceNumerical = (
    targetPrice: number,
    regressionResult: Result,
    fitType: CurveFitType,
    bounds: { priceMin: number, priceMax: number, quantityMin: number, quantityMax: number }
) => {
    const equation = createEquationFunction(regressionResult, fitType);
    const derivative = createDerivativeFunction(regressionResult, fitType);
    
    let x = (bounds.quantityMin + bounds.quantityMax) / 2;
    
    for (let i = 0; i < 25; i++) {
        const fx = equation(x) - targetPrice;
        const fpx = derivative(x);
        
        if (Math.abs(fx) < 1e-10) break;
        if (Math.abs(fpx) < 1e-10) break;
        
        const newX = x - fx / fpx;
        if (newX < bounds.quantityMin || newX > bounds.quantityMax) break;
        
        x = newX;
    }
    
    return (x >= bounds.quantityMin && x <= bounds.quantityMax) ? x : null;
};

export const calculateArcElasticities = (
    price: number,
    demandResult: Result,
    demandFitType: CurveFitType,
    supplyResult: Result,
    supplyFitType: CurveFitType,
    bounds: { priceMin: number; priceMax: number; quantityMin: number; quantityMax: number }
) => {
    const priceRange = price * 0.1;
    const p1 = price - priceRange;
    const p2 = price + priceRange;

    const minPrice = Math.max(p1, bounds.priceMin);
    const maxPrice = Math.min(p2, bounds.priceMax);

    if (minPrice >= maxPrice) return { arcPED: 0, arcPES: 0 };

    try {
        // Use analytical methods instead of sampling
        const demandQ1 = findQuantityAtPriceAnalytical(minPrice, demandResult, demandFitType, bounds);
        const demandQ2 = findQuantityAtPriceAnalytical(maxPrice, demandResult, demandFitType, bounds);
        const supplyQ1 = findQuantityAtPriceAnalytical(minPrice, supplyResult, supplyFitType, bounds);
        const supplyQ2 = findQuantityAtPriceAnalytical(maxPrice, supplyResult, supplyFitType, bounds);

        if (!demandQ1 || !demandQ2 || !supplyQ1 || !supplyQ2) {
            return { arcPED: 0, arcPES: 0 };
        }

        const calcArcElasticity = (q1: number, q2: number, p1: number, p2: number) => {
            const percentChangeQ = (q2 - q1) / ((q2 + q1) / 2);
            const percentChangeP = (p2 - p1) / ((p2 + p1) / 2);

            return percentChangeP !== 0 ? percentChangeQ / percentChangeP : 0;
        };

        const arcPED = calcArcElasticity(demandQ1, demandQ2, minPrice, maxPrice);
        const arcPES = calcArcElasticity(supplyQ1, supplyQ2, minPrice, maxPrice);

        return { arcPED, arcPES };
    } catch (error) {
        console.warn('Arc elasticity calculation failed:', error);
        return { arcPED: 0, arcPES: 0 };
    }
};

export const findIntersectionAnalytical = (
    demandResult: Result,
    demandFitType: CurveFitType,
    supplyResult: Result,
    supplyFitType: CurveFitType,
    bounds: { priceMin: number; priceMax: number; quantityMin: number; quantityMax: number }
) => {
    const d = demandResult.equation;
    const s = supplyResult.equation;

    try {
        let intersectionX: number;

        if (demandFitType === 'linear' && supplyFitType === 'linear') {
            if (d[0] === s[0]) return null;
            intersectionX = (s[1] - d[1]) / (d[0] - s[0]);
        }
        
        else if (demandFitType === 'exponential' && supplyFitType === 'exponential') {
            if (d[1] === s[1]) {
                if (d[1] === 0 || d[0] <= 0 || s[0] <= 0) return null;
                intersectionX = Math.log(s[0] / d[0]) / d[1];
            } else {
                return findIntersectionNumerical(demandResult, demandFitType, supplyResult, supplyFitType, bounds);
            }
        }
        
        else if (demandFitType === 'power' && supplyFitType === 'power' && d[1] === s[1]) {
            if (d[1] === 0 || d[0] === 0) return null;
            intersectionX = Math.pow(s[0] / d[0], 1 / d[1]);
        }
        
        else {
            return findIntersectionNumerical(demandResult, demandFitType, supplyResult, supplyFitType, bounds);
        }
        
        const demandEquation = createEquationFunction(demandResult, demandFitType);
        const intersectionY = demandEquation(intersectionX);

        if (intersectionX >= bounds.quantityMin && intersectionX <= bounds.quantityMax &&
            intersectionY >= bounds.priceMin && intersectionY <= bounds.priceMax) {
            return { x: intersectionX, y: intersectionY };
        }
        return null;

    } catch (error) {
        return null;
    }
};

const findIntersectionNumerical = (
    demandResult: Result,
    demandFitType: CurveFitType,
    supplyResult: Result,
    supplyFitType: CurveFitType,
    bounds: { priceMin: number; priceMax: number; quantityMin: number; quantityMax: number }
) => {
    const demandEquation = createEquationFunction(demandResult, demandFitType);
    const supplyEquation = createEquationFunction(supplyResult, supplyFitType);
    
    let x = (bounds.quantityMin + bounds.quantityMax) / 2;
    
    for (let i = 0; i < 25; i++) {
        const demandY = demandEquation(x);
        const supplyY = supplyEquation(x);
        const fx = demandY - supplyY;
        
        if (Math.abs(fx) < 1e-10) break;
        
        const h = 0.0001;
        const demandDeriv = (demandEquation(x + h) - demandEquation(x - h)) / (2 * h);
        const supplyDeriv = (supplyEquation(x + h) - supplyEquation(x - h)) / (2 * h);
        const fpx = demandDeriv - supplyDeriv;
        
        if (Math.abs(fpx) < 1e-10) break;
        
        const newX = x - fx / fpx;
        if (newX < bounds.quantityMin || newX > bounds.quantityMax) break;
        
        x = newX;
    }
    
    const intersectionY = demandEquation(x);
    
    if (x >= bounds.quantityMin && x <= bounds.quantityMax &&
        intersectionY >= bounds.priceMin && intersectionY <= bounds.priceMax) {
        return { x, y: intersectionY };
    }
    return null;
};