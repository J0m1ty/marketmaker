import { Box, useColorMode } from "@chakra-ui/react";
import { Application, Container, Graphics, Text } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { Market, XY } from "../types";
import { polynomial, Result } from "regression";

const findIntersection = (demand: Result, supply: Result, range: [number, number], tolerance = 0.00001, maxIterations = 1000): XY | null => {
    let [left, right] = range;

    const f = (x: number) => demand.predict(x)[1] - supply.predict(x)[1];

    if (Math.abs(f(left)) < tolerance) return { x: left, y: demand.predict(left)[1] };
    if (Math.abs(f(right)) < tolerance) return { x: right, y: demand.predict(right)[1] };

    let iteration = 0;

    while (right - left > tolerance && iteration < maxIterations) {
        const mid = (left + right) / 2;
        const fMid = f(mid);

        if (Math.abs(fMid) < tolerance) {
            return { x: mid, y: demand.predict(mid)[1] };
        }

        if (f(left) * fMid < 0) {
            right = mid;
        } else {
            left = mid;
        }

        iteration += 1;

        // Newton-Raphson step
        const derivative = (f(mid + tolerance) - f(mid - tolerance)) / (2 * tolerance);
        if (Math.abs(derivative) > tolerance) {
            const newMid = mid - fMid / derivative;

            if (newMid > left && newMid < right) {
                const fNewMid = f(newMid);
                if (Math.abs(fNewMid) < tolerance) {
                    return { x: newMid, y: demand.predict(newMid)[1] };
                }

                if (f(left) * fNewMid < 0) {
                    right = newMid;
                } else {
                    left = newMid;
                }
            }
        }
    }

    console.warn("Intersection not found within tolerance and maximum iterations.");
    return null;
};

const integratePolynomial = (coeffs: number[], A: number, B: number) => {
    const n = coeffs.length;
    const integral = (x: number) => coeffs.reduce((acc, coeff, i) => acc + coeff * x ** (n - i) / (n - i), 0);
    return integral(B) - integral(A);
}

const differentiatePolynomial = (coeffs: number[]) => {
    return coeffs.slice(0, -1).map((coeff, i) => coeff * (coeffs.length - i - 1));
}

const evaluatePolynomial = (coeffs: number[], x: number): number => {
    return coeffs.reduce((acc, coeff, i) => acc + coeff * Math.pow(x, coeffs.length - i - 1), 0);
};

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
    de: string;
    se: string;
    eod: number;
    eos: number;
    eodc: string;
    eosc: string;
    cs: number;
    ps: number;
    ts: number;
}

export const isMarketData = (data: any): data is MarketData => {
    return typeof data === "object" && "ep" in data && "eq" in data && "tr" in data && "de" in data && "se" in data && "eod" in data && "eos" in data && "eodc" in data && "eosc" in data && "cs" in data && "ps" in data && "ts" in data;
}

const map = (value: number, min1: number, max1: number, min2: number, max2: number) => min2 + (value - min1) * (max2 - min2) / (max1 - min1);

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
        ref.current.appendChild(create.canvas);
        setApp(create);
    }

    const display = async () => {
        if (!app) return;

        const data: Partial<MarketData> = {};

        const demand = polynomial(market.demand.map(point => [point.quantity, point.price]), { order: 3, precision: 6 });
        const supply = polynomial(market.supply.map(point => [point.quantity, point.price]), { order: 3, precision: 6 });
        data.de = demand.string;
        data.se = supply.string;

        const priceMin = Math.min(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));
        const priceMax = Math.max(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));

        const quantityMin = Math.min(...market.demand.map(point => point.quantity), ...market.supply.map(point => point.quantity));
        const quantityMax = Math.max(...market.demand.map(point => point.quantity), ...market.supply.map(point => point.quantity));

        const margin = 25;
        const ticks = 9;
        const left = margin;
        const right = app.screen.width - margin;
        const top = margin;
        const bottom = app.screen.height - margin;

        const createAxis = new Container();
        const createAxisText = new Container();

        const xAxis = new Graphics();
        xAxis.moveTo(left, bottom).lineTo(right, bottom).stroke({ color: 0xffffff, width: 2 });

        for (let i = left; i <= right; i += (right - left) / ticks) {
            xAxis
                .moveTo(i, app.screen.height - margin)
                .lineTo(i, app.screen.height - margin - 10)
                .stroke({ color: 0xffffff, width: 2 });

            const q = map(i, left, right, quantityMin, quantityMax);

            const label = new Text({ text: Math.floor(q), anchor: { x: 0.5, y: 0.5 }, style: { fontSize: 12, fill: 0xffffff, fontFamily: "Arial", fontWeight: "lighter" } });
            label.position.set(i, app.screen.height - margin + 10);
            createAxisText.addChild(label);
        }
        createAxis.addChild(xAxis);
        setAxes(createAxis);
        setAxesText(createAxisText);

        const yAxis = new Graphics();
        yAxis.moveTo(left, top).lineTo(left, bottom).stroke({ color: 0xffffff, width: 2 });
        for (let i = top; i <= bottom; i += (bottom - top) / ticks) {
            yAxis
                .moveTo(left, i)
                .lineTo(left + 10, i)
                .stroke({ color: 0xffffff, width: 2 });

            const p = map(i, bottom, top, priceMin, priceMax);

            const label = new Text({ text: Math.round(p), anchor: { x: 1, y: 0.5 }, style: { fontSize: 12, fill: 0xffffff, fontFamily: "Arial", fontWeight: "lighter" } });
            label.position.set(left - 3, i - 1);
            createAxisText.addChild(label);
        }
        createAxis.addChild(yAxis);

        const createDemand = new Graphics();
        
        let first = true;
        let last: [ number, number ] | null = null;
        for (let i = left; i < right; i += 1) {
            const quantity = map(i, left, right, quantityMin, quantityMax);
            const price = demand.predict(quantity)[1];
            const j = map(price, priceMin, priceMax, bottom, top);

            if (j < top || j > bottom) {
                last = [ i, Math.min(Math.max(j, top), bottom) ];
                continue;
            }

            if (first) {
                createDemand.moveTo(last ? last[0] : i, last ? last[1] : j);
                first = false;
            }
            else createDemand.lineTo(i, j);
        }

        createDemand.stroke({ color: 0xffffff, width: 2 });
        setDemandCurve(createDemand);

        const createSupply = new Graphics();
        
        first = true;
        last = null;
        for (let i = left; i < right; i += 1) {
            const quantity = map(i, left, right, quantityMin, quantityMax);
            const price = supply.predict(quantity)[1];
            const j = map(price, priceMin, priceMax, bottom, top);

            if (j < top || j > bottom) {
                last = [ i, Math.min(Math.max(j, top), bottom) ];
                continue;
            }

            if (first) {
                createSupply.moveTo(last ? last[0] : i, last ? last[1] : j);
                first = false;
            }
            else {
                createSupply.lineTo(i, j);
            }
        }

        createSupply.stroke({ color: 0xffffff, width: 2 });
        setSupplyCurve(createSupply);

        const intersection = findIntersection(demand, supply, [quantityMin, quantityMax]);
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
                const price = demand.predict(quantity)[1];
                const j = map(price, priceMin, equilibriumPrice, bottom, ey);

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
                const price = supply.predict(quantity)[1];
                const j = Math.min(Math.max(map(price, priceMin, equilibriumPrice, bottom, ey),  ey), bottom);

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

            const demandDerivativeCoeffs = differentiatePolynomial(demand.equation);
            const supplyDerivativeCoeffs = differentiatePolynomial(supply.equation);

            const demandSlope = evaluatePolynomial(demandDerivativeCoeffs, equilibriumQuantity);
            const supplySlope = evaluatePolynomial(supplyDerivativeCoeffs, equilibriumQuantity);

            const elasticityOfDemand = (demandSlope * equilibriumQuantity) / equilibriumPrice;
            const elasticityOfSupply = (supplySlope * equilibriumQuantity) / equilibriumPrice;

            data.eod = elasticityOfDemand;
            data.eos = elasticityOfSupply;
            data.eodc = categorizeElasticity(elasticityOfDemand);
            data.eosc = categorizeElasticity(elasticityOfSupply);

            const demandIntegral = integratePolynomial(demand.equation, quantityMin, equilibriumQuantity);
            const supplyIntegral = integratePolynomial(supply.equation, quantityMin, equilibriumQuantity);
            const equilibriumArea = (equilibriumQuantity - quantityMin) * equilibriumPrice;

            const consumerSurplus = demandIntegral - equilibriumArea;
            const producerSurplus = equilibriumArea - supplyIntegral;
            
            data.cs = consumerSurplus;
            data.ps = producerSurplus;
            data.ts = consumerSurplus + producerSurplus;
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