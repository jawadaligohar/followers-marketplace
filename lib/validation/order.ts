import { z } from "zod";

export const createOrderSchema = z.object({
  serviceId: z.string().min(1),
  qtyValue: z.number().int().positive(),
  targetLink: z.string().min(2, "Enter a valid profile or post link"),
  paymentSource: z.enum(["wallet", "card", "crypto"]),
});

export const topupSchema = z.object({
  method: z.enum(["stripe", "nowpayments"]).default("stripe"),
  amountCents: z
    .number()
    .int()
    .min(500, "Minimum top-up is $5.00")
    .max(100000, "Maximum top-up is $1,000.00"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
