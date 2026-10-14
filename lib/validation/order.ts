import { z } from "zod";
import { checkoutItemSchema } from "./checkout";

export const createOrderSchema = checkoutItemSchema.extend({
  expectedTotalCents: z.number().int().nonnegative().optional(),
  paymentSource: z.enum(["wallet", "card", "crypto", "bank"]),
});

export const topupSchema = z.object({
  method: z.enum(["stripe", "nowpayments", "bank"]).default("stripe"),
  amountCents: z
    .number()
    .int()
    .min(500, "Minimum top-up is $5.00")
    .max(100000, "Maximum top-up is $1,000.00"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
