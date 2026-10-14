import { z } from "zod";
import { PROVIDERS } from "@/lib/supplier/providers";

const providerMappingsSchema = z.object({
  jap: z.string().trim().regex(/^\d*$/).nullable().optional(),
  peakerr: z.string().trim().regex(/^\d*$/).nullable().optional(),
  tiksta: z.string().trim().regex(/^\d*$/).nullable().optional(),
});

export const postsOptionSchema = z.object({
  posts: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

export const serviceTierSchema = z.object({
  defaultProvider: z.enum(PROVIDERS).nullable().optional(),
  providerMappings: providerMappingsSchema.optional(),
  qty: z.string().min(1),
  qtyValue: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  highlight: z.boolean().optional(),
  postsOptions: z.array(postsOptionSchema).optional(),
});

const serviceFields = z.object({
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and dashes",
    ),
  kind: z.enum(["standard", "auto", "comments", "poll"]),
  target: z.enum([
    "profile",
    "post",
    "video",
    "reel",
    "live",
    "page",
    "tweet",
    "space",
  ]),
  platformId: z.string().min(1),
  platformLabel: z.string().min(1),
  category: z.string().min(1),
  active: z.boolean(),
  supplierServiceId: z.string().nullable().optional(),
  defaultProvider: z.enum(PROVIDERS).optional(),
  providerMappings: providerMappingsSchema.optional(),
  tiers: z.array(serviceTierSchema).min(1),
  sortOrder: z.number().int(),
});

export function validProviderPlatform(data: {
  platformId?: string;
  defaultProvider?: string | null;
  providerMappings?: { tiksta?: string | null };
  tiers?: {
    defaultProvider?: string | null;
    providerMappings?: { tiksta?: string | null };
  }[];
}) {
  return (
    data.platformId === "tiktok" ||
    !(
      data.defaultProvider === "tiksta" ||
      data.providerMappings?.tiksta ||
      data.tiers?.some(
        (t) => t.defaultProvider === "tiksta" || t.providerMappings?.tiksta,
      )
    )
  );
}
export const serviceSchema = serviceFields
  .extend({
    kind: serviceFields.shape.kind.default("standard"),
    target: serviceFields.shape.target.default("profile"),
    active: serviceFields.shape.active.default(true),
    sortOrder: serviceFields.shape.sortOrder.default(0),
  })
  .refine(
    validProviderPlatform,
    "Tiksta is only available for TikTok services",
  );

// No defaults here: zod applies .default() inside .partial(), which would silently
// reset omitted fields on every PATCH.
export const serviceUpdateSchema = serviceFields.partial();

export type ServiceInput = z.infer<typeof serviceSchema>;
