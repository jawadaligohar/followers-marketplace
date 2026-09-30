"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Wallet, CreditCard } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa6";
import { walletPriceCents } from "@/lib/pricing";

const PLATFORM_ICONS: Record<string, { icon: typeof FaInstagram; color: string }> = {
  instagram: { icon: FaInstagram, color: "text-pink-500" },
  tiktok: { icon: FaTiktok, color: "text-white" },
  facebook: { icon: FaFacebook, color: "text-blue-500" },
};

type Tier = { qty: string; qtyValue: number; priceCents: number; highlight?: boolean };
type ServiceDoc = {
  _id: string;
  platformId: string;
  platformLabel: string;
  category: string;
  tiers: Tier[];
};

export default function NewOrderForm() {
  const router = useRouter();
  const { update } = useSession();

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [platformId, setPlatformId] = useState<string>("");
  const [qtyValue, setQtyValue] = useState<number | null>(null);
  const [targetLink, setTargetLink] = useState("");
  const [paymentSource, setPaymentSource] = useState<"wallet" | "card">("wallet");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services ?? []);
        if (data.services?.length) {
          setPlatformId(data.services[0].platformId);
          setQtyValue(data.services[0].tiers[0]?.qtyValue ?? null);
        }
      })
      .finally(() => setLoadingServices(false));
  }, []);

  const currentService = useMemo(
    () => services.find((s) => s.platformId === platformId),
    [services, platformId]
  );

  const selectedTier = useMemo(
    () => currentService?.tiers.find((t) => t.qtyValue === qtyValue) ?? currentService?.tiers[0],
    [currentService, qtyValue]
  );

  function handlePlatformChange(id: string) {
    setPlatformId(id);
    const svc = services.find((s) => s.platformId === id);
    setQtyValue(svc?.tiers[0]?.qtyValue ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentService || !selectedTier) return;
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: currentService._id,
        qtyValue: selectedTier.qtyValue,
        targetLink,
        paymentSource,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      if (res.status === 402) {
        setError(
          `Insufficient wallet balance. You need $${((data.shortfallCents ?? 0) / 100).toFixed(2)} more.`
        );
      } else {
        setError(data.error ?? "Something went wrong");
      }
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    await update();
    router.push("/dashboard/orders");
    router.refresh();
  }

  if (loadingServices) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
        No services available right now.
      </div>
    );
  }

  const chargeCents =
    paymentSource === "wallet"
      ? walletPriceCents(selectedTier?.priceCents ?? 0)
      : selectedTier?.priceCents ?? 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium text-white/50">Platform</label>
        <div className="grid grid-cols-3 gap-2">
          {services.map((svc) => {
            const meta = PLATFORM_ICONS[svc.platformId];
            const Icon = meta?.icon;
            const active = platformId === svc.platformId;
            return (
              <button
                key={svc.platformId}
                type="button"
                onClick={() => handlePlatformChange(svc.platformId)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                  active
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {Icon && <Icon className={`h-5 w-5 ${meta.color}`} />}
                {svc.platformLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-white/50">Quantity</label>
        <div className="grid grid-cols-4 gap-2">
          {currentService?.tiers.map((tier) => (
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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Profile Link</label>
        <input
          type="url"
          required
          value={targetLink}
          onChange={(e) => setTargetLink(e.target.value)}
          placeholder="https://instagram.com/yourprofile"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-white/50">Payment method</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentSource("wallet")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              paymentSource === "wallet"
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Wallet (-15%)
          </button>
          <button
            type="button"
            onClick={() => setPaymentSource("card")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              paymentSource === "card"
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-white/50">Total price</span>
        <span className="text-2xl font-bold text-gradient">${(chargeCents / 100).toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {paymentSource === "card" ? "Continue to payment" : "Place order"}
      </button>
    </form>
  );
}
