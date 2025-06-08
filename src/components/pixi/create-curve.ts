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
    curve: {
        data: number[][];
        fit: CurveFitType;
        color: string;
    };
    container: Container;
    render: boolean;
}

type CurveResult = MergedUnion<
    {
        success: false;
    },
    {
        success: true;
        result: Result;
        points: { x: number; y: number }[];
    }
>;

export const createCurve = ({
    view: { left, right, top, bottom },
    bounds,
    range,
    curve: { data, fit, color },
    container,
    render,
}: CurveParams): CurveResult => {
    if (data.length < 2) return { success: false };

    let regressionResult;
    try {
        const regressionOptions = getRegressionOptions(fit);
        regressionResult = regression[fit](data as DataPoint[], regressionOptions) as Result;
    } catch (error) {
        console.warn(`Regression failed for ${fit}:`, error);
        return { success: false };
    }

    const equationFunction = createEquationFunction(regressionResult, fit);

    const curvePoints: { x: number; y: number }[] = [];

    const viewportWidth = right - left;
    const edgeThreshold = 0.1;
    const fineStepSize = 0.5;
    const coarseStepSize = 1.0;

    const clampedQuantityMin = Math.max(range.quantityMin, bounds.quantityMin);
    const clampedQuantityMax = Math.min(range.quantityMax, bounds.quantityMax);
    const clampedPriceMin = Math.max(range.priceMin, bounds.priceMin);
    const clampedPriceMax = Math.min(range.priceMax, bounds.priceMax);

    const clampedQuantityRange = clampedQuantityMax - clampedQuantityMin;
    const clampedPriceRangeUsed = clampedPriceMax - clampedPriceMin;

    let currentPixelX = 0;
    while (currentPixelX <= viewportWidth) {
        const screenX = left + currentPixelX;
        const dataQuantity = map(currentPixelX, 0, viewportWidth, bounds.quantityMin, bounds.quantityMax);
        let dataPrice: number;

        try {
            dataPrice = equationFunction(dataQuantity);
        } catch (error) {
            const stepDelta = coarseStepSize;
            currentPixelX += stepDelta;
            continue;
        }

        const normalizedViewportX = currentPixelX / viewportWidth;
        const normalizedViewportY = (dataPrice - bounds.priceMin) / (bounds.priceMax - bounds.priceMin);
        const nearViewportEdge =
            normalizedViewportX <= edgeThreshold ||
            normalizedViewportX >= 1 - edgeThreshold ||
            normalizedViewportY <= edgeThreshold ||
            normalizedViewportY >= 1 - edgeThreshold;

        const normalizedClampedX = (dataQuantity - clampedQuantityMin) / clampedQuantityRange;
        const normalizedClampedY = (dataPrice - clampedPriceMin) / clampedPriceRangeUsed;
        const nearClampedBounds =
            normalizedClampedX <= edgeThreshold ||
            normalizedClampedX >= 1 - edgeThreshold ||
            normalizedClampedY <= edgeThreshold ||
            normalizedClampedY >= 1 - edgeThreshold;

        const stepDelta = nearViewportEdge || nearClampedBounds ? fineStepSize : coarseStepSize;

        if (isFinite(dataPrice) && dataQuantity >= clampedQuantityMin && dataQuantity <= clampedQuantityMax) {
            const screenY = map(dataPrice, bounds.priceMin, bounds.priceMax, bottom, top);
            curvePoints.push({ x: screenX, y: screenY });
        }

        currentPixelX += stepDelta;
    }

    if (curvePoints.length >= 2 && render) {
        const curveGraphics = new Graphics();

        curveGraphics.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < curvePoints.length; i++) {
            curveGraphics.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        curveGraphics.stroke({
            color,
            width: 2,
        });

        container.addChild(curveGraphics);
    }

    return {
        success: true,
        result: regressionResult,
        points: curvePoints,
    };
};
