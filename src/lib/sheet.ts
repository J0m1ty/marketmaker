import type { MarketRow } from "@/lib/types";

export const hasUserData = (data: Partial<MarketRow>[]) => {
    return data.length > 20 || data.some(row => {
        const price = Number(row.price ?? '0');
        const qd = Number(row.qd ?? '0');
        const qs = Number(row.qs ?? '0');

        return (!isNaN(price) && price !== 0 && `${price}` === row.price) ||
            (!isNaN(qd) && qd !== 0 && `${qd}` === row.qd) ||
            (!isNaN(qs) && qs !== 0 && `${qs}` === row.qs);
    });
};