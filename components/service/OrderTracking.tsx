"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import OrderExtras from "@/components/shared/OrderExtras";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
type TrackingData = {
  orders: {
    id: string;
    platformLabel: string;
    platformId: string;
    category: string;
    qtyValue: number;
    status: string;
    priceCents: number;
    refundedCents?: number;
    paymentConfirmed: boolean;
    postsCovered?: number;
    pollOption?: number;
  }[];
  bonusAvailable: boolean;
  bankTransfer?: {
    reference: string;
    amountCents: number;
    confirmed: boolean;
    instructions: string;
  };
  error?: string;
};
export default function OrderTracking({
  token,
  initialOrderId,
  mode = "track",
}: {
  token?: string;
  initialOrderId?: string;
  mode?: "track" | "bonus" | "bank";
}) {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(Boolean(token));
  const [orderId, setOrderId] = useState(initialOrderId || "");
  const [email, setEmail] = useState("");
  const [targetLink, setTargetLink] = useState("");
  async function lookup() {
    const response = await fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(token ? { token } : { orderId, email: email || undefined }),
      }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not find the order");
    setData(result);
  }
  useEffect(() => {
    if (!token && !initialOrderId) return;
    let cancelled = false;
    fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, orderId: initialOrderId }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load your order");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, initialOrderId]);
  async function search(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await lookup();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your order");
    } finally {
      setBusy(false);
    }
  }
  async function claim(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/bonus/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          orderId: token ? undefined : data?.orders[0]?.id || orderId,
          targetLink,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.push(
        `/track-order?token=${encodeURIComponent(result.trackingToken)}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not claim the bonus");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      {!token && (
        <form onSubmit={search} className="space-y-3">
          <Label htmlFor="track-id">Order ID</Label>
          <Input
            id="track-id"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            required
          />
          <Label htmlFor="track-email">Checkout email (for guest orders)</Label>
          <Input
            id="track-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            Find order
          </Button>
        </form>
      )}
      {busy && (
        <p className="text-sm text-muted-foreground">Loading your order…</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {data?.bankTransfer && (
        <Card className="p-5">
          <h2 className="font-semibold">
            {data.bankTransfer.confirmed
              ? "Bank payment confirmed"
              : "Complete your bank transfer"}
          </h2>
          <p className="mt-2">
            Amount:{" "}
            <strong>
              ${(data.bankTransfer.amountCents / 100).toFixed(2)} USD
            </strong>
          </p>
          <p className="mt-2 break-all text-sm">
            Reference: <strong>{data.bankTransfer.reference}</strong>
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {data.bankTransfer.instructions ||
              "Receiving details are being updated. Contact support before sending a payment."}
          </p>
          {!data.bankTransfer.confirmed && (
            <p className="mt-3 text-xs text-muted-foreground">
              Orders and wallet credit are released after staff confirm receipt.
              Include the reference with your payment.
            </p>
          )}
        </Card>
      )}
      {data?.orders.map((order) => (
        <Card key={order.id} className="p-5">
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">
              {order.qtyValue.toLocaleString()} {order.platformLabel}{" "}
              {order.category}
            </h3>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            Order ID: {order.id}
          </p>
          <OrderExtras order={order} />
        {Boolean(order.refundedCents) && <p className="mt-2 text-sm text-muted-foreground">Refunded: ${(order.refundedCents! / 100).toFixed(2)}</p>}
          <p className="mt-2 text-sm">
            ${(order.priceCents / 100).toFixed(2)} ·{" "}
            {order.paymentConfirmed || !order.priceCents
              ? "Payment confirmed"
              : "Waiting for payment confirmation"}
          </p>
        </Card>
      ))}
      {data?.bonusAvailable && (token || status === "authenticated") && (
        <form
          onSubmit={claim}
          className="rounded-2xl border border-brand-500/30 bg-brand-50 p-5"
        >
          <h2 className="font-semibold">
            Claim your 50 free {data.orders[0]?.platformLabel} likes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose one public post. The bonus platform follows the first item in
            your checkout.
          </p>
          <Label htmlFor="bonus-link" className="mt-4 mb-2 block">
            Public post URL
          </Label>
          <Input
            id="bonus-link"
            type="url"
            value={targetLink}
            onChange={(e) => setTargetLink(e.target.value)}
            required
          />
          <Button type="submit" className="mt-3" disabled={busy}>
            Claim 50 free likes
          </Button>
        </form>
      )}
      {data && mode === "bonus" && !data.bonusAvailable && (
        <p className="text-sm text-muted-foreground">
          The bonus becomes available after payment confirmation. A paid
          checkout can be claimed once.
        </p>
      )}
      {data && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            lookup()
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          Refresh status
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        <Link href="/contact" className="text-brand-600 hover:underline">
          Contact support
        </Link>{" "}
        if you need help with this package.
      </p>
    </div>
  );
}
