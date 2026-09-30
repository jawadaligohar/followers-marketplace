"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Wallet, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CountUp from "@/components/CountUp";

export default function WalletBalanceCard({ walletBalanceCents }: { walletBalanceCents: number }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-brand-500/15 via-white/[0.03] to-accent-500/10">
        <motion.div
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-500/20 blur-2xl"
        />
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Wallet className="h-4 w-4 text-accent-500" />
              </span>
              Wallet balance
            </div>
            <span className="flex items-center gap-1 rounded-full border border-accent-500/20 bg-accent-500/10 px-2.5 py-1 text-[11px] font-medium text-accent-500">
              <Sparkles className="h-3 w-3" />
              15% off
            </span>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-gradient">
            $<CountUp value={walletBalanceCents / 100} decimals={2} />
          </div>
          <Link
            href="/dashboard/wallet"
            className="group mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-500 hover:underline"
          >
            Top up wallet
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
