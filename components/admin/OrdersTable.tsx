"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { PackageOpen, ExternalLink, Send, Loader2, AlertCircle } from "lucide-react";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/shared/EmptyState";
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

export type AdminOrderRow = {
  _id: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  targetLink?: string;
  priceCents: number;
  status: string;
  paymentSource: string;
  supplierOrderId?: string | null;
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
      toast.error("Failed to update order status");
    }
  }

  async function handleDispatch(order: AdminOrderRow) {
    setDispatchingId(order._id);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to dispatch order to Peakerr");
        if (data.order) {
          setRows((prev) => prev.map((r) => (r._id === order._id ? { ...r, ...data.order } : r)));
        }
        return;
      }

      toast.success(data.message || "Dispatched to Peakerr");
      if (data.order) {
        setRows((prev) =>
          prev.map((r) =>
            r._id === order._id
              ? {
                  ...r,
                  supplierOrderId: data.order.supplierOrderId,
                  supplierStatus: data.order.supplierStatus,
                  status: data.order.status,
                  failureReason: null,
                }
              : r
          )
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
                  <div className="font-medium text-foreground">{user?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </TableCell>

                <TableCell>
                  <span className="font-medium">{order.platformLabel}</span>{" "}
                  <span className="text-muted-foreground">{order.category}</span>
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
                      <span className="truncate max-w-[150px]">{order.targetLink}</span>
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
                  <Badge variant="outline" className="capitalize text-[11px] font-normal">
                    {order.paymentSource}
                  </Badge>
                </TableCell>

                <TableCell className="text-foreground/80 font-medium">
                  ${(order.priceCents / 100).toFixed(2)}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    {isDispatched ? (
                      <Badge
                        variant="outline"
                        className="border-brand-500/30 bg-brand-500/10 text-brand-400 font-mono text-[11px]"
                      >
                        Peakerr #{order.supplierOrderId}
                      </Badge>
                    ) : order.supplierStatus === "submission_error" ? (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[11px]"
                          title={order.failureReason || "Error sending to supplier"}
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
                          {isDispatching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Retry"}
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
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <Select
                      value={order.status}
                      disabled={updating === order._id}
                      onValueChange={(value) => handleStatusChange(order._id, value as string)}
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
                  <div className="font-medium text-foreground">{formatDateTime(order.createdAt).date}</div>
                  <div className="text-[11px] text-muted-foreground/75 font-mono">{formatDateTime(order.createdAt).time}</div>
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
