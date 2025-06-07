import { createIntegrationFunction } from "@/lib/regression-utils";
import type { CurveFitType } from "@/lib/types";
import { map } from "@/lib/utils";
import { Graphics, type Container } from "pixi.js";
import type { Result } from "regression";

interface SurplusParams {
    price: number;
    quantity: number;
    demandPoints: { x: number; y: number }[];
    supplyPoints: { x: number; y: number }[];
    demandColor: string;
    supplyColor: string;
    demandResult: Result;
    supplyResult: Result;
    demandCurveFitType: CurveFitType;
    supplyCurveFitType: CurveFitType;
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
    }
    absoluteBounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    }
    areaContainer: Container;
    render: boolean;
}

type SurplusResult = {
    consumerSurplus: number;
    producerSurplus: number;
    totalSurplus: number;
}

export const calculateSurpluses = ({
    price,
    quantity,
    demandPoints,
    supplyPoints,
    demandColor,
    supplyColor,
    demandResult,
    supplyResult,
    demandCurveFitType,
    supplyCurveFitType,
    view: { left, right, top, bottom },
    bounds,
    absoluteBounds,
    areaContainer,
    render
}: SurplusParams): SurplusResult => {
    const demandIntegral = createIntegrationFunction(demandResult, demandCurveFitType);
    const supplyIntegral = createIntegrationFunction(supplyResult, supplyCurveFitType);

    const consumerSurplus = demandIntegral(0, quantity) - (price * quantity);
    const producerSurplus = (price * quantity) - supplyIntegral(0, quantity);
    const totalSurplus = consumerSurplus + producerSurplus;

    if (render) {
        const equilibriumScreenX = map(quantity, bounds.quantityMin, bounds.quantityMax, left, right);
        const equilibriumScreenY = map(price, bounds.priceMin, bounds.priceMax, bottom, top);
        
        const effectiveQuantityMin = Math.max(bounds.quantityMin, absoluteBounds.quantityMin);
        const effectiveLeftX = map(effectiveQuantityMin, bounds.quantityMin, bounds.quantityMax, left, right);

        if (demandPoints.length >= 2) {
            const consumerSurplusGraphics = new Graphics();
            
            const relevantDemandPoints = demandPoints.filter(point => {
                const dataX = map(point.x, left, right, bounds.quantityMin, bounds.quantityMax);
                return dataX <= quantity;
            });

            if (relevantDemandPoints.length >= 2) {
                consumerSurplusGraphics.moveTo(effectiveLeftX, equilibriumScreenY);
                
                consumerSurplusGraphics.lineTo(effectiveLeftX, Math.max(top, relevantDemandPoints[0].y));
                
                const firstPoint = relevantDemandPoints[0];
                consumerSurplusGraphics.lineTo(firstPoint.x, Math.max(top, relevantDemandPoints[0].y));
                
                for (const point of relevantDemandPoints) {
                    consumerSurplusGraphics.lineTo(point.x, point.y);
                }

                consumerSurplusGraphics.lineTo(equilibriumScreenX, equilibriumScreenY);
                consumerSurplusGraphics.closePath();
                
                consumerSurplusGraphics.fill({
                    color: demandColor,
                    alpha: 0.3,
                });
                
                areaContainer.addChild(consumerSurplusGraphics);
            }
        }
        
        if (supplyPoints.length >= 2) {
            const producerSurplusGraphics = new Graphics();
            
            const relevantSupplyPoints = supplyPoints.filter(point => {
                const dataX = map(point.x, left, right, bounds.quantityMin, bounds.quantityMax);
                return dataX <= quantity;
            });

            if (relevantSupplyPoints.length >= 2) {
                producerSurplusGraphics.moveTo(effectiveLeftX, equilibriumScreenY);
                
                producerSurplusGraphics.lineTo(effectiveLeftX, equilibriumScreenY);
                
                for (let i = relevantSupplyPoints.length - 1; i >= 0; i--) {
                    producerSurplusGraphics.lineTo(relevantSupplyPoints[i].x, relevantSupplyPoints[i].y);
                }
                
                const firstPoint = relevantSupplyPoints[0];
                producerSurplusGraphics.lineTo(firstPoint.x, Math.min(bottom, firstPoint.y));
                
                producerSurplusGraphics.lineTo(effectiveLeftX, Math.min(bottom, firstPoint.y));
                
                producerSurplusGraphics.closePath();
                
                producerSurplusGraphics.fill({
                    color: supplyColor,
                    alpha: 0.3,
                });
                
                areaContainer.addChild(producerSurplusGraphics);
            }
        }
    }

    return {
        consumerSurplus,
        producerSurplus,
        totalSurplus
    };
}