import { useApplication } from '@pixi/react';
import { useResolvedTheme } from '../theme-provider';
import { useResize } from './resize-provider';
import { useCallback, useEffect } from 'react';
import { Container, Graphics } from 'pixi.js';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { createAxisContainer } from './axis-container';
import { createPointsContainer } from './points-container';
import { createEquilibrium } from './equilibrium-container';
import { createCurve } from './create-curve';
import { calculateArcElasticities } from '@/lib/economics-utils';
import { calculateSurpluses } from './calculate-surplus';
import { createPriceFloor } from './price-floor';
import { map } from '@/lib/utils';

export const Graph = () => {
    const { width, height } = useResize();
    const theme = useResolvedTheme();
    const { getActiveTab, updateComputed, updateAdjustmentResult, updateAdjustment } = useMarketTabsStore();
    const { app, isInitialised } = useApplication();

    if (!isInitialised) return null;

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    const display = useCallback(() => {
        if (!app) return;
        console.log('display');

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

        const axisContainer = createAxisContainer({
            view,
            bounds,
            theme,
        });

        const pointsContainer = createPointsContainer({
            view,
            demandColor: activeTab.curves.demand.color,
            supplyColor: activeTab.curves.supply.color,
            bounds,
            rows,
        });

        const demandData = rows
            .filter((row) => activeTab.curves.demand.fit !== 'logarithmic' || row.qd > 0)
            .map((row) => [row.qd, row.price]);

        const supplyData = rows
            .filter((row) => activeTab.curves.supply.fit !== 'logarithmic' || row.qs > 0)
            .map((row) => [row.qs, row.price]);

        const curvesContainer = new Container();

        const {
            success: demandSuccess,
            equation: demandEquation,
            // derivative: demandDerivative,
            integral: demandIntegral,
            points: demandPoints,
        } = createCurve({
            view,
            bounds,
            absoluteBounds: activeTab.absoluteBounds,
            data: demandData,
            fitType: activeTab.curves.demand.fit,
            color: activeTab.curves.demand.color,
            curveType: 'demand',
            render: true,
            curvesContainer,
        });

        const {
            success: supplySuccess,
            equation: supplyEquation,
            // derivative: supplyDerivative,
            integral: supplyIntegral,
            points: supplyPoints,
        } = createCurve({
            view,
            bounds,
            absoluteBounds: activeTab.absoluteBounds,
            data: supplyData,
            fitType: activeTab.curves.supply.fit,
            color: activeTab.curves.supply.color,
            curveType: 'supply',
            render: true,
            curvesContainer,
        });

        const equilibriumContainer = new Container();
        const controlContainer = new Container();
        const areaContainer = new Container();
        
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;

        if (demandSuccess && supplySuccess) {
            const { intersect, price, quantity } = createEquilibrium({
                view,
                theme,
                demandEquation,
                supplyEquation,
                bounds,
                absoluteBounds: activeTab.absoluteBounds,
                equilibriumContainer,
                render: activeTab.adjustment.mode !== 'demand_shift' && activeTab.adjustment.mode !== 'supply_shift',
                passive: activeTab.adjustment.mode !== 'none' && activeTab.adjustment.mode !== 'point_elasticity',
            });

            if (intersect) {
                const { arcPED, arcPES } = calculateArcElasticities(
                    price,
                    quantity,
                    demandEquation,
                    supplyEquation,
                    activeTab.absoluteBounds
                );

                const { consumerSurplus, producerSurplus } = calculateSurpluses({
                    price,
                    quantity,
                    demandPoints,
                    supplyPoints,
                    demandIntegral,
                    supplyIntegral,
                    demandColor: activeTab.curves.demand.color,
                    supplyColor: activeTab.curves.supply.color,
                    view,
                    bounds,
                    absoluteBounds: activeTab.absoluteBounds,
                    areaContainer,
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
                    const priceFloorResult = createPriceFloor({
                        price,
                        quantity,
                        floor: activeTab.adjustment.price,
                        view,
                        theme,
                        demandPoints,
                        supplyPoints,
                        demandIntegral,
                        supplyIntegral,
                        demandColor: activeTab.curves.demand.color,
                        supplyColor: activeTab.curves.supply.color,
                        origionalSurplus: total,
                        demandEquation,
                        supplyEquation,
                        bounds,
                        absoluteBounds: activeTab.absoluteBounds,
                        equilibriumContainer,
                        controlContainer,
                    });

                    // Set up dragging for the floor line
                    const { floorLine } = priceFloorResult;
                    let dragTarget: Graphics | null = null;

                    const onDragStart = () => {
                        floorLine.alpha = 0.7;
                        dragTarget = floorLine;
                        app.stage.cursor = 'ns-resize';
                        app.stage.on('pointermove', onDragMove);
                    };

                    const onDragMove = (event: any) => {
                        if (dragTarget) {
                            // Convert screen Y to price value
                            const screenY = event.global.y;
                            const clampedY = Math.max(view.top, Math.min(view.bottom, screenY));
                            const newPrice = bounds.priceMax - map(clampedY - view.top, 0, view.bottom - view.top, 0, bounds.priceMax - bounds.priceMin);
                            
                            // Clamp to bounds
                            const clampedPrice = Math.max(bounds.priceMin, Math.min(bounds.priceMax, newPrice));
                            
                            // Update the store
                            updateAdjustment(activeTab.market.id, {
                                price: clampedPrice
                            });
                        }
                    };

                    const onDragEnd = () => {
                        if (dragTarget) {
                            app.stage.off('pointermove', onDragMove);
                            app.stage.cursor = 'default';
                            floorLine.alpha = 1;
                            dragTarget = null;
                        }
                    };

                    floorLine.on('pointerdown', onDragStart);
                    app.stage.on('pointerup', onDragEnd);
                    app.stage.on('pointerupoutside', onDragEnd);

                    if (priceFloorResult.intersects) {
                        const { qd, qs, cs, ps, ts, dwl } = priceFloorResult;
                        updateAdjustmentResult(activeTab.market.id, {
                            price: activeTab.adjustment.price,
                            quantity_demanded: qd,
                            quantity_supplied: qs,
                            consumer_surplus: cs,
                            producer_surplus: ps,
                            total_surplus: ts,
                            deadweight_loss: dwl,
                        });
                    } else {
                        updateAdjustment(activeTab.market.id, {
                            result: undefined,
                        });
                    }
                }
            }
        }

        app.stage.addChild(areaContainer);
        app.stage.addChild(pointsContainer);
        app.stage.addChild(curvesContainer);
        app.stage.addChild(equilibriumContainer);
        app.stage.addChild(controlContainer);
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

    return null;
};
