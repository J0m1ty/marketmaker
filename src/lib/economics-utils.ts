export const findQuantityAtPrice = (
    targetPrice: number, 
    equilibriumQuantity: number, 
    equation: (x: number) => number, 
    bounds: { priceMin: number, priceMax: number, quantityMin: number, quantityMax: number }
) => {
    let closestQ = equilibriumQuantity;
    let smallestDiff = Infinity;

    const samples = 2500;
    for (let i = 0; i <= samples; i++) {
        const q = bounds.quantityMin + (i / samples) * (bounds.quantityMax - bounds.quantityMin);
        try {
            const p = equation(q);
            const diff = Math.abs(p - targetPrice);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestQ = q;
            }
        } catch (error) {
            continue;
        }
    }
    return closestQ;
};

export const calculateArcElasticities = (
    equilibriumPrice: number,
    equilibriumQuantity: number,
    demandEquation: (x: number) => number,
    supplyEquation: (x: number) => number,
    bounds: { priceMin: number; priceMax: number; quantityMin: number; quantityMax: number }
) => {
    const priceRange = equilibriumPrice * 0.1;
    const p1 = equilibriumPrice - priceRange;
    const p2 = equilibriumPrice + priceRange;

    const minPrice = Math.max(p1, bounds.priceMin);
    const maxPrice = Math.min(p2, bounds.priceMax);

    if (minPrice >= maxPrice) return { arcPED: 0, arcPES: 0 };

    try {
        const demandQ1 = findQuantityAtPrice(minPrice, equilibriumQuantity, demandEquation, bounds);
        const demandQ2 = findQuantityAtPrice(maxPrice, equilibriumQuantity, demandEquation, bounds);
        const supplyQ1 = findQuantityAtPrice(minPrice, equilibriumQuantity, supplyEquation, bounds);
        const supplyQ2 = findQuantityAtPrice(maxPrice, equilibriumQuantity, supplyEquation, bounds);

        const calcArcElasticity = (q1: number, q2: number, p1: number, p2: number) => {
            const percentChangeQ = (q2 - q1) / ((q2 + q1) / 2);
            const percentChangeP = (p2 - p1) / ((p2 + p1) / 2);

            return percentChangeP !== 0 ? percentChangeQ / percentChangeP : 0;
        };

        const arcPED = calcArcElasticity(demandQ1, demandQ2, minPrice, maxPrice);
        const arcPES = calcArcElasticity(supplyQ1, supplyQ2, minPrice, maxPrice);

        return { arcPED, arcPES };
    } catch (error) {
        console.warn('Arc elasticity calculation failed:', error);
        return { arcPED: 0, arcPES: 0 };
    }
};

export const findIntersection = (
    demandEquation: (x: number) => number,
    supplyEquation: (x: number) => number,
    bounds: { priceMin: number; priceMax: number; quantityMin: number; quantityMax: number }
) => {
    const samples = 2500;
    let closestDistance = Infinity;
    let intersectionPoint: { x: number; y: number } | null = null;

    for (let i = 0; i <= samples; i++) {
        const x = bounds.quantityMin + (i / samples) * (bounds.quantityMax - bounds.quantityMin);

        try {
            const demandY = demandEquation(x);
            const supplyY = supplyEquation(x);
            const distance = Math.abs(demandY - supplyY);

            if (
                distance < closestDistance &&
                isFinite(demandY) &&
                isFinite(supplyY) &&
                demandY >= bounds.priceMin &&
                demandY <= bounds.priceMax &&
                supplyY >= bounds.priceMin &&
                supplyY <= bounds.priceMax
            ) {
                closestDistance = distance;
                intersectionPoint = {
                    x,
                    y: (demandY + supplyY) / 2,
                };
            }
        } catch (error) {
            continue;
        }
    }

    // Only consider it an intersection if curves are reasonably close
    const tolerance = (bounds.priceMax - bounds.priceMin) * 0.01; // 1% of price range
    return closestDistance < tolerance ? intersectionPoint : null;
};
