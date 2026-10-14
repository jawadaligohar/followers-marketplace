import { connection } from "next/server";
import { dbConnect } from "@/lib/db/connect";
import { Service, type IService } from "@/lib/db/models/Service";
import type { ServiceDoc } from "@/lib/serviceDocs";

export function toServiceDoc(s: IService): ServiceDoc {
  return {
    _id: s._id.toString(),
    slug: s.slug ?? `${s.platformId}-${s.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    kind: s.kind ?? "standard",
    target: s.target ?? "profile",
    platformId: s.platformId as ServiceDoc["platformId"],
    platformLabel: s.platformLabel,
    category: s.category,
    tiers: s.tiers.map((t) => ({
      qty: t.qty,
      qtyValue: t.qtyValue,
      priceCents: t.priceCents,
      highlight: t.highlight ?? false,
      ...(t.postsOptions?.length && {
        postsOptions: t.postsOptions.map((o) => ({ posts: o.posts, priceCents: o.priceCents })),
      }),
    })),
  };
}

// Prices are admin-editable, so these always render at request time.

export async function getActiveServices(): Promise<ServiceDoc[]> {
  await connection();
  await dbConnect();
  const services = await Service.find({ active: true }).sort({ sortOrder: 1 }).lean<IService[]>();
  return services.map(toServiceDoc);
}

export async function getActiveService(slug: string): Promise<ServiceDoc | null> {
  await connection();
  await dbConnect();
  const service = await Service.findOne({ slug, active: true }).lean<IService>();
  return service ? toServiceDoc(service) : null;
}
