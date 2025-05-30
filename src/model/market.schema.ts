import { z } from "zod/v4-mini";

export const MarketRowSchema = z.object({
    id: z.number(),
    price: z.string(),
    qd: z.string(),
    qs: z.string()
});

export const MarketFileSchema = z.object({
    createdAt: z.string(),
    rows: z.array(MarketRowSchema)
});

export const MarketSchema = z.object({
    id: z.string(),
    name: z.string(),
    file: MarketFileSchema
});

export type MarketRow = z.infer<typeof MarketRowSchema>;
export type MarketFile = z.infer<typeof MarketFileSchema>;
export type Market = z.infer<typeof MarketSchema>;