"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Wallet, ShoppingCart, ShieldCheck, RefreshCw, Headset } from "lucide-react";
import { PLATFORM_ORDER, PLATFORMS, type PlatformId } from "@/lib/catalog";
import { WALLET_DISCOUNT, centsToUsd, walletPriceCents } from "@/lib/pricing";
import { useCart } from "@/lib/cart/CartContext";
import { useServices } from "@/lib/cart/useServices";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { DraftExtras, LinkField, TierPicker } from "@/components/service/ServiceFields";
import { useLineDraft } from "@/components/service/useLineDraft";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function OrderForm() {
  const router = useRouter();
  const { addItem } = useCart();
  const { services } = useServices();
  const [platform, setPlatform] = useState<PlatformId>("instagram");
  const [slug, setSlug] = useState("instagram-followers");

  const platformServices = services.filter((s) => s.platformId === platform);
  const service = platformServices.find((s) => s.slug === slug) ?? platformServices[0];
  const draft = useLineDraft(service);
  const tiers = service?.tiers ?? [];

  function handlePlatformChange(id: PlatformId) {
    setPlatform(id);
    setSlug(services.find((s) => s.platformId === id)?.slug ?? "");
  }

  function handleAddToCart() {
    const error = draft.validate(true);
    if (error) {
      toast.error(error);
      return;
    }
    addItem(draft.toCartItem());
    toast.success("Added to cart");
    router.push("/checkout");
  }

  return (
    <Card className="relative border-border bg-card p-6 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-8">
      <h2 className="text-lg font-semibold">Start growing today</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a platform, a service and how much reach you want.
      </p>

      <div className="mt-6 grid grid-cols-4 gap-2">
        {PLATFORM_ORDER.map((p) => {
          const active = platform === p;
          return (
            <motion.button
              key={p}
              type="button"
              onClick={() => handlePlatformChange(p)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-500/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
              }`}
            >
              <PlatformIcon platformId={p} className="h-5 w-5" />
              {PLATFORMS[p].label.replace(" (Twitter)", "")}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Service</Label>
          <div className="flex flex-wrap gap-1.5">
            {platformServices.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => setSlug(s.slug)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  s.slug === service?.slug
                    ? "border-brand-500 bg-brand-500/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
                }`}
              >
                {s.category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">
            Quantity{service?.kind === "auto" && " (per post)"}
          </Label>
          {draft.tier && <TierPicker tiers={tiers} value={draft.tier.qtyValue} onChange={draft.setQtyValue} />}
        </div>

        {service && <DraftExtras service={service} draft={draft} idPrefix="hero" />}
        {service && <LinkField service={service} id="hero-link" value={draft.targetLink} onChange={draft.setTargetLink} />}
      </div>

      <div className="mt-6 flex items-center justify-between overflow-hidden rounded-xl border border-border bg-muted px-4 py-3">
        <span className="text-sm text-muted-foreground">Total price</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`${service?.slug}-${draft.tier?.qtyValue}-${draft.postsCovered}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold text-gradient"
          >
            ${centsToUsd(draft.priceCents)}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand-600">
        <Wallet className="h-3.5 w-3.5" />${centsToUsd(walletPriceCents(draft.priceCents))}{" "}
        if paid from wallet ({WALLET_DISCOUNT * 100}% off)
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          variant="default"
          onClick={handleAddToCart}
          className="mt-4 flex w-full items-center justify-center gap-2 py-5"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
      <p className="mt-3 text-center text-xs text-muted-foreground/70">
        No account needed — checkout as a guest or sign in to save 5% with wallet.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-medium text-muted-foreground sm:text-xs">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
          Secure Checkout
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5 text-brand-500" />
          30-Day Refill
        </span>
        <span className="flex items-center gap-1">
          <Headset className="h-3.5 w-3.5 text-brand-500" />
          24/7 Support
        </span>
      </div>
    </Card>
  );
}
