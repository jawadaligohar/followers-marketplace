"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { motion } from "motion/react";
import { PLATFORM_PRICING, WALLET_DISCOUNT, walletPrice, formatUsd } from "@/lib/pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.qty}
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
              <p className="mt-1 text-sm capitalize text-muted-foreground">{platform}</p>

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

              <Button
                variant={tier.highlight ? "brand" : "outline"}
                className="mt-6 w-full rounded-xl py-5"
                render={<Link href="/signup?callbackUrl=/dashboard/orders/new" />}
              >
                Order Now
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/30">
        Prices shown are for Followers. Pricing for Likes, Views and other
        services is available at checkout.
      </p>
    </section>
  );
}
