import type { DiscriminatedUnion } from 'ts-safe-union';

export type MarketRow = {
    id: number;
    price: number;
    qd: number;
    qs: number;
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

export const CurveFits = [
    'linear',
    'exponential',
    'logarithmic',
    'power',
    'polynomial',
] as const;

export type CurveFitType = typeof CurveFits[number];

export type AxisBounds = {
    type: 'auto' | 'manual';
    priceMin: number;
    priceMax: number;
    quantityMin: number;
    quantityMax: number;
};

export type EquilibriumResult = {
    equilibrium_price: number;
    equilibrium_quantity: number;
};

export type QuantityResult = {
    quantity_demanded: number;
    quantity_supplied: number;
};

export type RevenueResult = {
    total_revenue: number;
};

export type WelfareResult = {
    consumer_surplus: number;
    producer_surplus: number;
    total_surplus: number;
    deadweight_loss: number;
};

export type TaxResult = {
    tax_revenue: number;
    consumer_tax_burden: number;
    producer_tax_burden: number;
};

export type SubsidyResult = {
    subsidy_cost: number;
    consumer_subsidy_benefit: number;
    producer_subsidy_benefit: number;
};

export type ElasticityResult = {
    point_price_elasticity_of_demand: number;
    point_price_elasticity_of_supply: number;
};

export type Adjustment = DiscriminatedUnion<
    'mode',
    {
        none: {};
        price_floor: {
            type: 'intervention';
            price: number;
            result?: QuantityResult & RevenueResult & WelfareResult;
        };
        price_ceiling: {
            type: 'intervention';
            price: number;
            result?: QuantityResult & RevenueResult & WelfareResult;
        };
        per_unit_tax: {
            type: 'intervention';
            amount: number;
            side: 'supplier' | 'consumer';
            result?: QuantityResult & RevenueResult & WelfareResult & TaxResult;
        };
        per_unit_subsidy: {
            type: 'intervention';
            amount: number;
            side: 'supplier' | 'consumer';
            result?: QuantityResult &
            RevenueResult &
            WelfareResult &
            SubsidyResult;
        };
        demand_shift: {
            type: 'change';
            amount: number;
            result?: EquilibriumResult & WelfareResult;
        };
        supply_shift: {
            type: 'change';
            amount: number;
            result?: EquilibriumResult & WelfareResult;
        };
        point_elasticity: {
            type: 'calculation';
            quantity: number;
            result?: ElasticityResult;
        };
    }
>;

export type MarketData = {
    equilibrium_price: number;
    equilibrium_quantity: number;
    arc_price_elasticity_of_demand: number;
    arc_price_elasticity_of_supply: number;
    consumer_surplus: number;
    producer_surplus: number;
    total_surplus: number;
};

export type MarketTab = {
    market: Market;
    bounds: AxisBounds;
    curves: {
        selected: 'demand' | 'supply';
        demand: { fit: CurveFitType; color: string };
        supply: { fit: CurveFitType; color: string };
    };
    adjustment: Adjustment;
    computed?: MarketData;
};
