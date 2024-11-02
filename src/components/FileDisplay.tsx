import { Box } from "@chakra-ui/react";
import MarketGraph from "./MarketGraph";
import { Market, Point } from "../types";

function FileDisplay({ content }: { content: string }) {
    const market = content.split("\n").slice(1, -1).map(line => {
        const [price, qd, qs] = line.split(",").map(Number);
        return [{ price, quantity: qd }, { price, quantity: qs }];
    }).reduce((market, [d, s]) => {
        market.demand.push(d);
        market.supply.push(s);
        return market;
    }, { demand: [], supply: [] } as Market);

    return (
        <Box flex={1} px={10} py={2}>
            <MarketGraph market={market} />
        </Box>
    )
}

export default FileDisplay;