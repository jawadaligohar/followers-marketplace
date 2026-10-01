"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowRight, Wallet, ShoppingCart, ShieldCheck, RefreshCw, Headset } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import {
  PLATFORM_PRICING,
  WALLET_DISCOUNT,
  walletPrice,
  formatUsd,
} from "@/lib/pricing";
import { useCart } from "@/lib/cart/CartContext";
import { useServiceIds } from "@/lib/cart/useServiceIds";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-foreground" },
  { id: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-500" },
] as const;

export default function OrderForm() {
  const router = useRouter();
  const { addItem } = useCart();
  const serviceIdByPlatform = useServiceIds();
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>(
    "instagram"
  );
  const tiers = PLATFORM_PRICING[platform];
  const [qtyValue, setQtyValue] = useState(tiers[0].qtyValue);
  const [link, setLink] = useState("");

  const selectedTier = useMemo(
    () => tiers.find((t) => t.qtyValue === qtyValue) ?? tiers[0],
    [tiers, qtyValue]
  );

  function handlePlatformChange(id: (typeof PLATFORMS)[number]["id"]) {
    setPlatform(id);
    setQtyValue(PLATFORM_PRICING[id][0].qtyValue);
  }

  function handleAddToCart() {
    const serviceId = serviceIdByPlatform[platform];
    if (!serviceId) {
      toast.error("Services are still loading, try again in a moment");
      return;
    }
    if (!link.trim()) {
      toast.error("Enter your profile link first");
      return;
    }
    addItem({
      serviceId,
      platformId: platform,
      platformLabel: PLATFORMS.find((p) => p.id === platform)!.label,
      category: "Followers",
      qty: selectedTier.qty,
      qtyValue: selectedTier.qtyValue,
      priceCents: Math.round(selectedTier.price * 100),
      targetLink: link.trim(),
    });
    toast.success("Added to cart");
    router.push("/checkout");
  }

  return (
    <Card className="relative border-border bg-card p-6 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-8">
      <h2 className="text-lg font-semibold">Start growing today</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose where your community lives and how many people you want to reach.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const active = platform === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => handlePlatformChange(p.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-500/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-brand-500/30 hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${p.color}`} />
              {p.label}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Service</Label>
          <Input value="Followers" disabled />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hero-link" className="text-xs text-muted-foreground">
            Profile Link
          </Label>
          <Input
            id="hero-link"
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://instagram.com/yourprofile"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Audience size</Label>
          <div className="grid grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <motion.button
                key={tier.qty}
                type="button"
                onClick={() => setQtyValue(tier.qtyValue)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  qtyValue === tier.qtyValue
                    ? "border-brand-500 bg-brand-500/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-brand-500/30"
                }`}
              >
                {tier.qty}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between overflow-hidden rounded-xl border border-border bg-muted px-4 py-3">
        <span className="text-sm text-muted-foreground">Total price</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`${platform}-${selectedTier.qtyValue}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold text-gradient"
          >
            ${formatUsd(selectedTier.price)}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand-600">
        <Wallet className="h-3.5 w-3.5" />${formatUsd(walletPrice(selectedTier.price))}{" "}
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
        No account needed — checkout as a guest or sign in to save 15% with wallet.
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
