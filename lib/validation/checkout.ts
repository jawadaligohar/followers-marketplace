import { z } from "zod";

// Per-kind extras. Which ones are required is enforced in lib/orderLine.ts,
// where the service kind is known.
export const lineExtrasSchema = z.object({
  postsCovered: z.number().int().positive().optional(),
  comments: z.array(z.string().trim().max(500, "Comments are limited to 500 characters")).max(1000).optional(),
  pollOption: z.number().int().min(1).max(4).optional(),
});

export const checkoutItemSchema = lineExtrasSchema.extend({
  serviceId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid service"),
  qtyValue: z.number().int().positive(),
  targetLink: z.string().trim().min(2, "Enter a valid profile or post link").max(2048),
});

export const checkoutSchema = z.object({
  expectedTotalCents: z.number().int().nonnegative().optional(),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  paymentSource: z.enum(["wallet", "card", "crypto", "bank"]),
  guestEmail: z.string().email().optional(),
});

export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
