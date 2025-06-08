import { createDerivativeFunction, createEquationFunction } from "@/lib/regression-utils";
import type { CurveFitType } from "@/lib/types";
import { constrain, map } from "@/lib/utils";
import { Graphics, type Container } from "pixi.js";
import type { Result } from "regression";

interface PointElasticityParams {
    quantity: number;
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
    theme: 'dark' | 'light';
    demand: { result: Result; fit: CurveFitType };
    supply: { result: Result; fit: CurveFitType };
    container: Container;
    updateAdjustmentResult: (result: {
        point_price_elasticity_of_demand: number;
        point_price_elasticity_of_supply: number;
    }) => void;
}

type PointElasticityResult = {
    intersects: boolean;
    quantityLine: Graphics;
}

export const calculatePointElasticity = ({
    quantity,
    view: { left, right, top, bottom },
    bounds,
    range,
    theme,
    demand,
    supply,
    container,
    updateAdjustmentResult
}: PointElasticityParams): PointElasticityResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const quantityScreenX = constrain(map(quantity, bounds.quantityMin, bounds.quantityMax, left, right), left, right);

    const quantityLine = new Graphics()
        .moveTo(quantityScreenX, top)
        .lineTo(quantityScreenX, bottom)
        .stroke({
            color,
            width: 2,
        })
        .rect(quantityScreenX - 10, top, 20, bottom - top)
        .fill({
            alpha: 0
        });
    
    quantityLine.eventMode = 'static';
    quantityLine.cursor = 'ew-resize';

    container.addChild(quantityLine);

    if (quantity < range.quantityMin || quantity > range.quantityMax) {
        return { intersects: false, quantityLine };
    }

    const demandEquation = createEquationFunction(demand.result, demand.fit);
    const supplyEquation = createEquationFunction(supply.result, supply.fit);

    const consumerPrice = demandEquation(quantity);
    const producerPrice = supplyEquation(quantity);

    const consumerPriceScreenY = constrain(bottom - map(consumerPrice, bounds.priceMin, bounds.priceMax, 0, bottom - top), top, bottom);
    const producerPriceScreenY = constrain(bottom - map(producerPrice, bounds.priceMin, bounds.priceMax, 0, bottom - top), top, bottom);

    const demandPoint = new Graphics()
        .circle(quantityScreenX, consumerPriceScreenY, 4)
        .fill({
            color
        })
    container.addChild(demandPoint);

    const supplyPoint = new Graphics()
        .circle(quantityScreenX, producerPriceScreenY, 4)
        .fill({
            color
        });
    container.addChild(supplyPoint);

    const demandDerivative = createDerivativeFunction(demand.result, demand.fit);
    const supplyDerivative = createDerivativeFunction(supply.result, supply.fit);

    const demandElasticity = consumerPrice !== 0 ?
        (demandDerivative(quantity) * quantity) / consumerPrice : 0;

    const supplyElasticity = producerPrice !== 0 ?
        (supplyDerivative(quantity) * quantity) / producerPrice : 0;

    updateAdjustmentResult({
        point_price_elasticity_of_demand: demandElasticity,
        point_price_elasticity_of_supply: supplyElasticity
    });

    return { intersects: true, quantityLine };
}