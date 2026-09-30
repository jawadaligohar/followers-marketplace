"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Wallet, CreditCard, Trash2, ShieldCheck } from "lucide-react";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa6";
import { useCart } from "@/lib/cart/CartContext";
import { walletPriceCents } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { PackageOpen } from "lucide-react";

const PLATFORM_ICONS: Record<string, { icon: typeof FaInstagram; color: string }> = {
  instagram: { icon: FaInstagram, color: "text-pink-500" },
  tiktok: { icon: FaTiktok, color: "text-white" },
  facebook: { icon: FaFacebook, color: "text-blue-500" },
};

export default function CheckoutPageClient() {
  const router = useRouter();
  const { items, removeItem, updateLink, clear, totalCents } = useCart();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const [guestEmail, setGuestEmail] = useState("");
  const [paymentSource, setPaymentSource] = useState<"wallet" | "card">(isAuthed ? "wallet" : "card");
  const [submitting, setSubmitting] = useState(false);

  const chargeCents =
    paymentSource === "wallet" ? walletPriceCents(totalCents) : totalCents;

  async function handleCheckout() {
    if (items.some((i) => !i.targetLink.trim())) {
      toast.error("Add a profile link for every item in your cart");
      return;
    }
    if (!isAuthed && !guestEmail.trim()) {
      toast.error("Enter your email to continue as a guest");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          serviceId: i.serviceId,
          qtyValue: i.qtyValue,
          targetLink: i.targetLink,
        })),
        paymentSource,
        guestEmail: isAuthed ? undefined : guestEmail.trim(),
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

    clear();
    toast.success("Order placed");
    router.push(isAuthed ? "/dashboard/orders" : "/checkout/success");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <EmptyState
          icon={PackageOpen}
          title="Your cart is empty"
          description="Add a service from the homepage to get started."
        >
          <Button variant="brand" className="mt-5" render={<Link href="/#pricing" />}>
            Browse services
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review your order, add your profile links, and pay securely.
      </p>

      <div className="mt-8 space-y-4">
        {items.map((item, i) => {
          const meta = PLATFORM_ICONS[item.platformId];
          const Icon = meta?.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        {Icon && <Icon className={`h-4 w-4 ${meta.color}`} />}
                      </span>
                      <div>
                        <div className="text-sm font-medium">
                          {item.platformLabel} {item.category}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.qty}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        ${(item.priceCents / 100).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-white/30 transition hover:text-red-400"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Input
                    value={item.targetLink}
                    onChange={(e) => updateLink(item.id, e.target.value)}
                    placeholder={`https://${item.platformId}.com/yourprofile`}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {!isAuthed && (
        <Card className="mt-6 border-white/10 bg-white/[0.03]">
          <CardContent className="space-y-1.5">
            <Label htmlFor="guest-email" className="text-xs text-muted-foreground">
              Email (for your receipt and order updates)
            </Label>
            <Input
              id="guest-email"
              type="email"
              required
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <p className="pt-1 text-xs text-white/30">
              No account needed.{" "}
              <Link href="/signup" className="text-accent-500 hover:underline">
                Sign in
              </Link>{" "}
              to pay from your wallet and save 15%.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Label className="mb-2 text-xs text-muted-foreground">Payment method</Label>
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            onClick={() => isAuthed && setPaymentSource("wallet")}
            disabled={!isAuthed}
            whileTap={isAuthed ? { scale: 0.97 } : undefined}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              paymentSource === "wallet"
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 text-white/50 hover:border-white/20"
            } ${!isAuthed ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <Wallet className="h-4 w-4" />
            Wallet {isAuthed ? "(-15%)" : "(sign in)"}
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

      <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-bold text-gradient">
          ${(chargeCents / 100).toFixed(2)}
        </span>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          variant="brand"
          disabled={submitting}
          onClick={handleCheckout}
          className="mt-4 flex w-full items-center justify-center gap-2 py-5"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {paymentSource === "card" ? "Continue to payment" : "Pay from wallet"}
        </Button>
      </motion.div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-white/30">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure checkout &middot; no password ever required
      </p>
    </div>
  );
}
