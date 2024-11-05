import { Stack, Text, useColorModeValue } from "@chakra-ui/react";
import MarketGraph, { isMarketData, MarketData } from "./MarketGraph";
import { Market } from "../types";
import { useEffect, useState } from "react";

function FileDisplay({ content }: { content: string }) {
    const [ market, setMarket ] = useState<Market | null>(null);
    const [ marketData, setMarketData ] = useState<MarketData | null>(null);

    const titleColor = useColorModeValue("#000000", "#93a0a5");
    const contentColor = useColorModeValue("#000000", "#6a7478");

    useEffect(() => {
        setMarket(content.split("\n").slice(1, -1).map(line => {
            const [price, qd, qs] = line.split(",").map(Number);
            return [{ price, quantity: qd }, { price, quantity: qs }];
        }).reduce((market, [d, s]) => {
            market.demand.push(d);
            market.supply.push(s);
            return market;
        }, { demand: [], supply: [] } as Market));
    }, []);

    const marketDataCallback = (data: Partial<MarketData>) => {
        if (isMarketData(data)) setMarketData(data);
    }

    if (!market) {
        return <Text>Loading...</Text>
    }

    return (
        <Stack flex={1} px={10} py={2} flexDir={"row"} display={"flex"} gap={10}>
            <MarketGraph market={market} callback={marketDataCallback} />
            { marketData && <Stack gap={10} color={contentColor} mt={5}>
                <Stack gap={0}>
                    <Text fontSize={"xl"} color={titleColor}>Market Overview</Text>
                    <Text>Equilibrium Price: ${marketData.ep.toFixed(3)}</Text>
                    <Text>Equilibrium Quantity: {marketData.eq.toFixed(3)}</Text>
                    <Text>Total Revenue: ${marketData.tr.toFixed(3)}</Text>
                </Stack>
                <Stack gap={0}>
                    <Text fontSize={"xl"} color={titleColor}>Price Sensitivity</Text>
                    <Text>Elasticity of Demand: {marketData.eod.toFixed(2)} ({marketData.eodc})</Text>
                    <Text>Elasticity of Supply: {marketData.eos.toFixed(2)} ({marketData.eosc})</Text>
                </Stack>
                <Stack gap={0}>
                    <Text fontSize={"xl"} color={titleColor}>Market Surplus</Text>
                    <Text>Consumer Surplus: ${marketData.cs.toFixed(1)}</Text>
                    <Text>Producer Surplus: ${marketData.ps.toFixed(1)}</Text>
                    <Text>Total Surplus: ${marketData.ts.toFixed(1)}</Text>
                </Stack>
            </Stack> }
        </Stack>
    )
}

export default FileDisplay;