"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, ShoppingCart, Star, Wallet, Zap } from "lucide-react";
import { formatQty } from "@/lib/catalog";
import { WALLET_DISCOUNT, centsToUsd, walletPriceCents } from "@/lib/pricing";
import { useCart } from "@/lib/cart/CartContext";
import type { ServiceDoc } from "@/lib/serviceDocs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DraftExtras, LinkField, TierPicker } from "./ServiceFields";
import { useLineDraft } from "./useLineDraft";
import ProfilePostPicker from "./ProfilePostPicker";
import { serviceAvailability } from "@/lib/serviceAvailability";

function unitPrice(service: ServiceDoc, priceCents: number, qtyValue: number) {
  if (service.kind === "auto") return "30-day plan";
  if (service.kind === "comments")
    return `$${centsToUsd(priceCents / qtyValue)} each`;
  return `$${centsToUsd((priceCents / qtyValue) * 1000)} per 1,000`;
}

export default function ServiceOrderPanel({
  service,
  initialQty,
}: {
  service: ServiceDoc;
  initialQty?: number;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const draft = useLineDraft(service, initialQty);
  const { tier, priceCents } = draft;
  if (!tier) return null;

  const tierIndex = service.tiers.indexOf(tier);
  const upsell = service.kind === "standard" ? service.tiers.slice(tierIndex + 1).find(next => !serviceAvailability(service.slug, next.qtyValue)) : undefined;
  const perPost = service.kind === "auto" ? " per post" : "";

  function add(goToCheckout: boolean) {
    const error = draft.validate(true);
    if (error) {
      toast.error(error);
      return;
    }
    addItem(draft.toCartItem());
    if (goToCheckout) {
      router.push("/checkout");
    } else {
      toast.success("Added to cart");
    }
  }

  return (
    <Card className="border-border bg-card p-6 shadow-2xl shadow-black/10 sm:p-7">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            1. Choose a quantity
            {perPost && (
              <span className="text-muted-foreground/70">
                {" "}
                ({service.category.toLowerCase()}
                {perPost})
              </span>
            )}
          </p>
          <TierPicker
            slug={service.slug}
            tiers={service.tiers}
            value={tier.qtyValue}
            onChange={draft.setQtyValue}
            showPrices
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground">
            2. Your order details
          </p>
          <DraftExtras service={service} draft={draft} idPrefix="svc" />
          <LinkField
            service={service}
            id="svc-link"
            value={draft.targetLink}
            onChange={draft.setTargetLink}
          />
          {service.kind !== "auto" &&
            ["post", "video", "tweet"].includes(service.target) && (
              <ProfilePostPicker
                platform={service.platformId}
                onSelect={draft.setTargetLink}
              />
            )}
        </div>

        <div className="rounded-xl border border-border bg-muted/60 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {formatQty(tier.qtyValue)} {service.platformLabel}{" "}
              {service.category}
              {perPost}
            </span>
            {tier.highlight && (
              <span className="flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                <Star className="h-3 w-3" /> Recommended
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${tier.qtyValue}-${draft.postsCovered}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-extrabold text-gradient"
              >
                ${centsToUsd(priceCents)}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-muted-foreground">
              {unitPrice(service, tier.priceCents, tier.qtyValue)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-600">
            <Wallet className="h-3.5 w-3.5" />$
            {centsToUsd(walletPriceCents(priceCents))} if paid from wallet (
            {WALLET_DISCOUNT * 100}% off)
          </div>
          {service.kind === "auto" && (
            <p className="mt-1 text-xs text-muted-foreground">
              One-time payment for a 30-day plan covering your next{" "}
              {draft.postsCovered} posts. No subscription.
            </p>
          )}
        </div>

        {upsell && (
          <button
            type="button"
            onClick={() => draft.setQtyValue(upsell.qtyValue)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 px-4 py-2.5 text-left text-xs text-muted-foreground transition hover:border-brand-500"
          >
            <Zap className="h-4 w-4 shrink-0 text-brand-500" />
            <span>
              Want more? Get{" "}
              <span className="font-semibold text-foreground">
                {upsell.qty}
              </span>{" "}
              instead for{" "}
              <span className="font-semibold text-foreground">
                ${centsToUsd(upsell.priceCents)}
              </span>
            </span>
          </button>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => add(false)}
            disabled={Boolean(draft.unavailable)}
            className="flex items-center gap-2 py-5"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to cart
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => add(true)}
            disabled={Boolean(draft.unavailable)}
            className="flex items-center gap-2 py-5"
          >
            Buy now
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground/70">
          No account needed. Pay by card, crypto, or wallet balance.
        </p>
      </div>
    </Card>
  );
}
