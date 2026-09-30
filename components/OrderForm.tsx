"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Wallet } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import {
  PLATFORM_PRICING,
  WALLET_DISCOUNT,
  walletPrice,
  formatUsd,
} from "@/lib/pricing";

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
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
      <h2 className="text-lg font-semibold">Start your order</h2>
      <p className="mt-1 text-sm text-white/50">
        Choose a platform and quantity to see instant pricing.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const active = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePlatformChange(p.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-500/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              <Icon className={`h-5 w-5 ${p.color}`} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Service
          </label>
          <select
            value="Followers"
            disabled
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          >
            <option className="bg-[#0d0f1d]">Followers</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Profile Link
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://instagram.com/yourprofile"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Quantity
          </label>
          <div className="grid grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <button
                key={tier.qty}
                type="button"
                onClick={() => setQtyValue(tier.qtyValue)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  qtyValue === tier.qtyValue
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {tier.qty}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-white/50">Total price</span>
        <span className="text-2xl font-bold text-gradient">
          ${formatUsd(selectedTier.price)}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-accent-500">
        <Wallet className="h-3.5 w-3.5" />${formatUsd(walletPrice(selectedTier.price))}{" "}
        if paid from wallet ({WALLET_DISCOUNT * 100}% off)
      </div>

      <button
        type="button"
        onClick={() => router.push("/signup?callbackUrl=/dashboard/orders/new")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90"
      >
        Continue to Checkout
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
