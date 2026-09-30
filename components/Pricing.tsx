"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { PLATFORM_PRICING, WALLET_DISCOUNT, walletPrice, formatUsd } from "@/lib/pricing";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: FaInstagram, color: "text-pink-500" },
  { id: "tiktok", label: "TikTok", icon: FaTiktok, color: "text-white" },
  { id: "facebook", label: "Facebook", icon: FaFacebook, color: "text-blue-500" },
] as const;

export default function Pricing() {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>(
    "instagram"
  );
  const tiers = PLATFORM_PRICING[platform];

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-white/60">
          Followers pricing shown below. No subscriptions, no hidden fees —
          pay once per order.
        </p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70">
          <Wallet className="h-3.5 w-3.5 text-accent-500" />
          Pay from your wallet balance and save {WALLET_DISCOUNT * 100}% on
          every order
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-fit gap-2 rounded-full border border-white/10 bg-white/5 p-1">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const active = platform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-white" : p.color}`} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.qty}
            className={`relative rounded-3xl border p-6 ${
              tier.highlight
                ? "border-brand-500 bg-gradient-to-b from-brand-500/10 to-transparent shadow-2xl shadow-brand-600/20"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            {tier.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-1 text-xs font-semibold text-white">
                Recommended
              </span>
            )}
            <h3 className="text-lg font-semibold">{tier.qty} Followers</h3>
            <p className="mt-1 text-sm capitalize text-white/50">{platform}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">
                ${formatUsd(tier.price)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-accent-500">
              <Wallet className="h-3.5 w-3.5" />${formatUsd(walletPrice(tier.price))}{" "}
              with wallet
            </div>

            <ul className="mt-5 space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                Real, active followers
              </li>
              <li className="flex items-start gap-2 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                No password required
              </li>
            </ul>

            <Link
              href="/signup?callbackUrl=/dashboard/orders/new"
              className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                tier.highlight
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/30 hover:opacity-90"
                  : "border border-white/15 text-white hover:bg-white/5"
              }`}
            >
              Order Now
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/30">
        Prices shown are for Followers. Pricing for Likes, Views and other
        services is available at checkout.
      </p>
    </section>
  );
}
