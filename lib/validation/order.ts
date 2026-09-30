import { z } from "zod";

export const createOrderSchema = z.object({
  serviceId: z.string().min(1),
  qtyValue: z.number().int().positive(),
  targetLink: z.string().url("Enter a valid profile or post link"),
  paymentSource: z.enum(["wallet", "card"]),
});

export const topupSchema = z.object({
  amountCents: z
    .number()
    .int()
    .min(500, "Minimum top-up is $5.00")
    .max(100000, "Maximum top-up is $1,000.00"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
