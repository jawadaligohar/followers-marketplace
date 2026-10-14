"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { PLATFORMS } from "@/lib/catalog";
import { useServices } from "@/lib/cart/useServices";
import { centsToUsd } from "@/lib/pricing";

export default function ExploreServices() {
  const { services, loaded } = useServices();
  return (
    <section className="border-y border-border bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Explore more services
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mix and match across platforms to build a complete growth
            strategy.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((svc, i) => (
            <motion.div
              key={svc.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4) }}
              whileHover={{ y: -3 }}
            >
              <Link
                href={`/services/${svc.slug}`}
                className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3.5 text-sm transition hover:border-brand-500/40 hover:shadow-sm"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <PlatformIcon platformId={svc.platformId} />
                  <span className="min-w-0 text-muted-foreground">
                    {PLATFORMS[svc.platformId].label.replace(" (Twitter)", "")}{" "}
                    <span className="text-foreground">{svc.category}</span>
                    {loaded && svc.tiers.length > 0 && <span className="block text-xs">From ${centsToUsd(Math.min(...svc.tiers.map((t) => t.priceCents)))}</span>}
                  </span>
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition group-hover:text-brand-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
