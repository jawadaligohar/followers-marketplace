"use client";

import Link from "next/link";
import { useServices } from "@/lib/cart/useServices";
import { centsToUsd } from "@/lib/pricing";
import { defaultTier } from "@/lib/serviceDocs";

/** Carries the displayed quantity into ordering and uses current service prices. */
export default function PackageLinks({ slugs }: { slugs: string[] }) {
  const { bySlug, loaded } = useServices();
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {slugs.map((slug) => {
        const service = bySlug.get(slug);
        if (!service) return null;
        const tier = defaultTier(service);
        if (!tier) return null;
        return (
          <Link key={slug} href={`/services/${slug}?qty=${tier.qtyValue}#buy`} className="rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-brand-500/50">
            <span className="block font-semibold">{tier.qty} {service.platformLabel} {service.category}</span>
            <span className="text-xs text-muted-foreground">{loaded ? `$${centsToUsd(tier.priceCents)}` : "View package"}{service.kind === "auto" ? " · per post, 30-day plan" : ""} &rarr;</span>
          </Link>
        );
      })}
      <Link href="/services" className="self-center text-sm font-semibold text-brand-600 hover:underline">All packages &rarr;</Link>
    </div>
  );
}
