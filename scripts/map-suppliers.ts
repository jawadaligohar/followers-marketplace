import dotenv from "dotenv";
import mongoose from "mongoose";
import { mkdir, writeFile } from "node:fs/promises";
import { SUPPLIER_ROUTES } from "../lib/supplier/routing";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

async function main() {
  const apply = process.argv.includes("--apply");
  const resolveReviewed = process.argv.includes("--resolve-reviewed");
  if (apply && process.env.SMM_DISPATCH_ENABLED === "true")
    throw new Error(
      "Pause SMM_DISPATCH_ENABLED before changing supplier mappings",
    );
  const { dbConnect } = await import("../lib/db/connect");
  const { Service } = await import("../lib/db/models/Service");
  await dbConnect();
  try {
    const services = await Service.find({
      slug: { $in: Object.keys(SUPPLIER_ROUTES) },
    });
    if (services.length !== Object.keys(SUPPLIER_ROUTES).length)
      throw new Error(
        "Expected all 34 catalog services; run the catalog seed first",
      );
    const backup = services.map((service) => ({
      id: String(service._id),
      slug: service.slug,
      defaultProvider: service.defaultProvider,
      providerMappings: service.providerMappings,
      supplierServiceId: service.supplierServiceId,
      tiers: service.tiers.map(
        (tier: {
          qtyValue: number;
          defaultProvider?: string;
          providerMappings?: unknown;
        }) => ({
          qtyValue: tier.qtyValue,
          defaultProvider: tier.defaultProvider,
          providerMappings: tier.providerMappings,
        }),
      ),
    }));
    if (apply) {
      await mkdir("reports/provider-catalogs/backups", { recursive: true });
      const path = `reports/provider-catalogs/backups/mappings-${Date.now()}.json`;
      await writeFile(path, JSON.stringify(backup, null, 2) + "\n", {
        flag: "wx",
      });
      console.log(`Previous mappings saved: ${path}`);
    }
    for (const service of services) {
      const route = SUPPLIER_ROUTES[service.slug];
      const previous: Record<string, { provider: string; id?: string }> = {
        "tiktok-auto-likes": { provider: "tiksta", id: "34" },
        "tiktok-auto-views": { provider: "tiksta", id: "59" },
        "tiktok-uk-likes": { provider: "tiksta" },
      };
      const old = previous[service.slug];
      const mappings =
        service.providerMappings?.toObject?.() ||
        service.providerMappings ||
        {};
      const upgrade =
        resolveReviewed &&
        old &&
        service.defaultProvider === old.provider &&
        (mappings[old.provider] || undefined) === old.id &&
        Object.entries(mappings).every(
          ([provider, id]) => !id || provider === old.provider,
        );
      // Never silently replace independently configured service/package mappings.
      if (
        service.supplierServiceId ||
        (!upgrade &&
          Object.values(
            service.providerMappings?.toObject?.() ||
              service.providerMappings ||
              {},
          ).some(Boolean)) ||
        service.tiers.some(
          (tier: {
            defaultProvider?: string;
            providerMappings?: { toObject?: () => object };
          }) =>
            tier.defaultProvider ||
            Object.values(
              tier.providerMappings?.toObject?.() ||
                tier.providerMappings ||
                {},
            ).some(Boolean),
        )
      ) {
        console.log(`Preserved existing mapping: ${service.slug}`);
        continue;
      }
      console.log(
        `${apply ? "Mapped" : "Would map"} ${service.slug} -> ${route.provider} #${route.id || "manual"}${route.hold ? " [HOLD]" : ""}`,
      );
      if (apply)
        await Service.updateOne(
          { _id: service._id, updatedAt: service.updatedAt },
          {
            $set: {
              defaultProvider: route.provider,
              providerMappings: route.id ? { [route.provider]: route.id } : {},
            },
          },
        ).then((result) => {
          if (result.modifiedCount !== 1)
            throw new Error(`Service changed concurrently: ${service.slug}`);
        });
    }
    console.log(
      apply
        ? "Mappings saved. Dispatch remains paused. No orders submitted."
        : "Dry run only. Use --apply to save mappings.",
    );
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Mapping failed");
  process.exitCode = 1;
});
