"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESETS_CENTS = [1000, 2500, 5000, 10000];

export default function TopUpForm() {
  const [amountCents, setAmountCents] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
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
      body: JSON.stringify({ amountCents: value }),
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
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Top up wallet</CardTitle>
        <CardDescription>Pay from your wallet to save 15% on every order.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS_CENTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmountCents(preset);
                setCustomAmount("");
              }}
              className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${
                amountCents === preset && !customAmount
                  ? "border-brand-500 bg-brand-500/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/20"
              }`}
            >
              ${(preset / 100).toFixed(0)}
            </button>
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

        <Button
          type="button"
          variant="brand"
          onClick={handleTopUp}
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 py-5"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue to payment
        </Button>
      </CardContent>
    </Card>
  );
}
