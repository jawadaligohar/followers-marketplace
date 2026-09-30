import { z } from "zod";

export const serviceTierSchema = z.object({
  qty: z.string().min(1),
  qtyValue: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  highlight: z.boolean().optional(),
});

export const serviceSchema = z.object({
  platformId: z.string().min(1),
  platformLabel: z.string().min(1),
  category: z.string().min(1),
  active: z.boolean().default(true),
  supplierServiceId: z.string().nullable().optional(),
  tiers: z.array(serviceTierSchema).min(1),
  sortOrder: z.number().int().default(0),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
