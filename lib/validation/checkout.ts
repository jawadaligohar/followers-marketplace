import { z } from "zod";

export const checkoutItemSchema = z.object({
  serviceId: z.string().min(1),
  qtyValue: z.number().int().positive(),
  targetLink: z.string().url("Enter a valid profile or post link"),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  paymentSource: z.enum(["wallet", "card"]),
  guestEmail: z.string().email().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
