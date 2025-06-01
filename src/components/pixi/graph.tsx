import { useMarketTabsStore } from "@/hooks/markets.store";
import { useResolvedTheme } from "../theme-provider";
import { useResize } from "./resize-provider";

export const Graph = () => {
    const { width, height } = useResize();
    const { getActiveTab } = useMarketTabsStore();
    const theme = useResolvedTheme();

    return (
        <pixiContainer>
            <pixiGraphics draw={(graphics) => {
                graphics.clear();
                graphics.setFillStyle(theme === 'dark' ? 0xffffff : 0x000000);
                graphics.circle(width / 2, height / 2, 50);
                graphics.fill();
            }} />
            <pixiText
                text={getActiveTab()?.market.name || "No active market"}
                style={{
                    fill: theme === 'dark' ? '#ff0000' : '#00ffff'
                }}
                anchor={{
                    x: 0.5,
                    y: 0.5
                }}
                position={{
                    x: width / 2,
                    y: height / 2
                }}
            />
        </pixiContainer>
    )
}