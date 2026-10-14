"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Wallet, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { INCLUDED_AUTO_POSTS, PLATFORM_ORDER, PLATFORMS, type PlatformId } from "@/lib/catalog";
import { WALLET_DISCOUNT, centsToUsd, walletPriceCents } from "@/lib/pricing";
import { unitSuffix, type ServiceDoc, type TierDoc } from "@/lib/serviceDocs";
import { useCart } from "@/lib/cart/CartContext";
import { useServices } from "@/lib/cart/useServices";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function tierFeatures(service: ServiceDoc, tier: TierDoc) {
  if (service.kind === "auto") {
    return [
      `${tier.qty} ${service.category.replace(/^(UK )?Auto /, "").toLowerCase()} per post`,
      `Covers your next ${INCLUDED_AUTO_POSTS} posts`,
      "One-time payment, no subscription",
      "No password required",
    ];
  }
  if (service.kind === "comments") {
    return ["You write every comment", "Posted word-for-word", "24/7 human support", "No password required"];
  }
  return ["Real, active accounts", "30-Day Refill Guarantee", "24/7 Human Support", "No password required"];
}

export default function Pricing() {
  const router = useRouter();
  const { addItem } = useCart();
  const { services } = useServices();
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [slug, setSlug] = useState("instagram-followers");

  const platformServices = services.filter((s) => s.platformId === platform);
  const service = platformServices.find((s) => s.slug === slug) ?? platformServices[0];

  function handlePlatform(id: PlatformId) {
    setPlatform(id);
    setSlug(services.find((s) => s.platformId === id)?.slug ?? "");
  }

  function handleOrder(tier: TierDoc) {
    if (!service._id) {
      toast.error("Services are still loading, try again in a moment");
      return;
    }
    addItem({
      serviceId: service._id,
      slug: service.slug,
      kind: service.kind,
      target: service.target,
      platformId: service.platformId,
      platformLabel: service.platformLabel,
      category: service.category,
      qty: tier.qty,
      qtyValue: tier.qtyValue,
      priceCents: tier.priceCents,
      targetLink: "",
    });
    toast.success("Added to cart");
    router.push("/checkout");
  }

  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-muted-foreground">
          Straightforward pricing for real growth. No subscriptions, no hidden fees — pay once, grow forever.
        </p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Wallet className="h-3.5 w-3.5 text-brand-600" />
          Pay from your wallet balance and save {WALLET_DISCOUNT * 100}% on
          every order
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-fit max-w-full flex-wrap justify-center gap-2 rounded-3xl border border-border bg-card p-1 shadow-sm sm:rounded-full">
        {PLATFORM_ORDER.map((p) => {
          const active = platform === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => handlePlatform(p)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PlatformIcon platformId={p} colored={!active} />
              {PLATFORMS[p].label}
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-2">
        {platformServices.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setSlug(s.slug)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              s.slug === service?.slug
                ? "border-brand-500 bg-brand-500/10 text-foreground"
                : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
            }`}
          >
            {s.category}
          </button>
        ))}
      </div>

      {service && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {service.tiers.map((tier, i) => (
            <motion.div
              key={`${service.slug}-${tier.qtyValue}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <Card
                className={`relative h-full border p-6 ${
                  tier.highlight
                    ? "border-brand-500 bg-gradient-to-b from-brand-50 to-transparent shadow-xl shadow-brand-500/10"
                    : "border-border bg-card"
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-1 text-xs font-semibold text-white">
                    Recommended
                  </span>
                )}
                <h3 className="text-lg font-semibold">
                  {tier.qty} {service.category}
                  {unitSuffix(service.kind)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{service.platformLabel}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">${centsToUsd(tier.priceCents)}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-600">
                  <Wallet className="h-3.5 w-3.5" />${centsToUsd(walletPriceCents(tier.priceCents))} with wallet
                </div>

                <ul className="mt-5 space-y-2.5">
                  {tierFeatures(service, tier).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {service.kind === "standard" ? (
                  <Button
                    variant={tier.highlight ? "default" : "outline"}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-5"
                    onClick={() => handleOrder(tier)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </Button>
                ) : (
                  // Auto plans, comments and polls need extra details, collected on the service page.
                  <Button
                    variant={tier.highlight ? "default" : "outline"}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-5"
                    render={<Link href={`/services/${service.slug}?qty=${tier.qtyValue}`} />}
                    nativeButton={false}
                  >
                    Choose
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {service && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href={`/services/${service.slug}`} className="font-medium text-brand-600 hover:underline">
            Learn more about {service.platformLabel} {service.category} →
          </Link>
        </p>
      )}
    </section>
  );
}
