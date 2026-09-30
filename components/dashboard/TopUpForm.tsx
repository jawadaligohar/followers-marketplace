"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const PRESETS_CENTS = [1000, 2500, 5000, 10000];

export default function TopUpForm() {
  const [amountCents, setAmountCents] = useState(2500);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopUp() {
    setError(null);
    const value = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountCents;

    if (!value || value < 500) {
      setError("Minimum top-up is $5.00");
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
      setError(data.error ?? "Something went wrong");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold">Top up wallet</h2>
      <p className="mt-1 text-sm text-white/50">Pay from your wallet to save 15% on every order.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
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

      <div className="mt-3">
        <label className="mb-1.5 block text-xs font-medium text-white/50">Custom amount</label>
        <input
          type="number"
          min="5"
          step="0.01"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Enter amount in USD"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
        />
      </div>

      <button
        type="button"
        onClick={handleTopUp}
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue to payment
      </button>
    </div>
  );
}
