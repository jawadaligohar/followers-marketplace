"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Wallet } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import {
  PLATFORM_PRICING,
  WALLET_DISCOUNT,
  walletPrice,
  formatUsd,
} from "@/lib/pricing";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-white" },
  { id: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-500" },
] as const;

export default function OrderForm() {
  const router = useRouter();
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

  return (
    <Card className="relative border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
      <h2 className="text-lg font-semibold">Start your order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a platform and quantity to see instant pricing.
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
                  ? "border-brand-500 bg-brand-500/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
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
          <Label className="mb-1.5 text-xs text-muted-foreground">Quantity</Label>
          <div className="grid grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <motion.button
                key={tier.qty}
                type="button"
                onClick={() => setQtyValue(tier.qtyValue)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  qtyValue === tier.qtyValue
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {tier.qty}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3">
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
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-accent-500">
        <Wallet className="h-3.5 w-3.5" />${formatUsd(walletPrice(selectedTier.price))}{" "}
        if paid from wallet ({WALLET_DISCOUNT * 100}% off)
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          variant="brand"
          onClick={() => router.push("/signup?callbackUrl=/dashboard/orders/new")}
          className="mt-4 flex w-full items-center justify-center gap-2 py-5"
        >
          Continue to Checkout
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </Card>
  );
}
