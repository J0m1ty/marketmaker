import { useApplication } from '@pixi/react';
import { useResolvedTheme } from '../theme-provider';
import { useResize } from './resize-provider';
import { useCallback, useEffect, useRef } from 'react';
import { Container, Graphics } from 'pixi.js';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { createAxisContainer } from './axis-container';
import { createPointsContainer } from './points-container';
import { createEquilibrium } from './equilibrium-container';
import { createCurve } from './create-curve';
import { calculateArcElasticities } from '@/lib/economics-utils';
import { calculateSurpluses } from './calculate-surplus';
import { createPriceFloor } from './price-floor';
import { createPriceCeiling } from './price-ceiling';
import { createDemandShift } from './demand-shift';
import { createSupplyShift } from './supply-shift';
import { setupDragHandler } from '@/lib/drag-handler';
import { createBorderMask } from './border-mask';
import { calculatePointElasticity } from './point-elasticity';
import { createExciseTax } from './excise-tax';
import { createExciseSubsidy } from './excise-subsidy';

export const Graph = () => {
    const { width, height } = useResize();
    const theme = useResolvedTheme();
    const { getActiveTab, updateComputed, updateAdjustmentResult, updateAdjustment } = useMarketTabsStore();
    const { app, isInitialised } = useApplication();
    const dragCleanupRef = useRef<(() => void)[]>([]);
    const isDraggingRef = useRef(false);

    if (!isInitialised) return null;

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const display = useCallback(() => {
        if (!app) return;

        if (!isDraggingRef.current) {
            dragCleanupRef.current.forEach((cleanup) => cleanup());
            dragCleanupRef.current = [];
        }

        app.stage.removeChildren();

        const bounds = {
            priceMin: activeTab.bounds.priceMin,
            priceMax: activeTab.bounds.priceMax,
            quantityMin: activeTab.bounds.quantityMin,
            quantityMax: activeTab.bounds.quantityMax,
        };

        const margin = {
            left: 55,
            right: 35,
            top: 35,
            bottom: 50,
        };
        const view = {
            left: margin.left,
            right: width - margin.right,
            top: margin.top,
            bottom: height - margin.bottom,
        };

        const rows = activeTab.market.file.rows;

        const demandData = rows.filter((row) => row.qd > 0).map((row) => [row.qd, row.price]);

        const supplyData = rows.filter((row) => row.qs > 0).map((row) => [row.qs, row.price]);

        const { gridLines, axisContainer } = createAxisContainer({
            view,
            bounds,
            theme,
        });

        const pointsContainer = createPointsContainer({
            view,
            bounds,
            demand: { data: demandData, color: activeTab.curves.demand.color },
            supply: { data: supplyData, color: activeTab.curves.supply.color },
            render: activeTab.adjustment.mode === 'none',
        });

        const curvesContainer = new Container();

        const {
            success: demand,
            result: demandResult,
            points: demandPoints,
        } = createCurve({
            view,
            bounds,
            range: activeTab.ranges.demand,
            curve: {
                data: demandData,
                fit: activeTab.curves.demand.fit,
                color: activeTab.curves.demand.color,
            },
            container: curvesContainer,
            render: true,
            passive:
                activeTab.adjustment.mode === 'demand_shift' ||
                (activeTab.adjustment.mode === 'per_unit_tax' && activeTab.adjustment.side === 'consumer') ||
                (activeTab.adjustment.mode === 'per_unit_subsidy' && activeTab.adjustment.side === 'consumer'),
        });

        const {
            success: supply,
            result: supplyResult,
            points: supplyPoints,
        } = createCurve({
            view,
            bounds,
            range: activeTab.ranges.supply,
            curve: {
                data: supplyData,
                fit: activeTab.curves.supply.fit,
                color: activeTab.curves.supply.color,
            },
            container: curvesContainer,
            render: true,
            passive:
                activeTab.adjustment.mode === 'supply_shift' ||
                (activeTab.adjustment.mode === 'per_unit_tax' && activeTab.adjustment.side === 'supplier') ||
                (activeTab.adjustment.mode === 'per_unit_subsidy' && activeTab.adjustment.side === 'supplier'),
        });

        const equilibriumContainer = new Container();
        const controlContainer = new Container();
        const areaContainer = new Container();

        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;

        if (demand && supply) {
            const { intersect, price, quantity } = createEquilibrium({
                view,
                bounds,
                range: activeTab.ranges.combined,
                theme,
                demand: {
                    result: demandResult,
                    fit: activeTab.curves.demand.fit,
                },
                supply: {
                    result: supplyResult,
                    fit: activeTab.curves.supply.fit,
                },
                container: equilibriumContainer,
                render:
                    activeTab.adjustment.mode !== 'demand_shift' &&
                    activeTab.adjustment.mode !== 'supply_shift' &&
                    activeTab.adjustment.mode !== 'point_elasticity',
                passive: activeTab.adjustment.mode !== 'none',
            });

            if (intersect) {
                const { arcPED, arcPES } = calculateArcElasticities({
                    price,
                    range: activeTab.ranges.combined,
                    demand: { result: demandResult, fit: activeTab.curves.demand.fit },
                    supply: { result: supplyResult, fit: activeTab.curves.supply.fit },
                });

                const { consumerSurplus, producerSurplus } = calculateSurpluses({
                    price,
                    quantity,
                    view,
                    bounds,
                    demand: {
                        points: demandPoints,
                        result: demandResult,
                        fit: activeTab.curves.demand.fit,
                        color: activeTab.curves.demand.color,
                        range: activeTab.ranges.demand,
                    },
                    supply: {
                        points: supplyPoints,
                        result: supplyResult,
                        fit: activeTab.curves.supply.fit,
                        color: activeTab.curves.supply.color,
                        range: activeTab.ranges.supply,
                    },
                    container: areaContainer,
                    render: activeTab.adjustment.mode === 'none',
                });

                const total = consumerSurplus + producerSurplus;

                updateComputed(activeTab.market.id, {
                    intersect: true,
                    equilibrium_price: price,
                    equilibrium_quantity: quantity,
                    arc_price_elasticity_of_demand: arcPED,
                    arc_price_elasticity_of_supply: arcPES,
                    consumer_surplus: consumerSurplus,
                    producer_surplus: producerSurplus,
                    total_surplus: total,
                });

                if (activeTab.adjustment.mode === 'price_floor') {
                    const { intersects, floorLine } = createPriceFloor({
                        price,
                        quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        floor: activeTab.adjustment.price,
                        originalSurplus: total,
                        equilibriumContainer,
                        controlContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    const cleanup = setupDragHandler({
                        target: floorLine,
                        app,
                        direction: 'vertical',
                        bounds: {
                            min: bounds.priceMin,
                            max: bounds.priceMax,
                            screenMin: view.top,
                            screenMax: view.bottom,
                        },
                        onDrag: (newPrice) => updateAdjustment(activeTab.market.id, { price: newPrice }),
                        onDragStart: () => {
                            isDraggingRef.current = true;
                        },
                        onDragEnd: () => {
                            isDraggingRef.current = false;
                        },
                        cursor: 'ns-resize',
                    });

                    dragCleanupRef.current.push(cleanup);

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'price_ceiling') {
                    const { intersects, ceilingLine } = createPriceCeiling({
                        price,
                        quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        ceiling: activeTab.adjustment.price,
                        originalSurplus: total,
                        equilibriumContainer,
                        controlContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    const cleanup = setupDragHandler({
                        target: ceilingLine,
                        app,
                        direction: 'vertical',
                        bounds: {
                            min: bounds.priceMin,
                            max: bounds.priceMax,
                            screenMin: view.top,
                            screenMax: view.bottom,
                        },
                        onDrag: (newPrice) => updateAdjustment(activeTab.market.id, { price: newPrice }),
                        onDragStart: () => {
                            isDraggingRef.current = true;
                        },
                        onDragEnd: () => {
                            isDraggingRef.current = false;
                        },
                        cursor: 'ns-resize',
                    });

                    dragCleanupRef.current.push(cleanup);

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'per_unit_tax') {
                    const { intersects } = createExciseTax({
                        price,
                        quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        tax: activeTab.adjustment.amount,
                        side: activeTab.adjustment.side,
                        originalSurplus: total,
                        container: equilibriumContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'per_unit_subsidy') {
                    const { intersects } = createExciseSubsidy({
                        price,
                        quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        subsidy: activeTab.adjustment.amount,
                        side: activeTab.adjustment.side,
                        originalSurplus: total,
                        container: equilibriumContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'demand_shift') {
                    const { intersects } = createDemandShift({
                        originalPrice: price,
                        originalQuantity: quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        shiftAmount: activeTab.adjustment.amount,
                        originalSurplus: total,
                        equilibriumContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'supply_shift') {
                    const { intersects } = createSupplyShift({
                        originalPrice: price,
                        originalQuantity: quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            points: demandPoints,
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                            color: activeTab.curves.demand.color,
                            range: activeTab.ranges.demand,
                        },
                        supply: {
                            points: supplyPoints,
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                            color: activeTab.curves.supply.color,
                            range: activeTab.ranges.supply,
                        },
                        shiftAmount: activeTab.adjustment.amount,
                        originalSurplus: total,
                        equilibriumContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }

                if (activeTab.adjustment.mode === 'point_elasticity') {
                    const { intersects, quantityLine } = calculatePointElasticity({
                        quantity: activeTab.adjustment.quantity,
                        view,
                        bounds,
                        range: activeTab.ranges.combined,
                        theme,
                        demand: {
                            result: demandResult,
                            fit: activeTab.curves.demand.fit,
                        },
                        supply: {
                            result: supplyResult,
                            fit: activeTab.curves.supply.fit,
                        },
                        container: equilibriumContainer,
                        updateAdjustmentResult: (result) => updateAdjustmentResult(activeTab.market.id, result),
                    });

                    const cleanup = setupDragHandler({
                        target: quantityLine,
                        app,
                        direction: 'horizontal',
                        bounds: {
                            min: bounds.quantityMin,
                            max: bounds.quantityMax,
                            screenMin: view.left,
                            screenMax: view.right,
                        },
                        onDrag: (newQuantity) => updateAdjustment(activeTab.market.id, { quantity: newQuantity }),
                        onDragStart: () => {
                            isDraggingRef.current = true;
                        },
                        onDragEnd: () => {
                            isDraggingRef.current = false;
                        },
                        cursor: 'ew-resize',
                    });

                    dragCleanupRef.current.push(cleanup);

                    if (!intersects) {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }
            }
        }

        const background = new Graphics().rect(0, 0, width, height).fill(theme === 'dark' ? 0x0a0a0a : 0xffffff);

        const borderMask = createBorderMask({
            view,
            canvasWidth: width,
            canvasHeight: height,
            theme,
        });

        app.stage.addChild(background);
        app.stage.addChild(gridLines);
        app.stage.addChild(areaContainer);
        app.stage.addChild(pointsContainer);
        app.stage.addChild(curvesContainer);
        app.stage.addChild(equilibriumContainer);
        app.stage.addChild(controlContainer);
        app.stage.addChild(borderMask);
        app.stage.addChild(axisContainer);
    }, [
        app,
        width,
        height,
        theme,
        activeTab.adjustment.mode,
        activeTab.adjustment.price,
        activeTab.adjustment.quantity,
        activeTab.adjustment.side,
        activeTab.adjustment.amount,
        activeTab.market,
        activeTab.bounds,
        activeTab.curves,
    ]);

    useEffect(() => {
        display();
    }, [display]);

    useEffect(() => {
        return () => {
            dragCleanupRef.current.forEach((cleanup) => cleanup());
        };
    }, []);

    return null;
};
