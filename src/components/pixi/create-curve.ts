import { createEquationFunction } from '@/lib/regression-utils';
import type { CurveFitType } from '@/lib/types';
import { map } from '@/lib/utils';
import { Container, Graphics } from 'pixi.js';
import regression, { type DataPoint, type Result } from 'regression';
import type { MergedUnion } from 'ts-safe-union';

const getRegressionOptions = (fitType: CurveFitType) => {
    switch (fitType) {
        case 'polynomial':
            return { order: 2 };
        default:
            return {};
    }
};

interface CurveParams {
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
    absoluteBounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    }
    data: number[][];
    fitType: CurveFitType;
    color: string;
    curveType: 'demand' | 'supply';
    render: boolean;
    curvesContainer: Container;
}

type CurveResult = MergedUnion<
    {
        success: false;
    },
    {
        success: true;
        regressionResult: Result;
        points: { x: number; y: number }[];
    }
>;

export const createCurve = ({
    view: { left, right, top, bottom },
    bounds,
    absoluteBounds,
    data,
    fitType,
    color,
    render,
    curvesContainer,
}: CurveParams): CurveResult => {
    if (data.length < 2) return { success: false };

    let regressionResult;
    try {
        const options = getRegressionOptions(fitType);
        regressionResult = regression[fitType](data as DataPoint[], options) as Result;
    } catch (error) {
        console.warn(`Regression failed for ${fitType}:`, error);
        return { success: false };
    }

    const equationFn = createEquationFunction(regressionResult, fitType);

    const curve = new Graphics();
    const curvePoints: { x: number; y: number }[] = [];

    // Sample points
    const pixelWidth = right - left;
    const edgeThreshold = 0.1;
    const fineStep = 0.5;
    const coarseStep = 1.0;

    const usedQuantityMin = Math.max(absoluteBounds.quantityMin, bounds.quantityMin);
    const usedQuantityMax = Math.min(absoluteBounds.quantityMax, bounds.quantityMax);
    const usedPriceMin = Math.max(absoluteBounds.priceMin, bounds.priceMin);
    const usedPriceMax = Math.min(absoluteBounds.priceMax, bounds.priceMax);
    const xRangeUsed = usedQuantityMax - usedQuantityMin;
    const yRangeUsed = usedPriceMax - usedPriceMin;

    let pixelX = 0;
    while (pixelX <= pixelWidth) {
        const screenX = left + pixelX;
        const dataX = map(pixelX, 0, pixelWidth, bounds.quantityMin, bounds.quantityMax);
        let dataY: number;

        try {
            dataY = equationFn(dataX);
        } catch (error) {
            const stepDelta = coarseStep;
            pixelX += stepDelta;
            continue;
        }
        
        const normalizedX = pixelX / pixelWidth;
        const normalizedY = (dataY - bounds.priceMin) / (bounds.priceMax - bounds.priceMin);
        const nearViewEdge = normalizedX <= edgeThreshold ||
            normalizedX >= (1 - edgeThreshold) ||
            normalizedY <= edgeThreshold ||
            normalizedY >= (1 - edgeThreshold);

        const normalizedAbsX = (dataX - usedQuantityMin) / xRangeUsed;
        const normalizedAbsY = (dataY - usedPriceMin) / yRangeUsed;
        const nearAbsoluteBounds = normalizedAbsX <= edgeThreshold ||
            normalizedAbsX >= (1 - edgeThreshold) ||
            normalizedAbsY <= edgeThreshold ||
            normalizedAbsY >= (1 - edgeThreshold);
            
        const stepDelta = (nearViewEdge || nearAbsoluteBounds) ? fineStep : coarseStep;

        if (
            isFinite(dataY) &&
            dataX >= usedQuantityMin &&
            dataX <= usedQuantityMax &&
            dataY >= usedPriceMin &&
            dataY <= usedPriceMax
        ) {
            const screenY = map(dataY, bounds.priceMin, bounds.priceMax, bottom, top);
            curvePoints.push({ x: screenX, y: screenY });
        }

        pixelX += stepDelta;
    }

    if (curvePoints.length >= 2) {
        curve.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < curvePoints.length; i++) {
            curve.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        curve.stroke({
            color,
            width: 2,
        });

        if (render) {
            curvesContainer.addChild(curve);
        }
    }

    return {
        success: true,
        regressionResult,
        points: curvePoints,
    };
};
