"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import {
  PackageOpen,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import OrderExtras, {
  type OrderExtrasData,
} from "@/components/shared/OrderExtras";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type ProviderId,
} from "@/lib/supplier/providers";

export type AdminOrderRow = OrderExtrasData & {
  _id: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  targetLink?: string;
  priceCents: number;
  status: string;
  paymentSource: string;
  serviceKind?: "standard" | "auto" | "comments" | "poll";
  supplierOrderId?: string | null;
  supplierProvider?: ProviderId | null;
  supplierRefillId?: string | null;
  merchantRefillPolicy?: boolean;
  merchantRefillHistory?: NonNullable<AdminOrderRow["merchantRefill"]>[];
  merchantRefill?: {
    status: "requested" | "completed";
    quantity: number;
    targetLink: string;
    reason: string;
    externalOrderId?: string;
  } | null;
  platformId?: string;
  customerEmail?: string;
  paymentConfirmedAt?: string | null;
  refundedCents?: number;
  checkoutGroupId?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  cryptoCheckoutId?: string | null;
  supplierServiceIdUsed?: string | null;
  supplierActionPending?: string | null;
  supplierStatus?: string | null;
  failureReason?: string | null;
  createdAt: string;
  userId: { name?: string; email?: string } | string | null;
};

const STATUSES = ["pending", "processing", "completed", "failed", "cancelled"];

export default function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [rows, setRows] = useState(orders);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [providerOverrides, setProviderOverrides] = useState<
    Record<string, string>
  >({});

  async function providerAction(order: AdminOrderRow, action: string) {
    let quantity: number | undefined;
    let reason: string | undefined;
    let targetLink: string | undefined;
    if (action === "requestReplacement") {
      const input = prompt(
        `Verified missing quantity (1–${order.qtyValue}). This queues a merchant-funded replacement; it does not place a paid order.`,
      );
      if (!input) return;
      quantity = Number(input);
      reason =
        prompt("How did you verify the drop or missing delivery?") || undefined;
      if (!reason) return;
      targetLink =
        order.serviceKind === "auto"
          ? prompt(
              "Public post URL needing the replacement (verify it belongs to the customer)",
            ) || undefined
          : order.targetLink;
      if (!targetLink) return;
    }
    if (
      ["cancel", "refill"].includes(action) &&
      !confirm(
        `${action === "cancel" ? "Request cancellation" : "Request a refill"} with the provider? Provider approval is required. This does not issue a customer refund.`,
      )
    )
      return;
    const supplierOrderId = ["reconcile", "completeReplacement"].includes(
      action,
    )
      ? prompt(
          "Enter the verified order ID from the provider account originally used. This links it without placing another order.",
        )
      : undefined;
    if (
      ["reconcile", "completeReplacement"].includes(action) &&
      !supplierOrderId
    )
      return;
    setDispatchingId(order._id);
    try {
      const response = await fetch(`/api/admin/orders/${order._id}/supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          provider: order.supplierProvider,
          supplierOrderId,
          quantity,
          reason,
          targetLink,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Supplier action failed");
      const updated = data.result.order || data.result;
      setRows((previous) =>
        previous.map((row) =>
          row._id === order._id
            ? { ...row, ...updated, userId: row.userId }
            : row,
        ),
      );
      toast.success(
        data.result.refillStatus
          ? `Refill: ${data.result.refillStatus.status}`
          : "Provider action completed",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Supplier action failed",
      );
    } finally {
      setDispatchingId(null);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);

    if (res.ok) {
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      toast.success("Order status updated");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update order status");
    }
  }

  async function handleDispatch(order: AdminOrderRow) {
    setDispatchingId(order._id);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerOverrides[order._id] || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to dispatch order to supplier");
        if (data.order) {
          setRows((prev) =>
            prev.map((r) =>
              r._id === order._id ? { ...r, ...data.order } : r,
            ),
          );
        }
        return;
      }

      toast.success(data.message || "Dispatched to supplier");
      if (data.order) {
        setRows((prev) =>
          prev.map((r) =>
            r._id === order._id
              ? {
                  ...r,
                  supplierOrderId: data.order.supplierOrderId,
                  supplierProvider: data.order.supplierProvider,
                  supplierStatus: data.order.supplierStatus,
                  status: data.order.status,
                  failureReason: null,
                }
              : r,
          ),
        );
      }
    } catch {
      toast.error("Network error dispatching order");
    } finally {
      setDispatchingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No orders yet"
        description="Orders placed by customers will appear here."
      />
    );
  }

  return (
    <Card className="overflow-x-auto border-border bg-card p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Target Link</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date & Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order, i) => {
            const user = typeof order.userId === "object" ? order.userId : null;
            const isDispatched = Boolean(order.supplierOrderId);
            const isDispatching = dispatchingId === order._id;

            return (
              <motion.tr
                key={order._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
              >
                <TableCell>
                  <div className="font-medium text-foreground">
                    {user?.name ?? "Guest"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.customerEmail || user?.email || "Email not recorded"}
                  </div>
                  <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                    {order._id}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-medium">{order.platformLabel}</span>{" "}
                  <span className="text-muted-foreground">
                    {order.category}
                  </span>
                  <OrderExtras order={order} showComments />
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-brand-600">
                      Payment & processing details
                    </summary>
                    <dl className="mt-2 max-w-72 space-y-1 break-all text-muted-foreground">
                      {[
                        ["Checkout", order.checkoutGroupId],
                        [
                          "Processor",
                          order.paymentSource === "card"
                            ? "Stripe"
                            : order.paymentSource === "crypto"
                              ? "NOWPayments"
                              : order.paymentSource,
                        ],
                        ["Stripe session", order.stripeSessionId],
                        ["Payment intent", order.stripePaymentIntentId],
                        ["Crypto checkout", order.cryptoCheckoutId],
                        ["Supplier service ID", order.supplierServiceIdUsed],
                        ["Supplier status", order.supplierStatus],
                        [
                          "Pending supplier action",
                          order.supplierActionPending,
                        ],
                        ["Processing error", order.failureReason],
                      ]
                        .filter(([, value]) => value)
                        .map(([label, value]) => (
                          <div key={label}>
                            <dt className="font-medium">{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                    </dl>
                  </details>
                </TableCell>

                <TableCell className="max-w-[200px]">
                  {order.targetLink ? (
                    <a
                      href={
                        order.targetLink.startsWith("http")
                          ? order.targetLink
                          : `https://${order.targetLink}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand-500 hover:text-brand-400 hover:underline"
                      title={order.targetLink}
                    >
                      <span className="truncate max-w-[150px]">
                        {order.targetLink}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-foreground/80 font-mono text-xs">
                  {order.qtyValue.toLocaleString()}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className="capitalize text-[11px] font-normal"
                  >
                    {order.paymentSource}
                  </Badge>
                </TableCell>

                <TableCell className="text-foreground/80 font-medium">
                  ${(order.priceCents / 100).toFixed(2)}
                  <div className="text-[10px] text-muted-foreground">
                    {order.paymentSource === "bonus"
                      ? "Free bonus"
                      : order.paymentConfirmedAt
                        ? "Payment confirmed"
                        : "Payment unconfirmed"}
                  </div>
                  {!!order.refundedCents && (
                    <div className="text-[10px] text-amber-600">
                      ${(order.refundedCents / 100).toFixed(2)} refunded
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    {isDispatched ? (
                      <Badge
                        variant="outline"
                        className="border-brand-500/30 bg-brand-500/10 text-brand-400 font-mono text-[11px]"
                      >
                        {PROVIDER_LABELS[order.supplierProvider || "peakerr"]} #
                        {order.supplierOrderId}
                      </Badge>
                    ) : order.supplierStatus === "submission_error" ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[11px]"
                          title={
                            order.failureReason || "Error sending to supplier"
                          }
                        >
                          <AlertCircle className="mr-1 h-3 w-3" /> Error
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDispatching}
                          onClick={() => handleDispatch(order)}
                          className="h-6 px-1.5 text-[11px] text-brand-500 hover:text-brand-400"
                        >
                          {isDispatching ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Retry"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px]"
                        >
                          Manual
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDispatching}
                          onClick={() => handleDispatch(order)}
                          className="h-6 px-2 text-[11px] text-brand-500 hover:text-brand-400 gap-1"
                        >
                          {isDispatching ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-2.5 w-2.5" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  {!isDispatched &&
                    !["dispatching", "dispatch_unknown"].includes(
                      order.supplierStatus || "",
                    ) && (
                      <select
                        aria-label={`Dispatch provider for ${order._id}`}
                        className="mt-2 max-w-40 rounded border border-border bg-card p-1 text-xs"
                        value={providerOverrides[order._id] || ""}
                        onChange={(event) =>
                          setProviderOverrides((previous) => ({
                            ...previous,
                            [order._id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Service default</option>
                        {PROVIDERS.filter(
                          (provider) =>
                            provider !== "tiksta" ||
                            order.platformId === "tiktok",
                        ).map((provider) => (
                          <option key={provider} value={provider}>
                            {PROVIDER_LABELS[provider]}
                          </option>
                        ))}
                      </select>
                    )}
                  <div className="mt-2 flex max-w-52 flex-wrap gap-1">
                    {isDispatched && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDispatching}
                          onClick={() => providerAction(order, "sync")}
                        >
                          Refresh status
                        </Button>
                        {!["completed", "cancelled", "failed"].includes(
                          order.status,
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDispatching}
                            onClick={() => providerAction(order, "cancel")}
                          >
                            Cancel at provider
                          </Button>
                        )}
                        {order.status === "completed" &&
                          (!order.merchantRefillPolicy ||
                            order.supplierRefillId) &&
                          !order.merchantRefill && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isDispatching}
                              onClick={() =>
                                providerAction(
                                  order,
                                  order.supplierRefillId
                                    ? "refillStatus"
                                    : "refill",
                                )
                              }
                            >
                              {order.supplierRefillId
                                ? "Refill status"
                                : "Request refill"}
                            </Button>
                          )}
                        {(order.status === "completed" ||
                          (order.serviceKind === "auto" &&
                            order.status === "processing")) &&
                          !order.supplierRefillId &&
                          order.merchantRefill?.status !== "requested" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isDispatching}
                              onClick={() =>
                                providerAction(order, "requestReplacement")
                              }
                            >
                              Queue merchant replacement
                            </Button>
                          )}
                        {order.merchantRefill && (
                          <p className="text-xs text-muted-foreground">
                            Merchant replacement: {order.merchantRefill.status},{" "}
                            {order.merchantRefill.quantity} units.{" "}
                            {order.merchantRefill.reason}
                          </p>
                        )}
                        {Boolean(order.merchantRefillHistory?.length) && (
                          <details className="text-xs text-muted-foreground">
                            <summary>
                              Previous replacements (
                              {order.merchantRefillHistory!.length})
                            </summary>
                            {order.merchantRefillHistory!.map(
                              (entry, index) => (
                                <p key={index}>
                                  {entry.quantity} units · {entry.targetLink} ·{" "}
                                  {entry.reason} · #{entry.externalOrderId}
                                </p>
                              ),
                            )}
                          </details>
                        )}
                        {order.merchantRefill?.status === "requested" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDispatching}
                            onClick={() =>
                              providerAction(order, "completeReplacement")
                            }
                          >
                            Verify completed replacement
                          </Button>
                        )}
                      </>
                    )}
                    {!isDispatched &&
                      ["dispatching", "dispatch_unknown"].includes(
                        order.supplierStatus || "",
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDispatching}
                          onClick={() => providerAction(order, "reconcile")}
                        >
                          Link verified provider order
                        </Button>
                      )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <Select
                      value={order.status}
                      disabled={updating === order._id}
                      onValueChange={(value) =>
                        handleStatusChange(order._id, value as string)
                      }
                    >
                      <SelectTrigger size="sm" className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div className="font-medium text-foreground">
                    {formatDateTime(order.createdAt).date}
                  </div>
                  <div className="text-[11px] text-muted-foreground/75 font-mono">
                    {formatDateTime(order.createdAt).time}
                  </div>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
