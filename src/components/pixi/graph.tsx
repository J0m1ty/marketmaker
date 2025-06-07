import { useApplication } from '@pixi/react';
import { useResolvedTheme } from '../theme-provider';
import { useResize } from './resize-provider';
import { useCallback, useEffect, useRef } from 'react';
import { Container } from 'pixi.js';
import { useMarketTabsStore } from '@/hooks/markets.store';
import { createAxisContainer } from './axis-container';
import { createPointsContainer } from './points-container';
import { createEquilibrium } from './equilibrium-container';
import { createCurve } from './create-curve';
import { calculateArcElasticities } from '@/lib/economics-utils';
import { calculateSurpluses } from './calculate-surplus';
import { createPriceFloor } from './price-floor';
import { setupDragHandler } from '@/lib/drag-handler';

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
            dragCleanupRef.current.forEach(cleanup => cleanup());
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
            success: demand,
            regressionResult: demandResult,
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
            success: supply,
            regressionResult: supplyResult,
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

        if (demand && supply) {
            const { intersect, price, quantity } = createEquilibrium({
                view,
                theme,
                demandResult,
                supplyResult,
                demandCurveFitType: activeTab.curves.demand.fit,
                supplyCurveFitType: activeTab.curves.supply.fit,
                bounds,
                absoluteBounds: activeTab.absoluteBounds,
                equilibriumContainer,
                render: activeTab.adjustment.mode !== 'demand_shift' && activeTab.adjustment.mode !== 'supply_shift',
                passive: activeTab.adjustment.mode !== 'none' && activeTab.adjustment.mode !== 'point_elasticity',
            });

            if (intersect) {
                const { arcPED, arcPES } = calculateArcElasticities(
                    price,
                    demandResult,
                    activeTab.curves.demand.fit,
                    supplyResult,
                    activeTab.curves.supply.fit,
                    activeTab.absoluteBounds
                );

                const { consumerSurplus, producerSurplus } = calculateSurpluses({
                    price,
                    quantity,
                    demandPoints,
                    supplyPoints,
                    demandColor: activeTab.curves.demand.color,
                    supplyColor: activeTab.curves.supply.color,
                    demandResult,
                    supplyResult,
                    demandCurveFitType: activeTab.curves.demand.fit,
                    supplyCurveFitType: activeTab.curves.supply.fit,
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
                        demandColor: activeTab.curves.demand.color,
                        supplyColor: activeTab.curves.supply.color,
                        demandResult,
                        supplyResult,
                        demandCurveFitType: activeTab.curves.demand.fit,
                        supplyCurveFitType: activeTab.curves.supply.fit,
                        origionalSurplus: total,
                        bounds,
                        absoluteBounds: activeTab.absoluteBounds,
                        equilibriumContainer,
                        controlContainer,
                    });

                    const cleanup = setupDragHandler({
                        target: priceFloorResult.floorLine,
                        app,
                        direction: 'vertical',
                        bounds: {
                            min: bounds.priceMin,
                            max: bounds.priceMax,
                            screenMin: view.top,
                            screenMax: view.bottom
                        },
                        onDrag: (newPrice) => updateAdjustment(activeTab.market.id, { price: newPrice }),
                        onDragStart: () => { isDraggingRef.current = true; },
                        onDragEnd: () => { isDraggingRef.current = false; },
                        cursor: 'ns-resize'
                    });

                    dragCleanupRef.current.push(cleanup);

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

    useEffect(() => {
        return () => {
            dragCleanupRef.current.forEach(cleanup => cleanup());
        };
    }, []);

    return null;
};
