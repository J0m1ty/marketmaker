import { findIntersectionAnalytical } from "@/lib/economics-utils";
import { createEquationFunction, createIntegrationFunction } from "@/lib/regression-utils";
import type { CurveFitType } from "@/lib/types";
import { map } from "@/lib/utils";
import { Container, Graphics } from "pixi.js";
import type { Result } from "regression";
import { createCurve } from "./create-curve";
import { createDashedLine } from "./dashed-line";

interface ExciseSubsidyParams {
    price: number;
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
    subsidy: number;
    side: 'supplier' | 'consumer';
    originalSurplus: number;
    container: Container;
    updateAdjustmentResult: (result: {
        buyer_price: number;
        seller_price: number;
        quantity_traded: number;
        consumer_surplus: number;
        producer_surplus: number;
        total_surplus: number;
        deadweight_loss: number;
        subsidy_cost: number;
        consumer_subsidy_benefit: number;
        producer_subsidy_benefit: number;
    }) => void;
}

type ExciseSubsidyResult = {
    intersects: boolean;
}

export const createExciseSubsidy = ({
    price,
    quantity,
    view: { left, right, top, bottom },
    bounds,
    range,
    theme,
    demand,
    supply,
    subsidy,
    side,
    originalSurplus,
    container,
    updateAdjustmentResult
}: ExciseSubsidyParams): ExciseSubsidyResult => {
    const color = theme === 'dark' ? 0xffffff : 0x000000;

    const basicEquation = createEquationFunction(
        side === 'supplier' ? supply.result : demand.result,
        side === 'supplier' ? supply.fit : demand.fit
    );

    const originalPoints = side === 'supplier' ? supply.result.points : demand.result.points;
    const shiftedData = originalPoints.map(([x, y]) =>
        [x, y + (side === 'supplier' ? -subsidy : subsidy)]
    ) as [number, number][];

    const { success, result } = createCurve({
        view: { left, right, top, bottom },
        bounds,
        range,
        curve: {
            data: shiftedData,
            fit: side === 'supplier' ? supply.fit : demand.fit,
            color: side === 'supplier' ? supply.color : demand.color
        },
        container,
        render: true,
        passive: false
    });

    if (!success) {
        return { intersects: false };
    }

    const intersection = side === 'supplier' ? findIntersectionAnalytical(
        demand.result,
        demand.fit,
        result,
        supply.fit,
        range
    ) : findIntersectionAnalytical(
        result,
        demand.fit,
        supply.result,
        supply.fit,
        range
    );

    if (!intersection) {
        return { intersects: false };
    }

    const { x: quantityTraded, y: intersectionPrice } = intersection;

    if (quantityTraded < quantity || quantityTraded < range.quantityMin) {
        return { intersects: false };
    }

    let buyerPrice: number;
    let sellerPrice: number;

    if (side === 'supplier') {
        buyerPrice = intersectionPrice;
        sellerPrice = basicEquation(quantityTraded);
    } else {
        sellerPrice = intersectionPrice;
        buyerPrice = basicEquation(quantityTraded);
    }

    const demandIntegral = createIntegrationFunction(demand.result, demand.fit);
    const supplyIntegral = createIntegrationFunction(supply.result, supply.fit);

    const subsidyCost = subsidy * quantityTraded;
    const consumerBenefit = (price - buyerPrice) * quantityTraded;
    const producerBenefit = (sellerPrice - price) * quantityTraded;

    const consumerSurplus = demandIntegral(0, quantityTraded) - buyerPrice * quantityTraded;
    const producerSurplus = sellerPrice * quantityTraded - supplyIntegral(0, quantityTraded);
    const totalSurplus = consumerSurplus + producerSurplus;
    const deadweightLoss = originalSurplus - (totalSurplus - subsidyCost);

    const quantityTradedScreenX = map(quantityTraded, bounds.quantityMin, bounds.quantityMax, left, right);
    const buyerPriceScreenY = map(buyerPrice, bounds.priceMin, bounds.priceMax, bottom, top);
    const sellerPriceScreenY = map(sellerPrice, bounds.priceMin, bounds.priceMax, bottom, top);

    const buyerLine = createDashedLine({
        startX: left,
        startY: buyerPriceScreenY,
        endX: quantityTradedScreenX,
        endY: buyerPriceScreenY,
        dashLength: 8,
        gapLength: 5,
        color,
        width: 2,
        alpha: 0.5
    });
    container.addChild(buyerLine);

    const sellerLine = createDashedLine({
        startX: left,
        startY: sellerPriceScreenY,
        endX: quantityTradedScreenX,
        endY: sellerPriceScreenY,
        dashLength: 8,
        gapLength: 5,
        color,
        width: 2,
        alpha: 0.5
    });
    container.addChild(sellerLine);

    const quantityLine = createDashedLine({
        startX: quantityTradedScreenX,
        startY: Math.min(buyerPriceScreenY, sellerPriceScreenY),
        endX: quantityTradedScreenX,
        endY: bottom + top,
        dashLength: 8,
        gapLength: 5,
        color,
        width: 2,
        alpha: 0.5
    });
    container.addChild(quantityLine);

    const buyerPoint = new Graphics()
        .circle(quantityTradedScreenX, buyerPriceScreenY, 4)
        .fill(color);
    container.addChild(buyerPoint);

    const sellerPoint = new Graphics()
        .circle(quantityTradedScreenX, sellerPriceScreenY, 4)
        .fill(color);
    container.addChild(sellerPoint);

    updateAdjustmentResult({
        buyer_price: buyerPrice,
        seller_price: sellerPrice,
        quantity_traded: quantityTraded,
        consumer_surplus: consumerSurplus,
        producer_surplus: producerSurplus,
        total_surplus: totalSurplus,
        deadweight_loss: deadweightLoss,
        subsidy_cost: subsidyCost,
        consumer_subsidy_benefit: consumerBenefit,
        producer_subsidy_benefit: producerBenefit
    });

    return { intersects: true };
}
