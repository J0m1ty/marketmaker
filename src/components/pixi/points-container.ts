import type { MarketRow } from '@/lib/types';
import { Container, Graphics } from 'pixi.js';

interface PointsConfig {
    view: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    demandColor: string;
    supplyColor: string;
    bounds: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    rows: MarketRow[];
}

export const createPointsContainer = ({
    view: { left, right, top, bottom },
    demandColor,
    supplyColor,
    bounds,
    rows,
}: PointsConfig): Container => {
    const container = new Container();

    rows.forEach((row) => {
        const { price, qd, qs } = row;

        if (price >= bounds.priceMin && price <= bounds.priceMax) {
            if (qd >= bounds.quantityMin && qd <= bounds.quantityMax) {
                const demandPoint = new Graphics();
                const x =
                    left + ((qd - bounds.quantityMin) / (bounds.quantityMax - bounds.quantityMin)) * (right - left);
                const y = bottom - ((price - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * (bottom - top);

                demandPoint.circle(x, y, 2).fill({ color: demandColor, alpha: 0.5 });
                container.addChild(demandPoint);
            }

            if (qs >= bounds.quantityMin && qs <= bounds.quantityMax) {
                const supplyPoint = new Graphics();
                const x =
                    left + ((qs - bounds.quantityMin) / (bounds.quantityMax - bounds.quantityMin)) * (right - left);
                const y = bottom - ((price - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * (bottom - top);

                supplyPoint.circle(x, y, 2).fill({ color: supplyColor, alpha: 0.5 });
                container.addChild(supplyPoint);
            }
        }
    });

    return container;
};
