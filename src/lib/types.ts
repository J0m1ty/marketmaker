import type { DiscriminatedUnion } from 'ts-safe-union';

export type MarketRow = {
    id: number;
    price: string;
    qd: string;
    qs: string;
};

export type MarketFile = {
    createdAt: string;
    rows: MarketRow[];
};

export type Market = {
    id: string;
    name: string;
    file: MarketFile;
};

export type CurveFitType =
    | 'linear'
    | 'exponential'
    | 'logarithmic'
    | 'power'
    | 'polynomial';

export type AxisBounds =
    | 'auto'
    | {
          priceMin: number;
          priceMax: number;
          quantityMin: number;
          quantityMax: number;
      };

export type Intervention = DiscriminatedUnion<
    'type',
    {
        none: {};
        price_floor: { price: number };
        price_ceiling: { price: number };
        per_unit_tax: {
            amount: number;
            side: 'supplier' | 'consumer';
        };
        per_unit_subsidy: {
            amount: number;
            side: 'supplier' | 'consumer';
        };
        point_elasticity: { quantity: number };
    }
>;

export type MarketTab = {
    market: Market;
    bounds: AxisBounds;
    curves: {
        demand: { fit: CurveFitType; color: string };
        supply: { fit: CurveFitType; color: string };
    };
    intervention: Intervention;
};
