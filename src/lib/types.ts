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

export const CurveFits = ['linear', 'exponential', 'logarithmic', 'power', 'polynomial'] as const;

export type CurveFitType = (typeof CurveFits)[number];

export type AxisBounds = {
    type: 'auto' | 'manual';
    priceMin: number;
    priceMax: number;
    quantityMin: number;
    quantityMax: number;
};

export type CurveBounds = {
    supply: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    demand: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
    combined: {
        priceMin: number;
        priceMax: number;
        quantityMin: number;
        quantityMax: number;
    };
};

export type EquilibriumResult = {
    equilibrium_price: number;
    equilibrium_quantity: number;
};

export type QuantityResult = {
    price: number;
    quantity_demanded: number;
    quantity_supplied: number;
};

export type InterventionResult = {
    buyer_price: number;
    seller_price: number;
    quantity_traded: number;
}

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

export const AdjustmentModes = [
    'none',
    'price_floor',
    'price_ceiling',
    'per_unit_tax',
    'per_unit_subsidy',
    'demand_shift',
    'supply_shift',
    'point_elasticity',
] as const;

export type Adjustment = DiscriminatedUnion<
    'mode',
    {
        none: {};
        price_floor: {
            type: 'intervention';
            price: number;
            result?: QuantityResult & WelfareResult;
        };
        price_ceiling: {
            type: 'intervention';
            price: number;
            result?: QuantityResult & WelfareResult;
        };
        per_unit_tax: {
            type: 'intervention';
            amount: number;
            side: 'supplier' | 'consumer';
            result?: InterventionResult & WelfareResult & TaxResult;
        };
        per_unit_subsidy: {
            type: 'intervention';
            amount: number;
            side: 'supplier' | 'consumer';
            result?: InterventionResult & WelfareResult & SubsidyResult;
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
    },
    (typeof AdjustmentModes)[number]
>;

export const groupedAdjustments: Record<string, (typeof AdjustmentModes)[number][]> = {
    none: ['none'],
    intervention: ['price_floor', 'price_ceiling', 'per_unit_tax', 'per_unit_subsidy'],
    change: ['demand_shift', 'supply_shift'],
    calculation: ['point_elasticity'],
};

export type MarketData =
    | { intersect: false }
    | {
          intersect: true;
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
    ranges: CurveBounds;
    curves: {
        selected: 'demand' | 'supply';
        demand: { fit: CurveFitType; color: string };
        supply: { fit: CurveFitType; color: string };
    };
    adjustment: Adjustment;
    computed?: MarketData;
};
