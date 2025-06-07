import { Container, Graphics } from "pixi.js";
import type { MergedUnion } from "ts-safe-union";
import { createDashedLine } from './dashed-line';
import { findQuantityAtPriceAnalytical } from "@/lib/economics-utils";
import { map } from "@/lib/utils";
import type { Result } from "regression";
import type { CurveFitType } from "@/lib/types";
import { createIntegrationFunction } from "@/lib/regression-utils";

interface PriceFloorParams {
    price: number;
    quantity: number;
    floor: number;
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
    theme: 'light' | 'dark';
    demandPoints: { x: number; y: number }[];
    supplyPoints: { x: number; y: number }[];
    demandColor: string;
    supplyColor: string;
    demandResult: Result;
    supplyResult: Result;
    demandCurveFitType: CurveFitType;
    supplyCurveFitType: CurveFitType;
    origionalSurplus: number;
    bounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    }
    absoluteBounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    equilibriumContainer: Container;
    controlContainer: Container;
}

type PriceFloorResult = MergedUnion<{
    intersects: false;
    floorLine: Graphics;
}, {
    intersects: true;
    qd: number;
    qs: number;
    cs: number;
    ps: number;
    ts: number;
    dwl: number;
    floorLine: Graphics;
}>;

export const createPriceFloor = ({
    price,
    quantity,
    floor,
    view,
    theme,
    demandPoints,
    supplyPoints,
    demandColor,
    supplyColor,
    demandResult,
    supplyResult,
    demandCurveFitType,
    supplyCurveFitType,
    origionalSurplus,
    bounds,
    absoluteBounds,
    equilibriumContainer,
    controlContainer,
}: PriceFloorParams): PriceFloorResult => {
    const { left, right, top, bottom } = view;

    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const floorScreenY =
        Math.max(
            Math.min(
                bottom - map(floor, bounds.priceMin, bounds.priceMax, 0, bottom - top),
                bottom
            ),
            top
        );

    const floorLine = new Graphics()
        .moveTo(left, floorScreenY)
        .lineTo(right, floorScreenY)
        .stroke({
            color,
            width: 2
        });

    floorLine.eventMode = 'static';
    floorLine.cursor = 'ns-resize';

    controlContainer.addChild(floorLine);

    if (floor <= price) {
        return { intersects: false, floorLine };
    }

    const qd = findQuantityAtPriceAnalytical(floor, demandResult, demandCurveFitType, absoluteBounds);
    const qs = findQuantityAtPriceAnalytical(floor, supplyResult, supplyCurveFitType, absoluteBounds);

    if (!qd || !qs || qd < 0 || qs < 0) {
        return { intersects: false, floorLine };
    }

    const demandIntegral = createIntegrationFunction(demandResult, demandCurveFitType);
    const supplyIntegral = createIntegrationFunction(supplyResult, supplyCurveFitType);

    const consumerSurplus = demandIntegral(0, qd) - (floor * qd);
    const producerSurplus = (floor * qd) - supplyIntegral(0, qd);
    const totalSurplus = consumerSurplus + producerSurplus;
    const deadweightLoss = origionalSurplus - totalSurplus;

    const qdScreenX = map(qd, bounds.quantityMin, bounds.quantityMax, left, right);
    if (qdScreenX > left && qdScreenX < right) {
        const demandLine = createDashedLine({
            startX: qdScreenX,
            startY: bottom,
            endX: qdScreenX,
            endY: floorScreenY,
            color,
            alpha: 0.5
        });
        equilibriumContainer.addChild(demandLine);

        const demandIntersection = new Graphics()
            .circle(qdScreenX, floorScreenY, 4)
            .fill({ color });
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
            alpha: 0.5
        });
        equilibriumContainer.addChild(supplyLine);

        const supplyIntersection = new Graphics()
            .circle(qsScreenX, floorScreenY, 4)
            .fill({ color });
        controlContainer.addChild(supplyIntersection);
    }

    const effectiveLeftX = map(Math.max(bounds.quantityMin, absoluteBounds.quantityMin), bounds.quantityMin, bounds.quantityMax, left, right);

    if (demandPoints.length >= 2) {
        const consumerSurplusGraphics = new Graphics();

        const relevantDemandPoints = demandPoints.filter(point => {
            const dataX = (point.x - left) / (right - left) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX <= qd;
        });

        if (relevantDemandPoints.length >= 2) {
            consumerSurplusGraphics.moveTo(effectiveLeftX, floorScreenY);

            consumerSurplusGraphics.lineTo(effectiveLeftX, Math.max(top, relevantDemandPoints[0].y));

            const firstPoint = relevantDemandPoints[0];
            consumerSurplusGraphics.lineTo(firstPoint.x, Math.max(top, firstPoint.y));

            for (const point of relevantDemandPoints) {
                consumerSurplusGraphics.lineTo(point.x, Math.max(top, point.y));
            }

            consumerSurplusGraphics.lineTo(qdScreenX, floorScreenY);
            consumerSurplusGraphics.closePath();

            consumerSurplusGraphics.fill({
                color: demandColor,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(consumerSurplusGraphics);
        }
    }

    if (floorScreenY <= bottom) {
        const producerSurplusGraphics = new Graphics();

        const relevantSupplyPoints = supplyPoints.filter(point => {
            const dataX = (point.x - left) / (right - left) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX <= qd;
        });

        if (relevantSupplyPoints.length >= 2) {
            producerSurplusGraphics.moveTo(effectiveLeftX, floorScreenY);

            producerSurplusGraphics.lineTo(qdScreenX, floorScreenY);

            for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                const point = relevantSupplyPoints[i];
                producerSurplusGraphics.lineTo(point.x, Math.min(bottom, point.y));
            }

            const firstPoint = relevantSupplyPoints[0];
            producerSurplusGraphics.lineTo(firstPoint.x, Math.min(bottom, firstPoint.y));
            producerSurplusGraphics.lineTo(effectiveLeftX, Math.min(bottom, firstPoint.y));

            producerSurplusGraphics.closePath();
        }
        else {
            producerSurplusGraphics.moveTo(effectiveLeftX, floorScreenY);

            producerSurplusGraphics.lineTo(Math.max(qdScreenX, effectiveLeftX), floorScreenY);

            producerSurplusGraphics.lineTo(Math.max(qdScreenX, effectiveLeftX), bottom);

            producerSurplusGraphics.lineTo(effectiveLeftX, bottom);
        }

        producerSurplusGraphics.fill({
            color: supplyColor,
            alpha: 0.3,
        });

        equilibriumContainer.addChild(producerSurplusGraphics);
    }

    if (qd !== qs && qd < quantity) {
        const dwlGraphics = new Graphics();

        const demandPointsInDWL = demandPoints.filter(point => {
            const dataX = (point.x - left) / (right - left) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX >= qd && dataX <= quantity;
        });

        const supplyPointsInDWL = supplyPoints.filter(point => {
            const dataX = (point.x - left) / (right - left) * (bounds.quantityMax - bounds.quantityMin) + bounds.quantityMin;
            return dataX >= qd && dataX <= quantity;
        });

        if (demandPointsInDWL.length >= 2) {
            dwlGraphics.moveTo(Math.max(qdScreenX, effectiveLeftX), floorScreenY);


            for (const point of demandPointsInDWL) {
                dwlGraphics.lineTo(point.x, point.y);
            }


            if (supplyPointsInDWL.length >= 2) {
                for (let i = supplyPointsInDWL.length - 1; i >= 0; i--) {
                    const point = supplyPointsInDWL[i];
                    dwlGraphics.lineTo(point.x, point.y);
                }

                if (supplyPointsInDWL[supplyPointsInDWL.length - 1].y < bottom) {
                    dwlGraphics.lineTo(Math.max(qdScreenX, effectiveLeftX), bottom);
                }
            } else {
                dwlGraphics.lineTo(qdScreenX, bottom);
            }

            dwlGraphics.closePath();

            dwlGraphics.fill({
                color,
                alpha: 0.3,
            });

            equilibriumContainer.addChild(dwlGraphics);
        }
    }

    return {
        intersects: true,
        qd,
        qs,
        cs: consumerSurplus,
        ps: producerSurplus,
        ts: totalSurplus,
        dwl: deadweightLoss,
        floorLine
    };
}