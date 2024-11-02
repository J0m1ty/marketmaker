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

const differentiatePolynomial = (coeffs: number[]) => coeffs.slice(0, -1).map((coeff, i) => coeff * (coeffs.length - i - 1));

const categorizeElasticity = (value: number) => {
    value = Math.abs(value);
    if (value === 0) return "perfectly inelastic";
    else if (value > 0 && value < 1) return "inelastic";
    else if (value === 1) return "unit elastic";
    else if (value < Infinity) return "elastic";
    else return "perfectly elastic";
}

function MarketGraph({ market }: { market: Market }) {
    const [app, setApp] = useState<Application | null>(null);
    const [demandCurve, setDemandCurve] = useState<Graphics | null>(null);
    const [supplyCurve, setSupplyCurve] = useState<Graphics | null>(null);
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

        console.log("Rendering market...");
        const demand = polynomial(market.demand.map(point => [point.price, point.quantity]), { order: 3 });
        const supply = polynomial(market.supply.map(point => [point.price, point.quantity]), { order: 3 });

        const priceMin = Math.min(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));
        const priceMax = Math.max(...market.demand.map(point => point.price), ...market.supply.map(point => point.price));

        const quantityMin = Math.min(demand.predict(priceMin)[1], supply.predict(priceMin)[1], demand.predict(priceMax)[1], supply.predict(priceMax)[1]);
        const quantityMax = Math.max(demand.predict(priceMin)[1], supply.predict(priceMin)[1], demand.predict(priceMax)[1], supply.predict(priceMax)[1]);

        console.log("Price range: $", priceMin.toFixed(2), "to $", priceMax.toFixed(2));
        console.log("Quantity range:", quantityMin.toFixed(2), "to", quantityMax.toFixed(2));

        const margin = 25;
        const ticks = 9;
        const left = margin;
        const right = app.screen.width - margin;
        const top = margin;
        const bottom = app.screen.height - margin;

        const createAxis = new Container();

        const yAxis = new Graphics();
        yAxis.moveTo(left, top - 1).lineTo(left, bottom).stroke({ color: 0xffffff, width: 2 });
        for (let i = top; i <= bottom; i += (bottom - top) / ticks) {
            yAxis
                .moveTo(left, i)
                .lineTo(left + 10, i)
                .stroke({ color: 0xffffff, width: 2 });

            const q = (i - bottom) / (top - bottom) * (quantityMax - quantityMin) + quantityMin;

            const label = new Text({ text: Math.round(q), anchor: { x: 1, y: 0.5 }, style: { fontSize: 12, fill: 0xffffff } });
            label.position.set(left - 3, i - 1);
            createAxis.addChild(label);
        }
        createAxis.addChild(yAxis);

        const xAxis = new Graphics();
        xAxis.moveTo(left, bottom).lineTo(right + 1, bottom).stroke({ color: 0xffffff, width: 2 });

        for (let i = left; i <= right; i += (right - left) / ticks) {
            xAxis
                .moveTo(i, app.screen.height - margin)
                .lineTo(i, app.screen.height - margin - 10)
                .stroke({ color: 0xffffff, width: 2 });

            const x = (i - left) / (right - left) * (priceMax - priceMin) + priceMin;

            const label = new Text({ text: Math.floor(x), anchor: { x: 0.5, y: 0.5 }, style: { fontSize: 12, fill: 0xffffff } });
            label.position.set(i, app.screen.height - margin + 10);
            createAxis.addChild(label);
        }
        createAxis.addChild(xAxis);
        setAxes(createAxis);

        const createDemand = new Graphics();
        for (let i = left; i < right; i += 1) {
            const x = (i - left) / (right - left);
            const y = demand.predict(x * (priceMax - priceMin) + priceMin)[1];
            const j = bottom - ((y - quantityMin) / (quantityMax - quantityMin)) * (bottom - top);

            if (i === left) createDemand.moveTo(i, j);
            else createDemand.lineTo(i, j);
        }

        createDemand.stroke({ color: 0xffffff, width: 2 });
        setDemandCurve(createDemand);

        const createSupply = new Graphics();
        for (let i = left; i < right; i += 1) {
            const x = (i - left) / (right - left);
            const y = supply.predict(x * (priceMax - priceMin) + priceMin)[1];
            const j = bottom - ((y - quantityMin) / (quantityMax - quantityMin)) * (bottom - top);

            if (i === left) createSupply.moveTo(i, j);
            else createSupply.lineTo(i, j);
        }

        createSupply.stroke({ color: 0xffffff, width: 2 });
        setSupplyCurve(createSupply);

        const intersection = findIntersection(demand, supply, [priceMin, priceMax]);
        if (intersection) {

            const equilibriumPrice = intersection.x;
            const equilibriumQuantity = intersection.y;

            console.log("Equilibrium price: $", equilibriumPrice.toFixed(2));
            console.log("Equilibrium quantity:", equilibriumQuantity.toFixed(2));

            const ex = left + (equilibriumPrice - priceMin) / (priceMax - priceMin) * (right - left);
            const ey = bottom - ((equilibriumQuantity - quantityMin) / (quantityMax - quantityMin)) * (bottom - top);

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
                .lineTo(ex, ey)
                .lineTo(left, ey)
                .stroke({ color: 0xffffff, width: 1 });
            createAxis.addChild(equibAxes);

            const createConsumerSurplus = new Graphics();
            for (let i = left; i < ex; i += 1) {
                const x = (i - left) / (right - left) * (priceMax - priceMin) + priceMin;
                const y = demand.predict(x)[1];
                const j = bottom - ((y - quantityMin) / (quantityMax - quantityMin)) * (bottom - top);

                if (i === left) createConsumerSurplus.moveTo(i, j);
                else createConsumerSurplus.lineTo(i, j);
            }

            createConsumerSurplus.lineTo(left, ey);
            createConsumerSurplus.closePath();
            createConsumerSurplus.fill({ color: 0xffffff, alpha: 0.8 });
            app.stage.addChild(createConsumerSurplus);
            setConsumerSurplus(createConsumerSurplus);

            const createProducerSurplus = new Graphics();
            for (let i = left; i < ex; i += 1) {
                const x = (i - left) / (right - left) * (priceMax - priceMin) + priceMin;
                const y = supply.predict(x)[1];
                const j = bottom - ((y - quantityMin) / (quantityMax - quantityMin)) * (bottom - top);

                if (i === left) createProducerSurplus.moveTo(i, j);
                else createProducerSurplus.lineTo(i, j);
            }

            createProducerSurplus.lineTo(left, ey);
            createProducerSurplus.closePath();
            createProducerSurplus.fill({ color: 0xffffff, alpha: 0.8 });
            app.stage.addChild(createProducerSurplus);
            setProducerSurplus(createProducerSurplus);

            app.stage.addChild(createAxis);
            app.stage.addChild(createDemand);
            app.stage.addChild(createSupply);
            app.stage.addChild(createEquilibrium);

            const totalRevenue = equilibriumPrice * equilibriumQuantity;
            console.log("Total revenue: $", totalRevenue.toFixed(2));

            const demandDerivativeCoeffs = differentiatePolynomial(demand.equation);
            const supplyDerivativeCoeffs = differentiatePolynomial(supply.equation);

            const demandSlope = demandDerivativeCoeffs.reduce((acc, coeff, i) => acc + coeff * equilibriumPrice ** (demandDerivativeCoeffs.length - i - 1), 0);
            const supplySlope = supplyDerivativeCoeffs.reduce((acc, coeff, i) => acc + coeff * equilibriumPrice ** (supplyDerivativeCoeffs.length - i - 1), 0);

            const elasticityOfDemand = (demandSlope * equilibriumPrice) / equilibriumQuantity;
            const elasticityOfSupply = (supplySlope * equilibriumPrice) / equilibriumQuantity;

            console.log("Elasticity of demand:", elasticityOfDemand.toFixed(2) + " (" + categorizeElasticity(elasticityOfDemand) + ")");
            console.log("Elasticity of supply:", elasticityOfSupply.toFixed(2) + " (" + categorizeElasticity(elasticityOfSupply) + ")");

            const demandIntegral = integratePolynomial(demand.equation, priceMin, equilibriumPrice);
            const supplyIntegral = integratePolynomial(supply.equation, priceMin, equilibriumPrice);
            const equilibriumArea = (equilibriumPrice - priceMin) * equilibriumQuantity;

            const consumerSurplus = demandIntegral - equilibriumArea;
            const producerSurplus = equilibriumArea - supplyIntegral;

            console.log("Consumer surplus: $", consumerSurplus.toFixed(2));
            console.log("Producer surplus: $", producerSurplus.toFixed(2));
        }
        else {
            app.stage.addChild(createAxis);
            app.stage.addChild(createDemand);
            app.stage.addChild(createSupply);
        }
    }

    useEffect(() => {
        setup();

        return () => {
            app?.destroy(true, true);
            setApp(null);
        }
    }, []);

    useEffect(() => {
        display();
    }, [app]);

    useEffect(() => {
        if (demandCurve) demandCurve.tint = colorMode === "light" ? 0xf82121 : 0x891212;
        if (supplyCurve) supplyCurve.tint = colorMode === "light" ? 0x101bfe : 0x090F91;
        if (axes) axes.tint = colorMode === "light" ? 0x000000 : 0xf2f2f2;
        if (equilibrium) equilibrium.tint = colorMode === "light" ? 0xc800c7 : 0xffffff;
        if (consumerSurplus) consumerSurplus.tint = colorMode === "light" ? 0xffc2c2 : 0x6F5454;
        if (producerSurplus) producerSurplus.tint = colorMode === "light" ? 0x979fff : 0x41456F;
    }, [colorMode, demandCurve, supplyCurve, axes, equilibrium, consumerSurplus, producerSurplus]);

    return <Box width={500} height={500} ref={ref} />
}

export default MarketGraph;