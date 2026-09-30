"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Wallet, CreditCard } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa6";
import { walletPriceCents } from "@/lib/pricing";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

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
        toast.error(
          `Insufficient wallet balance. You need $${((data.shortfallCents ?? 0) / 100).toFixed(2)} more.`
        );
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    await update();
    toast.success("Order placed");
    router.push("/dashboard/orders");
    router.refresh();
  }

  if (loadingServices) {
    return (
      <div className="max-w-xl space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.03] p-10 text-center text-sm text-muted-foreground">
        No services available right now.
      </Card>
    );
  }

  const chargeCents =
    paymentSource === "wallet"
      ? walletPriceCents(selectedTier?.priceCents ?? 0)
      : selectedTier?.priceCents ?? 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <Label className="mb-2 text-xs text-muted-foreground">Platform</Label>
        <div className="grid grid-cols-3 gap-2">
          {services.map((svc) => {
            const meta = PLATFORM_ICONS[svc.platformId];
            const Icon = meta?.icon;
            const active = platformId === svc.platformId;
            return (
              <motion.button
                key={svc.platformId}
                type="button"
                onClick={() => handlePlatformChange(svc.platformId)}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                  active
                    ? "border-brand-500 bg-brand-500/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {Icon && <Icon className={`h-5 w-5 ${meta.color}`} />}
                {svc.platformLabel}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="mb-2 text-xs text-muted-foreground">Quantity</Label>
        <div className="grid grid-cols-4 gap-2">
          {currentService?.tiers.map((tier) => (
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

      <div className="space-y-1.5">
        <Label htmlFor="target-link" className="text-xs text-muted-foreground">
          Profile Link
        </Label>
        <Input
          id="target-link"
          type="url"
          required
          value={targetLink}
          onChange={(e) => setTargetLink(e.target.value)}
          placeholder="https://instagram.com/yourprofile"
        />
      </div>

      <div>
        <Label className="mb-2 text-xs text-muted-foreground">Payment method</Label>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            onClick={() => setPaymentSource("wallet")}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              paymentSource === "wallet"
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            <Wallet className="h-4 w-4" />
            Wallet (-15%)
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setPaymentSource("card")}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              paymentSource === "card"
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Card
          </motion.button>
        </div>
      </div>

      <div className="flex items-center justify-between overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total price</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`${platformId}-${qtyValue}-${paymentSource}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold text-gradient"
          >
            ${(chargeCents / 100).toFixed(2)}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          variant="brand"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 py-5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {paymentSource === "card" ? "Continue to payment" : "Place order"}
        </Button>
      </motion.div>
    </form>
  );
}
