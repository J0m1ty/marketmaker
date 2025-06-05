import { Container, Graphics, Text } from 'pixi.js';

export const formatNumber = (num: number): string => {
    const abs = Math.abs(num);

    if (abs >= 999500000000) {
        return '999B';
    }

    if (abs < 100) {
        return Number(num.toFixed(1)).toString();
    }
    if (abs < 1000) {
        return Math.round(num).toString();
    }
    if (abs < 10000) {
        return Number((num / 1000).toFixed(1)) + 'K';
    }
    if (abs < 100000) {
        return Math.round(num / 1000) + 'K';
    }
    if (abs < 1000000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    if (abs < 10000000) {
        return Number((num / 1000000).toFixed(1)) + 'M';
    }
    if (abs < 100000000) {
        return Math.round(num / 1000000) + 'M';
    }
    if (abs < 1000000000) {
        return (num / 1000000).toFixed(0) + 'M';
    }
    if (abs < 10000000000) {
        return Number((num / 1000000000).toFixed(1)) + 'B';
    }
    return Math.round(num / 1000000000) + 'B';
};

export interface AxisConfig {
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
    theme: string;
}

export const createAxisContainer = ({ view: { left, right, top, bottom }, bounds, theme }: AxisConfig): Container => {
    const axisContainer = new Container();

    const ticks = 9;
    const tickLength = 5;
    const color = theme === 'dark' ? 0xffffff : 0x000000;
    const gridColor = theme === 'dark' ? 0x333333 : 0xdddddd;

    const gridLines = createGridLines({
        left,
        right,
        top,
        bottom,
        ticks,
        gridColor,
    });

    const { xAxis, yAxis } = createAxes({ left, right, top, bottom, color });

    const ticksAndLabels = createTicksAndLabels({
        left,
        right,
        top,
        bottom,
        ticks,
        tickLength,
        color,
        bounds,
    });

    axisContainer.addChild(gridLines);
    axisContainer.addChild(xAxis);
    axisContainer.addChild(yAxis);
    axisContainer.addChild(ticksAndLabels);

    return axisContainer;
};

const createGridLines = ({ left, right, top, bottom, ticks, gridColor }: any) => {
    const gridLines = new Graphics();

    // Vertical grid lines
    for (let i = 1; i < ticks; i++) {
        const x = left + (i / ticks) * (right - left);
        gridLines.moveTo(x, top).lineTo(x, bottom).stroke({
            color: gridColor,
            width: 1,
            alpha: 0.3,
        });
    }

    // Horizontal grid lines
    for (let i = 1; i < ticks; i++) {
        const y = bottom - (i / ticks) * (bottom - top);
        gridLines.moveTo(left, y).lineTo(right, y).stroke({
            color: gridColor,
            width: 1,
            alpha: 0.3,
        });
    }

    return gridLines;
};

const createAxes = ({ left, right, top, bottom, color }: any) => {
    const xAxis = new Graphics();
    xAxis
        .moveTo(left, bottom)
        .lineTo(right + 1, bottom)
        .stroke({
            color,
            width: 2,
        });

    const yAxis = new Graphics();
    yAxis
        .moveTo(left, top - 1)
        .lineTo(left, bottom)
        .stroke({
            color,
            width: 2,
        });

    return { xAxis, yAxis };
};

const createTicksAndLabels = ({ left, right, top, bottom, ticks, tickLength, color, bounds }: any) => {
    const ticksAndLabels = new Container();

    const xTicks = new Graphics();
    for (let i = 0; i <= ticks; i++) {
        const x = left + (i / ticks) * (right - left);
        xTicks
            .moveTo(x, bottom)
            .lineTo(x, bottom + tickLength)
            .stroke({
                color,
                width: 2,
            });

        const quantityValue = bounds.quantityMin + (i / ticks) * (bounds.quantityMax - bounds.quantityMin);
        const xTickLabel = new Text({
            text: formatNumber(quantityValue),
            style: {
                fontFamily: 'Comfortaa',
                fontSize: 10,
                fill: color,
            },
        });
        xTickLabel.anchor.set(0.5, 0);
        xTickLabel.x = x;
        xTickLabel.y = bottom + tickLength + 2;
        ticksAndLabels.addChild(xTickLabel);
    }

    const yAxis = new Graphics();
    yAxis
        .moveTo(left, top - 1)
        .lineTo(left, bottom)
        .stroke({
            color,
            width: 2,
        });

    const yTicks = new Graphics();
    for (let i = 0; i <= ticks; i++) {
        const y = bottom - (i / ticks) * (bottom - top);
        yTicks
            .moveTo(left - tickLength, y)
            .lineTo(left, y)
            .stroke({
                color,
                width: 2,
            });

        const priceValue = bounds.priceMin + (i / ticks) * (bounds.priceMax - bounds.priceMin);
        const yTickLabel = new Text({
            text: formatNumber(priceValue),
            style: {
                fontFamily: 'Comfortaa',
                fontSize: 10,
                fill: color,
            },
        });
        yTickLabel.anchor.set(1, 0.5);
        yTickLabel.x = left - tickLength - 2;
        yTickLabel.y = y;
        ticksAndLabels.addChild(yTickLabel);
    }

    const quantityLabel = new Text({
        text: 'Quantity',
        style: {
            fontFamily: 'Comfortaa',
            fontSize: 14,
            fill: color,
        },
    });
    quantityLabel.anchor.set(0.5, 0);
    quantityLabel.x = (left + right) / 2;
    quantityLabel.y = bottom + tickLength + 15;

    const priceLabel = new Text({
        text: 'Price',
        style: {
            fontFamily: 'Comfortaa',
            fontSize: 14,
            fill: color,
        },
    });
    priceLabel.anchor.set(0.5, 0.5);
    priceLabel.angle = -90;
    priceLabel.x = left - tickLength - 30;
    priceLabel.y = (top + bottom) / 2;

    ticksAndLabels.addChild(xTicks);
    ticksAndLabels.addChild(yTicks);
    ticksAndLabels.addChild(quantityLabel);
    ticksAndLabels.addChild(priceLabel);

    return ticksAndLabels;
};
