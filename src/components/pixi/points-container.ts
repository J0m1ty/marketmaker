import { Container, Graphics } from 'pixi.js';

interface PointsConfig {
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
    demand: { data: number[][]; color: string };
    supply: { data: number[][]; color: string };
}

export const createPointsContainer = ({
    view: { left, right, top, bottom },
    bounds,
    demand,
    supply,
}: PointsConfig): Container => {
    const container = new Container();

    demand.data.forEach(([quantity, price]) => {
        if (
            price >= bounds.priceMin &&
            price <= bounds.priceMax &&
            quantity >= bounds.quantityMin &&
            quantity <= bounds.quantityMax
        ) {
            const demandPoint = new Graphics();
            const x =
                left + ((quantity - bounds.quantityMin) / (bounds.quantityMax - bounds.quantityMin)) * (right - left);
            const y = bottom - ((price - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * (bottom - top);

            demandPoint.circle(x, y, 2).fill({ color: demand.color, alpha: 0.5 });
            container.addChild(demandPoint);
        }
    });

    supply.data.forEach(([quantity, price]) => {
        if (
            price >= bounds.priceMin &&
            price <= bounds.priceMax &&
            quantity >= bounds.quantityMin &&
            quantity <= bounds.quantityMax
        ) {
            const supplyPoint = new Graphics();
            const x =
                left + ((quantity - bounds.quantityMin) / (bounds.quantityMax - bounds.quantityMin)) * (right - left);
            const y = bottom - ((price - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * (bottom - top);

            supplyPoint.circle(x, y, 2).fill({ color: supply.color, alpha: 0.5 });
            container.addChild(supplyPoint);
        }
    });

    return container;
};
