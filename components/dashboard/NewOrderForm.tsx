"use client";
import { usePaymentOptions } from "@/lib/usePaymentOptions";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Wallet, CreditCard, Bitcoin } from "lucide-react";
import { PLATFORM_ORDER, PLATFORMS, type PlatformId } from "@/lib/catalog";
import { walletPriceCents } from "@/lib/pricing";
import { useServices } from "@/lib/cart/useServices";
import PlatformIcon from "@/components/shared/PlatformIcon";
import { DraftExtras, LinkField, TierPicker } from "@/components/service/ServiceFields";
import { useLineDraft } from "@/components/service/useLineDraft";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function NewOrderForm() {
  const router = useRouter();
  const { bankEnabled } = usePaymentOptions();
  const { update } = useSession();

  const { services: allServices, loaded } = useServices();
  // Only database-backed services can be ordered.
  const services = allServices.filter((s) => s._id);
  const [platformId, setPlatformId] = useState<PlatformId>("instagram");
  const [slug, setSlug] = useState("");
  const [paymentSource, setPaymentSource] = useState<"wallet" | "card" | "crypto" | "bank">("wallet");
  const [submitting, setSubmitting] = useState(false);

  const platforms = PLATFORM_ORDER.filter((p) => services.some((s) => s.platformId === p));
  const platformServices = services.filter((s) => s.platformId === platformId);
  const currentService = platformServices.find((s) => s.slug === slug) ?? platformServices[0];
  const draft = useLineDraft(currentService);
  const selectedTier = draft.tier;

  function handlePlatformChange(id: PlatformId) {
    setPlatformId(id);
    setSlug("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentService || !selectedTier) return;
    const error = draft.validate(true);
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft.toCartItem(),
        paymentSource,
        expectedTotalCents: paymentSource === "wallet" ? walletPriceCents(draft.priceCents) : draft.priceCents,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      if (res.status === 402) {
        toast.error(
          `Insufficient wallet balance. You need $${((data.shortfallCents ?? 0) / 100).toFixed(2)} more.`
        );
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    await update();
    toast.success("Order placed");
    router.push("/dashboard/orders");
    router.refresh();
  }

  if (!loaded) {
    return (
      <div className="max-w-xl space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No services available right now.
      </Card>
    );
  }

  const chargeCents = paymentSource === "wallet" ? walletPriceCents(draft.priceCents) : draft.priceCents;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <Label className="mb-2 text-xs text-muted-foreground">Platform</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {platforms.map((p) => {
            const active = platformId === p;
            return (
              <motion.button
                key={p}
                type="button"
                onClick={() => handlePlatformChange(p)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                  active
                    ? "border-brand-500 bg-brand-500/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-brand-500/30"
                }`}
              >
                <PlatformIcon platformId={p} className="h-5 w-5" />
                {PLATFORMS[p].label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 text-xs text-muted-foreground">Service</Label>
        <div className="flex flex-wrap gap-1.5">
          {platformServices.map((s) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSlug(s.slug)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                s.slug === currentService?.slug
                  ? "border-brand-500 bg-brand-500/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
              }`}
            >
              {s.category}
            </button>
          ))}
        </div>
      </div>

      {currentService && selectedTier && (
        <>
          <div>
            <Label className="mb-2 text-xs text-muted-foreground">
              Quantity{currentService.kind === "auto" && " (per post)"}
            </Label>
            <TierPicker slug={currentService.slug} tiers={currentService.tiers} value={selectedTier.qtyValue} onChange={draft.setQtyValue} showPrices />
          </div>
          <DraftExtras service={currentService} draft={draft} idPrefix="dash" />
          <LinkField service={currentService} id="target-link" value={draft.targetLink} onChange={draft.setTargetLink} />
        </>
      )}

      <div>
        <Label className="mb-2 block text-xs font-medium text-muted-foreground">Payment method</Label>
        {bankEnabled && <Button type="button" className="mb-3" variant={paymentSource === "bank" ? "default" : "outline"} onClick={() => setPaymentSource("bank")}>Bank transfer · manual confirmation</Button>}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <motion.button
            type="button"
            onClick={() => setPaymentSource("wallet")}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition ${
              paymentSource === "wallet"
                ? "border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/50"
                : "border-border text-muted-foreground hover:border-brand-500/30 hover:bg-card/60"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                5% OFF
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-semibold text-foreground">Wallet</div>
              <div className="text-xs text-muted-foreground/80">Instant debit</div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setPaymentSource("card")}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition ${
              paymentSource === "card"
                ? "border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/50"
                : "border-border text-muted-foreground hover:border-brand-500/30 hover:bg-card/60"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                <CreditCard className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Card
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-semibold text-foreground">Stripe</div>
              <div className="text-xs text-muted-foreground/80">Credit / Debit</div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setPaymentSource("crypto")}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-start justify-between rounded-2xl border p-3.5 text-left transition ${
              paymentSource === "crypto"
                ? "border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/50"
                : "border-border text-muted-foreground hover:border-brand-500/30 hover:bg-card/60"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                <Bitcoin className="h-4 w-4" />
              </span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                Crypto
              </span>
            </div>
            <div className="mt-3">
              <div className="text-sm font-semibold text-foreground">NOWPayments</div>
              <div className="text-xs text-muted-foreground/80">USDT, BTC, ETH +150</div>
            </div>
          </motion.button>
        </div>

        {paymentSource === "crypto" && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <span className="text-sm">⚡</span>
            <div>
              <span className="font-semibold text-foreground">Pay with Crypto:</span> Instant order processing with USDT, Bitcoin, Ethereum, Solana, and 150+ cryptocurrencies.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between overflow-hidden rounded-xl border border-border bg-muted px-4 py-3">
        <span className="text-sm text-muted-foreground">Total price</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`${currentService?.slug}-${selectedTier?.qtyValue}-${draft.postsCovered}-${paymentSource}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold text-gradient"
          >
            ${(chargeCents / 100).toFixed(2)}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          variant="default"
          disabled={submitting || Boolean(draft.unavailable)}
          className="flex w-full items-center justify-center gap-2 py-5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {paymentSource === "bank"
            ? "Get bank transfer instructions"
            : paymentSource === "crypto"
            ? "Pay with Crypto"
            : paymentSource === "card"
            ? "Continue to payment"
            : "Place order"}
        </Button>
      </motion.div>
    </form>
  );
}
