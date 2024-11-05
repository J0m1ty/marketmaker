import { Box, useColorMode } from "@chakra-ui/react";
import { Application, Assets, BitmapText, Container, Graphics, Text, TexturePool } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Market, XY } from "../types";
import { CurveInterpolator } from "curve-interpolator";

const pointAt = (curve: CurveInterpolator, x: number, backwards: boolean = false) => {
    const bounds = curve.getBoundingBox();
    const i = map(x, bounds.min[0], bounds.max[0], backwards ? 1 : 0, backwards ? 0 : 1);

    try {
        return curve.getPointAt(i);
    } catch (ignored) { }

    return [-1, -1];
}

const tangetAt = (curve: CurveInterpolator, x: number, backwards: boolean = false) => {
    const bounds = curve.getBoundingBox();
    const i = map(x, bounds.min[0], bounds.max[0], backwards ? 1 : 0, backwards ? 0 : 1);

    return curve.getTangentAt(i);
}

const findIntersection = (demand: CurveInterpolator, supply: CurveInterpolator, range: [number, number], tolerance = 0.1, maxIterations = 1000): XY | null => {
    let [left, right] = range;

    const f = (x: number) => pointAt(demand, x)[1] - pointAt(supply, x, true)[1];

    if (Math.abs(f(left)) < tolerance) return { x: left, y: pointAt(demand, left)[1] };
    if (Math.abs(f(right)) < tolerance) return { x: right, y: pointAt(demand, right)[1] };

    let iteration = 0;

    while (right - left > tolerance && iteration < maxIterations) {
        const mid = (left + right) / 2;
        const fMid = f(mid);

        if (Math.abs(fMid) < tolerance) {
            return { x: mid, y: pointAt(demand, mid)[1] };
        }

        if (f(left) * fMid < 0) {
            right = mid;
        } else {
            left = mid;
        }

        iteration += 1;
    }

    console.warn("No intersection found.");
    return null;
};

export const integrateCurve = (curve: CurveInterpolator, from: number, to: number, reverse: boolean = false, steps = 100) => {
    const dx = (to - from) / steps;
    let sum = 0;

    for (let i = 0; i < steps; i++) {
        const x1 = from + i * dx;
        const x2 = x1 + dx;
        const y1 = pointAt(curve, x1, reverse)[1];
        const y2 = pointAt(curve, x2, reverse)[1];

        sum += (y1 + y2) * 0.5 * dx;
    }

    return sum;
}

const categorizeElasticity = (value: number) => {
    value = Math.abs(value);
    if (value === 0) return "perfectly inelastic";
    else if (value > 0 && value < 1) return "inelastic";
    else if (value === 1) return "unit elastic";
    else if (value < Infinity) return "elastic";
    else return "perfectly elastic";
}

export interface MarketData {
    ep: number;
    eq: number;
    tr: number;
    eod: number;
    eos: number;
    eodc: string;
    eosc: string;
    cs: number;
    ps: number;
    ts: number;
}

export const isMarketData = (data: any): data is MarketData => {
    return typeof data === "object" && "ep" in data && "eq" in data && "tr" in data && "eod" in data && "eos" in data && "eodc" in data && "eosc" in data && "cs" in data && "ps" in data && "ts" in data;
}

const map = (value: number, min1: number, max1: number, min2: number, max2: number) => min2 + (value - min1) * (max2 - min2) / (max1 - min1);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function MarketGraph({ market, callback }: { market: Market, callback: (data: Partial<MarketData>) => void }) {
    const [app, setApp] = useState<Application | null>(null);
    const [demandCurve, setDemandCurve] = useState<Graphics | null>(null);
    const [supplyCurve, setSupplyCurve] = useState<Graphics | null>(null);
    const [axesText, setAxesText] = useState<Container | null>(null);
    const [axes, setAxes] = useState<Container | null>(null);
    const [equilibrium, setEquilibrium] = useState<Graphics | null>(null);
    const [consumerSurplus, setConsumerSurplus] = useState<Graphics | null>(null);
    const [producerSurplus, setProducerSurplus] = useState<Graphics | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const { colorMode } = useColorMode();

    const setup = async () => {
        if (!ref.current || app) return;

        const create = new Application();

        await create.init({ resizeTo: ref.current, antialias: true, backgroundAlpha: 0 });
        TexturePool.textureOptions.scaleMode = 'nearest';

        ref.current.appendChild(create.canvas);

        Assets.addBundle('fonts', [
            { alias: "Roboto", src: "https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxK.woff2" },
            { alias: "RobotoBold", src: "https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlfBBc4.woff2" }
        ]);

        await Assets.load('fonts');

        console.log(Assets);

        setApp(create);
    }

    const display = async () => {
        if (!app) return;

        const data: Partial<MarketData> = {};

        const rawDemand = new CurveInterpolator(market.demand.map(point => [point.quantity, point.price]), { tension: 0.2, alpha: 0.5 });
        const demandLeftTangent = rawDemand.getTangentAtTime(0);
        const demandLeftYIntercept = rawDemand.getPointAt(0)[1] - (1 / Math.tan(Math.atan2(demandLeftTangent[1], demandLeftTangent[0]))) * rawDemand.getPointAt(0)[0];
        const demandRightTanget = rawDemand.getTangentAtTime(1);
        const demandRightXIntercept = rawDemand.getPointAt(1)[0] - (1 / Math.tan(Math.atan2(demandRightTanget[1], demandRightTanget[0]))) * rawDemand.getPointAt(1)[1];
        const demand = new CurveInterpolator([[0, demandLeftYIntercept], ...market.demand.map(point => [point.quantity, point.price]), [demandRightXIntercept, 0]], { tension: 0.2, alpha: 0.5 });

        const rawSupply = new CurveInterpolator(market.supply.map(point => [point.quantity, point.price]), { tension: 0.2, alpha: 0.5 });
        const supplyLeftTanget = rawSupply.getTangentAtTime(1);
        const supplyLeftXIntercept = rawSupply.getPointAt(1)[0] - (1 / Math.tan(Math.atan2(supplyLeftTanget[1], supplyLeftTanget[0]))) * rawSupply.getPointAt(1)[1];
        const supplyLeftYIntercept = rawSupply.getPointAt(1)[1] - (1 / Math.tan(Math.atan2(supplyLeftTanget[1], supplyLeftTanget[0]))) * rawSupply.getPointAt(1)[0];
        let supplyLeftIntercept = supplyLeftYIntercept < 0 ? [supplyLeftXIntercept, 0] : [0, supplyLeftYIntercept];


        const supply = new CurveInterpolator([...market.supply.map(point => [point.quantity, point.price]), supplyLeftIntercept], { tension: 0.2, alpha: 0.5 });

        const intersection = findIntersection(demand, supply, [Math.max(demand.getBoundingBox().min[0], supply.getBoundingBox().min[0]), Math.min(demand.getBoundingBox().max[0], supply.getBoundingBox().max[0])]);

        const priceMin = 0; //Math.min(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));
        const priceMax = intersection 
            ? 4 * intersection.y - priceMin
            : Math.max(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));

        const quantityMin = 0; //Math.min(...market.demand.map(point => point.quantity), ...market.supply.map(point => point.quantity));
        const quantityMax = intersection
            ? 2 * intersection.x - quantityMin
            : Math.max(...market.demand.map(point => point.quantity), ...market.supply.map(point => point.quantity));

        // add support for display window
        // add support for government intervention (price floor, price ceiling, quotas)
        // add support for taxes

        const margin = 35;
        const ticks = 9;
        const left = margin;
        const right = app.screen.width - margin;
        const top = margin;
        const bottom = app.screen.height - margin;

        const createAxis = new Container();
        const createAxisText = new Container();

        const xAxis = new Graphics();
        xAxis.moveTo(left, bottom).lineTo(right, bottom).stroke({ color: 0xffffff, width: 2 });

        const xAxisLabel = new BitmapText({
            text: "Quantity (in units)",
            anchor: { x: 0.5, y: 0 },
            style: { 
                fontSize: 14, 
                fill: 0xffffff, 
                fontFamily: "Kfolcnqeu92fr1mmwulfbbc4"
            }
        });
        xAxisLabel.position.set((left + right) / 2, bottom + 18);
        createAxisText.addChild(xAxisLabel);

        const yAxisLabel = new BitmapText({
            text: "Price (in dollars)",
            anchor: { x: 0.5, y: 0 },
            style: { 
                fontSize: 14, 
                fill: 0xffffff, 
                fontFamily: "Kfolcnqeu92fr1mmwulfbbc4"
            }
        });
        yAxisLabel.rotation = -Math.PI / 2;
        yAxisLabel.position.set(left - 35, (top + bottom) / 2);
        createAxisText.addChild(yAxisLabel);

        for (let i = left; i <= right; i += (right - left) / ticks) {
            xAxis
                .moveTo(i, app.screen.height - margin)
                .lineTo(i, app.screen.height - margin - 10)
                .stroke({ color: 0xffffff, width: 2 });

            const q = map(i, left, right, quantityMin, quantityMax);

            const label = new BitmapText({
                text: Math.round(q),
                style: {
                    fontSize: 12,
                    fill: 0xffffff,
                    fontFamily: "Roboto"
                },
                anchor: { x: 0.5, y: 0.5 },
            });

            label.position.set(i, app.screen.height - margin + 10);
            createAxisText.addChild(label);
        }
        createAxis.addChild(xAxis);
        setAxes(createAxis);

        const yAxis = new Graphics();
        yAxis.moveTo(left, top).lineTo(left, bottom).stroke({ color: 0xffffff, width: 2 });
        for (let i = top; i <= bottom; i += (bottom - top) / ticks) {
            yAxis
                .moveTo(left, i)
                .lineTo(left + 10, i)
                .stroke({ color: 0xffffff, width: 2 });

            const p = map(i, bottom, top, priceMin, priceMax);

            const label = new BitmapText({
                text: Math.round(p),
                style: {
                    fontSize: 12,
                    fill: 0xffffff,
                    fontFamily: "Roboto"
                },
                anchor: { x: 1, y: 0.5 },
            });

            label.position.set(left - 5, i);
            createAxisText.addChild(label);
        }
        createAxis.addChild(yAxis);
        setAxesText(createAxisText);

        const createDemand = new Graphics();

        let first = true;
        for (let i = left; i < right; i += 1) {
            const quantity = map(i, left, right, quantityMin, quantityMax);

            if (quantity < demand.getBoundingBox().min[0] || quantity > demand.getBoundingBox().max[0]) continue;

            const price = pointAt(demand, quantity)[1];
            const j = map(price, priceMin, priceMax, bottom, top);

            if (i < left || i > right || j < top || j > bottom) continue;

            if (first) {
                createDemand.moveTo(i, j);
                first = false;
            }
            else createDemand.lineTo(i, j);
        }

        createDemand.stroke({ color: 0xffffff, width: 2 });
        setDemandCurve(createDemand);

        const createSupply = new Graphics();

        first = true;
        for (let i = left; i < right; i += 1) {
            const quantity = map(i, left, right, quantityMin, quantityMax);

            if (quantity < supply.getBoundingBox().min[0] || quantity > supply.getBoundingBox().max[0]) continue;

            const price = pointAt(supply, quantity, true)[1];
            const j = map(price, priceMin, priceMax, bottom, top);

            if (i < left || i > right || j < top || j > bottom) continue;

            if (first) {
                createSupply.moveTo(i, j);
                first = false;
            }
            else createSupply.lineTo(i, j);
        }

        createSupply.stroke({ color: 0xffffff, width: 2 });
        setSupplyCurve(createSupply);

        if (intersection) {

            const equilibriumQuantity = intersection.x;
            const equilibriumPrice = intersection.y;
            data.eq = equilibriumQuantity;
            data.ep = equilibriumPrice;

            const ex = map(equilibriumQuantity, quantityMin, quantityMax, left, right);
            const ey = map(equilibriumPrice, priceMin, priceMax, bottom, top);

            const createEquilibrium = new Graphics();
            createEquilibrium
                .circle(ex, ey, 5)
                .fill(0xffffff);
            setEquilibrium(createEquilibrium);

            const equibAxes = new Graphics();
            equibAxes
                .moveTo(ex, ey)
                .lineTo(ex, bottom)
                .stroke({ color: 0xffffff, width: 1 });

            equibAxes
                .moveTo(ex, ey)
                .lineTo(left, ey)
                .stroke({ color: 0xffffff, width: 1 });
            createAxis.addChild(equibAxes);

            const createConsumerSurplus = new Graphics();
            for (let i = left; i < ex; i += 1) {
                const quantity = map(i, left, ex, quantityMin, equilibriumQuantity);

                if (quantity < demand.getBoundingBox().min[0] || quantity > demand.getBoundingBox().max[0]) continue;

                const price = pointAt(demand, quantity)[1];
                const j = clamp(map(price, priceMin, equilibriumPrice, bottom, ey), top, ey);

                if (i === left) createConsumerSurplus.moveTo(i, j);
                else createConsumerSurplus.lineTo(i, j);
            }

            createConsumerSurplus.lineTo(ex, ey);
            createConsumerSurplus.lineTo(left, ey);
            createConsumerSurplus.closePath();
            createConsumerSurplus.fill({ color: 0xffffff, alpha: 0.8 });
            app.stage.addChild(createConsumerSurplus);
            setConsumerSurplus(createConsumerSurplus);

            const createProducerSurplus = new Graphics();
            for (let i = left; i < ex; i += 1) {
                const quantity = map(i, left, ex, quantityMin, equilibriumQuantity);
                const price = pointAt(supply, quantity, true)[1];
                const j = clamp(map(price, priceMin, equilibriumPrice, bottom, ey), ey, bottom);

                if (i === left) createProducerSurplus.moveTo(i, j);
                else createProducerSurplus.lineTo(i, j);
            }

            createProducerSurplus.lineTo(ex, ey);
            createProducerSurplus.lineTo(left, ey);
            createProducerSurplus.closePath();
            createProducerSurplus.fill({ color: 0xffffff, alpha: 0.8 });
            app.stage.addChild(createProducerSurplus);
            setProducerSurplus(createProducerSurplus);

            app.stage.addChild(createDemand);
            app.stage.addChild(createSupply);
            app.stage.addChild(createAxis);
            app.stage.addChild(createAxisText);
            app.stage.addChild(createEquilibrium);

            const totalRevenue = equilibriumPrice * equilibriumQuantity;
            data.tr = totalRevenue;

            const demandTangentVector = tangetAt(demand, equilibriumQuantity);
            const demandSlope = demandTangentVector[1] / demandTangentVector[0];
            const elasticityOfDemand = demandSlope * (equilibriumQuantity / equilibriumPrice);

            const supplyTangentVector = tangetAt(supply, equilibriumQuantity, true);
            const supplySlope = supplyTangentVector[1] / supplyTangentVector[0];
            const elasticityOfSupply = supplySlope * (equilibriumQuantity / equilibriumPrice);

            data.eod = elasticityOfDemand;
            data.eos = elasticityOfSupply;
            data.eodc = categorizeElasticity(elasticityOfDemand);
            data.eosc = categorizeElasticity(elasticityOfSupply);

            const consumerSurplus = integrateCurve(demand, 0, equilibriumQuantity) - totalRevenue
            data.cs = consumerSurplus;
            
            const producerSurplus = totalRevenue - integrateCurve(supply, 0, equilibriumQuantity, true);
            data.ps = producerSurplus;
            
            const totalSurplus = consumerSurplus + producerSurplus;
            data.ts = totalSurplus;
        }
        else {
            app.stage.addChild(createDemand);
            app.stage.addChild(createSupply);
            app.stage.addChild(createAxis);
            app.stage.addChild(createAxisText);
        }

        callback(data);
    }

    useEffect(() => {
        setup();

        return () => {
            app?.destroy(true, true);
            setApp(null);
            console.log("Market graph destroyed.");
        }
    }, []);

    useEffect(() => {
        display();
    }, [app]);

    useEffect(() => {
        if (demandCurve) demandCurve.tint = colorMode === "light" ? 0xf82121 : 0x891212;
        if (supplyCurve) supplyCurve.tint = colorMode === "light" ? 0x101bfe : 0x090F91;
        if (axesText) axesText.tint = colorMode === "light" ? 0x000000 : 0xffffff;
        if (axes) axes.tint = colorMode === "light" ? 0x000000 : 0xc2c2c2;
        if (equilibrium) equilibrium.tint = colorMode === "light" ? 0xc800c7 : 0x8c26a0;
        if (consumerSurplus) consumerSurplus.tint = colorMode === "light" ? 0xffc2c2 : 0x6F5454;
        if (producerSurplus) producerSurplus.tint = colorMode === "light" ? 0x979fff : 0x41456F;
    }, [colorMode, demandCurve, supplyCurve, axes, equilibrium, consumerSurplus, producerSurplus, axesText]);

    return <Box width={500} height={500} ref={ref} />
}

export default MarketGraph; 