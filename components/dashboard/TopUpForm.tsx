"use client";
import { usePaymentOptions } from "@/lib/usePaymentOptions";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Loader2, CreditCard, Bitcoin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESETS_CENTS = [1000, 2500, 5000, 10000];

export default function TopUpForm() {
  const { bankEnabled } = usePaymentOptions();
  const [amountCents, setAmountCents] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [method, setMethod] = useState<"stripe" | "nowpayments" | "bank">("stripe");
  const [loading, setLoading] = useState(false);

  async function handleTopUp() {
    const value = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountCents;

    if (!value || value < 500) {
      toast.error("Minimum top-up is $5.00");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: value, method }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Top up wallet</CardTitle>
        <CardDescription>Pay from your wallet to save 5% on every order.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS_CENTS.map((preset) => (
            <motion.button
              key={preset}
              type="button"
              onClick={() => {
                setAmountCents(preset);
                setCustomAmount("");
              }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                amountCents === preset && !customAmount
                  ? "border-brand-500 bg-brand-500/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-brand-500/30"
              }`}
            >
              ${(preset / 100).toFixed(0)}
            </motion.button>
          ))}
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="custom-amount" className="text-xs text-muted-foreground">
            Custom amount
          </Label>
          <Input
            id="custom-amount"
            type="number"
            min="5"
            step="0.01"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter amount in USD"
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Payment Method</Label>
          {bankEnabled && <Button type="button" variant={method === "bank" ? "default" : "outline"} onClick={() => setMethod("bank")}>Bank transfer · manual confirmation</Button>}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMethod("stripe")}
              className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                method === "stripe"
                  ? "border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/50"
                  : "border-border text-muted-foreground hover:bg-card/60"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                  <CreditCard className="h-3.5 w-3.5" />
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                  Cards
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-semibold text-foreground">Credit / Debit Card</div>
                <div className="text-[10px] text-muted-foreground/80">Visa, Mastercard, Amex</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("nowpayments")}
              className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                method === "nowpayments"
                  ? "border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/50"
                  : "border-border text-muted-foreground hover:bg-card/60"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
                  <Bitcoin className="h-3.5 w-3.5" />
                </span>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500">
                  Crypto
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xs font-semibold text-foreground">NOWPayments</div>
                <div className="text-[10px] text-muted-foreground/80">USDT, BTC, ETH +150</div>
              </div>
            </button>
          </div>

          {method === "nowpayments" && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-muted-foreground">
              <span className="text-xs">⚡</span>
              <span>Top up instantly with USDT, Bitcoin, Solana, Ethereum, or 150+ supported cryptocurrencies.</span>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="default"
          onClick={handleTopUp}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 py-5"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {method === "bank" ? "Get bank transfer instructions" : method === "nowpayments" ? "Continue to Crypto Checkout" : "Continue to payment"}
        </Button>
      </CardContent>
    </Card>
  );
}
